"""Unit and ASGI contract tests for the TrackFlow Operations MCP server."""

from __future__ import annotations

import importlib
import httpx
import pytest
from starlette.requests import Request


@pytest.fixture
def server(monkeypatch):
    from mcpauth.config import AuthServerConfig, AuthServerType, AuthorizationServerMetadata
    from mcpauth.utils import fetch_server_config

    monkeypatch.setenv("MCP_AUTH_ISSUER", "https://issuer.example.test")
    monkeypatch.setenv("MCP_AUTH_RESOURCE", "http://localhost:8001")
    monkeypatch.delenv("MCP_AUTH_SCOPES", raising=False)
    auth_module = importlib.import_module("mcps.trackflow_tools_mcp.auth")
    monkeypatch.setattr(
        auth_module,
        "fetch_server_config",
        lambda issuer, server_type: AuthServerConfig(
            metadata=AuthorizationServerMetadata(
                issuer=issuer,
                authorization_endpoint=f"{issuer}/authorize",
                token_endpoint=f"{issuer}/token",
                jwks_uri=f"{issuer}/.well-known/jwks.json",
                response_types_supported=["code"],
            ),
            type=server_type,
        ),
    )
    monkeypatch.delenv("TRACKFLOW_API_BEARER_TOKEN", raising=False)
    module = importlib.import_module("mcps.trackflow_tools_mcp.server")
    return importlib.reload(module)


def test_metadata_and_health_are_public(server):
    client = httpx.ASGITransport(app=server.app)

    async def request():
        async with httpx.AsyncClient(transport=client, base_url="http://test") as http:
            metadata = await http.get("/.well-known/oauth-protected-resource")
            health = await http.get("/health")
            return metadata, health

    metadata, health = __import__("asyncio").run(request())
    assert metadata.status_code == 200
    assert metadata.json()["resource"] == "http://localhost:8001"
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}


@pytest.mark.asyncio
@pytest.mark.parametrize("authorization", [None, "Bearer not-a-valid-jwt"])
async def test_mcp_protocol_requires_valid_bearer_for_initialize_list_and_call(server, authorization):
    transport = httpx.ASGITransport(app=server.app)
    headers = {"Authorization": authorization} if authorization else {}
    requests = [
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
            "protocolVersion": "2025-03-26", "capabilities": {},
            "clientInfo": {"name": "security-test", "version": "1"},
        }},
        {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
        {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {
            "name": "inventory_list_products", "arguments": {},
        }},
    ]
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        responses = [await client.post("/", json=body, headers=headers) for body in requests]

    assert [response.status_code for response in responses] == [401, 401, 401]
    assert all("www-authenticate" in response.headers for response in responses)


@pytest.mark.asyncio
async def test_each_data_tool_enforces_its_own_scope_without_api_access(server, monkeypatch):
    from fastmcp import FastMCP
    from mcpauth import MCPAuth
    from mcpauth.types import AuthInfo

    captured = {}
    original_http_app = FastMCP.http_app
    original_auth_middleware = MCPAuth.bearer_auth_middleware

    def capture_http_app(self, *args, **kwargs):
        captured["mcp"] = self
        return original_http_app(self, *args, **kwargs)

    def capture_auth_middleware(self, *args, **kwargs):
        captured["auth"] = self
        return original_auth_middleware(self, *args, **kwargs)

    monkeypatch.setattr(FastMCP, "http_app", capture_http_app)
    monkeypatch.setattr(MCPAuth, "bearer_auth_middleware", capture_auth_middleware)

    class NoApiAccess:
        async def request(self, *args, **kwargs):
            pytest.fail("A call denied for missing scope must not reach the API")

    server.create_mcp_app(api=NoApiAccess())
    cases = [
        ("incidents_create", {
            "title": "Test", "description": "Valid description", "category": "other",
            "origin": "internal", "branch": "central",
        }, "incidents:read"),
        ("incidents_get", {"incident_id": 1}, "inventory:read"),
        ("incidents_update_status", {"incident_id": 1, "status": "resolved"}, "incidents:read"),
        ("inventory_list_products", {}, "incidents:read"),
        ("inventory_get_product", {"product_id": 1}, "incidents:read"),
    ]

    for tool_name, arguments, unrelated_scope in cases:
        captured["auth"]._context_var.set(
            AuthInfo(
                token="synthetic-test-token", issuer="https://issuer.example.test",
                client_id="local-test", scopes=[unrelated_scope], subject="local-test",
                claims={"client_id": "local-test"},
            )
        )
        from fastmcp.exceptions import ToolError
        from mcpauth.exceptions import BearerAuthExceptionCode, MCPAuthBearerAuthException

        # FastMCP wraps exceptions raised inside a tool handler in ToolError;
        # retain and assert the underlying MCP Auth denial.
        with pytest.raises(ToolError) as error:
            await captured["mcp"].call_tool(tool_name, arguments)
        assert isinstance(error.value.__cause__, MCPAuthBearerAuthException)
        assert error.value.__cause__.code == BearerAuthExceptionCode.MISSING_REQUIRED_SCOPES


@pytest.mark.asyncio
async def test_http_scope_gate_returns_403_logs_client_tool_and_preserves_body(server, caplog):
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from mcpauth.types import AuthInfo

    auth = server._DEFAULT_AUTH
    app = FastAPI()

    @app.post("/")
    async def echo_body(request: Request):
        return JSONResponse(await request.json())

    app.add_middleware(
        server._ToolScopeHttpMiddleware,
        auth=auth,
        resource="http://localhost:8001",
    )
    body = {
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": "inventory_list_products", "arguments": {}},
    }
    transport = httpx.ASGITransport(app=app)

    auth._context_var.set(
        AuthInfo(
            token="synthetic-test-token", issuer="https://issuer.example.test",
            client_id="local-test", scopes=["incidents:read"], subject="local-test",
            claims={"client_id": "local-test"},
        )
    )
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        denied = await client.post("/", json=body)
    assert denied.status_code == 403
    assert "insufficient_scope" in denied.headers["www-authenticate"]
    denial = next(record for record in caplog.records if record.message == "mcp_tool_invocation")
    assert denial.tool == "inventory_list_products"
    assert denial.client == "local-test"
    assert denial.result == "denied"
    assert denial.error_code == "AUTH_FORBIDDEN"
    assert "synthetic-test-token" not in denial.getMessage()

    auth._context_var.set(
        AuthInfo(
            token="synthetic-test-token", issuer="https://issuer.example.test",
            client_id="local-test", scopes=["inventory:read"], subject="local-test",
            claims={"client_id": "local-test"},
        )
    )
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        allowed = await client.post("/", json=body)
    assert allowed.status_code == 200
    assert allowed.json() == body


def test_tool_scope_is_enforced_without_forwarding_user_bearer(server, monkeypatch):
    class AuthInfo:
        token = "verified-oauth-token"
        scopes = {"incidents:write"}

    class Auth:
        auth_info = AuthInfo()

    assert server._authorized_token(Auth(), "incidents:write") is None
    from mcpauth.exceptions import BearerAuthExceptionCode, MCPAuthBearerAuthException

    with pytest.raises(MCPAuthBearerAuthException) as error:
        server._authorized_token(Auth(), "incidents:read")
    assert error.value.code == BearerAuthExceptionCode.MISSING_REQUIRED_SCOPES

    monkeypatch.setenv("MCP_API_SERVICE_TOKEN", "internal-api-token")
    assert server._authorized_token(Auth(), "incidents:write") is None


def test_http_origin_allowlists_are_passed_only_when_configured(server, monkeypatch):
    from fastmcp import FastMCP

    captured = {}
    original_http_app = FastMCP.http_app

    def capture_http_app(self, *args, **kwargs):
        captured.update(kwargs)
        return original_http_app(self, *args, **kwargs)

    monkeypatch.setattr(FastMCP, "http_app", capture_http_app)
    monkeypatch.setenv("MCP_ALLOWED_HOSTS", "mcp.example.test, mcp-alt.example.test")
    monkeypatch.setenv("MCP_ALLOWED_ORIGINS", "https://playground.example.test")

    server.create_mcp_app()

    assert captured["allowed_hosts"] == ["mcp.example.test", "mcp-alt.example.test"]
    assert captured["allowed_origins"] == ["https://playground.example.test"]


@pytest.mark.asyncio
async def test_api_calls_use_service_credential_not_user_bearer(server):
    calls = []

    async def handler(request: httpx.Request):
        calls.append((request.method, request.url.path, request.headers.get("authorization")))
        return httpx.Response(200, json={"id": 1, "status": "open"})

    api = server.TrackFlowApi(base_url="http://trackflow.test", service_token="service-secret", transport=httpx.MockTransport(handler))
    assert await api.request("POST", "/api/incidents", json={"title": "x"}) == {
        "id": 1, "status": "open"
    }
    assert await api.request("PATCH", "/api/incidents/1/status", json={"status": "resolved"})
    assert await api.request("GET", "/inventory/products", params={"warehouse": "LA"})
    assert [call[:2] for call in calls] == [
        ("POST", "/api/incidents"),
        ("PATCH", "/api/incidents/1/status"),
        ("GET", "/inventory/products"),
    ]
    assert all(call[2] == "Bearer service-secret" for call in calls)


@pytest.mark.asyncio
async def test_api_calls_fail_closed_without_service_credential(server):
    api = server.TrackFlowApi(base_url="http://trackflow.test", service_token="")
    with pytest.raises(server.ServiceError, match="service_credentials_not_configured"):
        await api.request("GET", "/inventory/products")


def test_inventory_write_deny_is_tool_and_has_no_write_routes(server):
    # FastMCP's tool registry is the source of discoverability; there is no
    # inventory POST/PATCH/DELETE method in the API client's allowlist.
    assert server.TrackFlowApi.request.__annotations__["method"] == "str"
    import inspect

    source = inspect.getsource(server.TrackFlowApi.request)
    assert '"GET", "POST", "PATCH"' in source
    assert "DELETE" not in source
    assert "inventory_reject_write" in inspect.getsource(server.create_mcp_app)


@pytest.mark.asyncio
async def test_mcp_discovery_exposes_tool_input_and_output_schemas(server, monkeypatch):
    from fastmcp import FastMCP

    captured = {}
    original_http_app = FastMCP.http_app

    def capture_http_app(self, *args, **kwargs):
        captured["mcp"] = self
        return original_http_app(self, *args, **kwargs)

    monkeypatch.setattr(FastMCP, "http_app", capture_http_app)
    server.create_mcp_app()
    discovered = {tool.name: tool for tool in await captured["mcp"].list_tools()}

    assert {
        "incidents_create",
        "incidents_get",
        "incidents_update_status",
        "inventory_list_products",
        "inventory_get_product",
        "inventory_reject_write",
    } <= discovered.keys()
    for tool in discovered.values():
        assert tool.description
        assert isinstance(tool.parameters.get("properties"), dict)

    incident_output = discovered["incidents_get"].output_schema
    assert incident_output["properties"]["id"]["type"] == "integer"
    assert "status" in incident_output["properties"]

    product_output = discovered["inventory_get_product"].output_schema
    assert product_output["properties"]["sku_code"]["type"] == "string"
    list_output = discovered["inventory_list_products"].output_schema
    assert list_output["properties"]["result"]["items"]["properties"]["current_stock"]["type"] == "integer"


@pytest.mark.asyncio
async def test_inventory_write_is_tool_error_and_never_calls_api(server, monkeypatch):
    from fastmcp import FastMCP
    from mcpauth import MCPAuth
    from mcpauth.types import AuthInfo

    captured = {}
    original_http_app = FastMCP.http_app
    original_auth_middleware = MCPAuth.bearer_auth_middleware

    def capture_http_app(self, *args, **kwargs):
        captured["mcp"] = self
        return original_http_app(self, *args, **kwargs)

    def capture_auth_middleware(self, *args, **kwargs):
        captured["auth"] = self
        return original_auth_middleware(self, *args, **kwargs)

    monkeypatch.setattr(FastMCP, "http_app", capture_http_app)
    monkeypatch.setattr(MCPAuth, "bearer_auth_middleware", capture_auth_middleware)

    class NoWriteApi:
        async def request(self, *args, **kwargs):
            pytest.fail("inventory_reject_write must not call the TrackFlow API")

    server.create_mcp_app(api=NoWriteApi())
    captured["auth"]._context_var.set(
        AuthInfo(
            token="synthetic-test-token",
            issuer="https://issuer.example.test",
            client_id="local-test",
            scopes=["inventory:read"],
            subject="local-test",
            claims={"client_id": "local-test"},
        )
    )

    with pytest.raises(server.ToolExecutionError) as error:
        await captured["mcp"].call_tool(
            "inventory_reject_write",
            {"operation": "outbound", "payload": {"quantity": 5}},
        )

    assert error.value.code == "INVENTORY_READ_ONLY"
    assert "no modification was performed" in error.value.message


@pytest.mark.asyncio
async def test_complete_mocked_workflow_for_every_exposed_tool(server, monkeypatch):
    """Exercise all registered tools through FastMCP with a mocked TrackFlow API."""
    from fastmcp import FastMCP
    from mcpauth import MCPAuth
    from mcpauth.types import AuthInfo

    captured = {}
    original_http_app = FastMCP.http_app
    original_auth_middleware = MCPAuth.bearer_auth_middleware

    def capture_http_app(self, *args, **kwargs):
        captured["mcp"] = self
        return original_http_app(self, *args, **kwargs)

    def capture_auth_middleware(self, *args, **kwargs):
        captured["auth"] = self
        return original_auth_middleware(self, *args, **kwargs)

    monkeypatch.setattr(FastMCP, "http_app", capture_http_app)
    monkeypatch.setattr(MCPAuth, "bearer_auth_middleware", capture_auth_middleware)

    calls = []
    incident = {
        "id": 101, "title": "MCP test", "description": "Test incident flow",
        "category": "other", "status": "open", "origin": "internal",
        "branch": "central", "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    }
    product = {
        "id": 202, "name": "Test product", "sku_code": "TEST-202",
        "client_name": "Test client", "category": "electronics", "warehouse": "LA",
        "threshold_min": 1, "current_stock": 5, "created_at": "2026-01-01T00:00:00Z",
    }

    async def handler(request: httpx.Request):
        body = request.content.decode() if request.content else ""
        calls.append((request.method, request.url.path, body, request.headers.get("authorization")))
        if request.method == "GET" and request.url.path == "/inventory/products":
            return httpx.Response(200, json=[product])
        if request.method == "GET" and request.url.path == "/inventory/products/202":
            return httpx.Response(200, json=product)
        if request.method == "PATCH":
            updated = {**incident, "status": "in_progress"}
            return httpx.Response(200, json=updated)
        if request.method == "POST":
            return httpx.Response(200, json=incident)
        if request.method == "GET" and request.url.path == "/api/incidents/101":
            return httpx.Response(200, json=incident)
        return httpx.Response(404, json={"detail": "not found"})

    api = server.TrackFlowApi(
        base_url="http://trackflow.test", service_token="service-secret", transport=httpx.MockTransport(handler),
    )
    server.create_mcp_app(api=api)

    async def call_with_scopes(name, arguments, scopes):
        captured["auth"]._context_var.set(
            AuthInfo(
                token="synthetic-test-token", issuer="https://issuer.example.test",
                client_id="playground-flow-test", scopes=scopes,
                subject="playground-flow-test", claims={"client_id": "playground-flow-test"},
            )
        )
        return await captured["mcp"].call_tool(name, arguments)

    await call_with_scopes("incidents_create", {
        "title": "MCP test", "description": "Test incident flow", "category": "other",
        "origin": "internal", "branch": "central",
    }, ["incidents:write"])
    await call_with_scopes("incidents_get", {"incident_id": 101}, ["incidents:read"])
    await call_with_scopes("incidents_update_status", {
        "incident_id": 101, "status": "in_progress",
    }, ["incidents:write"])
    product_list_result = await call_with_scopes("inventory_list_products", {}, ["inventory:read"])
    await call_with_scopes("inventory_get_product", {"product_id": 202}, ["inventory:read"])

    with pytest.raises(server.ToolExecutionError) as error:
        await call_with_scopes("inventory_reject_write", {
            "operation": "outbound", "payload": {"product_id": 202, "quantity": 1},
        }, [])

    assert error.value.code == "INVENTORY_READ_ONLY"
    assert "no modification was performed" in error.value.message
    assert product_list_result.structured_content == {"result": [product]}
    assert [(method, path) for method, path, _, _ in calls] == [
        ("POST", "/api/incidents"),
        ("GET", "/api/incidents/101"),
        ("PATCH", "/api/incidents/101/status"),
        ("GET", "/inventory/products"),
        ("GET", "/inventory/products/202"),
    ]
    assert all(auth == "Bearer service-secret" for _, _, _, auth in calls)
