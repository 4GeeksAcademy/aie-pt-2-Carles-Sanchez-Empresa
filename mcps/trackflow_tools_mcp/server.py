"""OAuth-protected MCP facade for TrackFlow incidents and inventory APIs."""

from __future__ import annotations

import os
import logging
import json
from functools import wraps
from typing import Literal

import httpx
from fastapi import FastAPI
from fastmcp import FastMCP
from fastmcp.exceptions import ToolError
from fastmcp.server.middleware import Middleware
from mcpauth import MCPAuth
from mcpauth.exceptions import MCPAuthBearerAuthException
from mcpauth.utils import create_resource_metadata_endpoint
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from .auth import SCOPES_SUPPORTED, build_mcp_auth, get_required_scopes, require_scopes


INCIDENT_SCOPE = "incidents:read"
INCIDENT_WRITE_SCOPE = "incidents:write"
INVENTORY_READ_SCOPE = "inventory:read"
logger = logging.getLogger("trackflow.mcp")

INCIDENT_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer", "description": "Numeric TrackFlow incident ID."},
        "title": {"type": "string"},
        "description": {"type": "string"},
        "category": {"type": "string"},
        "status": {"type": "string", "enum": ["open", "in_progress", "resolved", "discarded"]},
        "origin": {"type": "string", "enum": ["customer", "branch", "internal"]},
        "branch": {"type": "string", "enum": ["central", "la_warehouse", "la_office", "zaragoza_warehouse", "zaragoza_office"]},
        "created_at": {"type": "string", "format": "date-time"},
        "updated_at": {"type": "string", "format": "date-time"},
    },
    "required": ["id", "title", "description", "category", "status", "origin", "branch", "created_at", "updated_at"],
    "additionalProperties": False,
}
SKU_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer", "description": "Numeric TrackFlow SKU ID."},
        "name": {"type": "string"},
        "sku_code": {"type": "string"},
        "client_name": {"type": "string"},
        "category": {"type": "string", "enum": ["fashion", "electronics", "cosmetics"]},
        "warehouse": {"type": "string", "enum": ["LA", "ZGZ"]},
        "threshold_min": {"type": ["integer", "null"]},
        "current_stock": {"type": "integer"},
        "created_at": {"type": "string", "format": "date-time"},
    },
    "required": ["id", "name", "sku_code", "client_name", "category", "warehouse", "threshold_min", "current_stock", "created_at"],
    "additionalProperties": False,
}
SKU_LIST_OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {"result": {"type": "array", "items": SKU_RESPONSE_SCHEMA}},
    "required": ["result"],
    "additionalProperties": False,
}


class ToolExecutionError(ToolError):
    """Stable, sanitized error returned for an MCP tool failure."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(f"{code}: {message}")

    def to_dict(self) -> dict[str, str]:
        """Expose the stable code/message pair as MCP structured error data."""
        return {"code": self.code, "message": self.message}


def _client_id(auth: MCPAuth) -> str:
    """Return a non-secret client identifier for audit logs."""
    info = auth.auth_info
    if info is None:
        return "unauthenticated"
    claims = info.claims or {}
    return str(claims.get("client_id") or claims.get("azp") or info.subject or "unknown")


def _audited_tool(auth: MCPAuth, tool_name: str):
    """Log each handler invocation without logging tokens or tool arguments."""
    def decorate(function):
        @wraps(function)
        async def wrapper(*args, **kwargs):
            client = _client_id(auth)
            try:
                result = await function(*args, **kwargs)
            except ToolExecutionError as exc:
                logger.warning(
                    "mcp_tool_invocation",
                    extra={"tool": tool_name, "client": client, "result": "denied" if exc.code.startswith(("AUTH_", "INVENTORY_")) else "error", "error_code": exc.code},
                )
                raise
            except MCPAuthBearerAuthException:
                logger.warning(
                    "mcp_tool_invocation",
                    extra={"tool": tool_name, "client": client, "result": "denied", "error_code": "AUTH_FORBIDDEN"},
                )
                raise
            except (ValidationError, ValueError) as exc:
                logger.warning(
                    "mcp_tool_invocation",
                    extra={"tool": tool_name, "client": client, "result": "error", "error_code": "INVALID_ARGUMENT"},
                )
                raise ToolExecutionError("INVALID_ARGUMENT", "Tool arguments failed validation.") from exc
            except Exception as exc:
                logger.exception(
                    "mcp_tool_invocation",
                    extra={"tool": tool_name, "client": client, "result": "error", "error_code": "INTERNAL_ERROR"},
                )
                raise ToolExecutionError("INTERNAL_ERROR", "The tool could not complete the request.") from exc

            result_name = "denied" if isinstance(result, dict) and result.get("accepted") is False else "success"
            logger.info(
                "mcp_tool_invocation",
                extra={"tool": tool_name, "client": client, "result": result_name,
                       "error_code": result.get("code") if result_name == "denied" else None},
            )
            return result
        return wrapper
    return decorate


class _ToolArgumentAuditMiddleware(Middleware):
    """Audit schema-validation failures that occur before a tool handler runs."""

    def __init__(self, auth: MCPAuth):
        self.auth = auth

    async def on_call_tool(self, context, call_next):
        try:
            return await call_next(context)
        except ValidationError:
            logger.warning(
                "mcp_tool_invocation",
                extra={
                    "tool": context.message.name,
                    "client": _client_id(self.auth),
                    "result": "error",
                    "error_code": "INVALID_ARGUMENT",
                },
            )
            raise


class IncidentCreateInput(BaseModel):
    """Payload matching POST /api/incidents (ID and timestamps are server-generated)."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, description="Título breve de la incidencia.")
    description: str = Field(min_length=5, description="Descripción detallada; mínimo 5 caracteres.")
    category: Literal[
        "lost_parcel", "delivery_failure", "inventory_discrepancy", "carrier_issue",
        "returns_issue", "warehouse_incident", "system_failure", "client_complaint", "other",
    ] = Field(description="Categoría de incidencia válida para TrackFlow.")
    status: Literal["open", "in_progress", "resolved", "discarded"] = Field(
        default="open", description="Estado inicial; por defecto open."
    )
    origin: Literal["customer", "branch", "internal"] = Field(description="Origen del reporte.")
    branch: Literal[
        "central", "la_warehouse", "la_office", "zaragoza_warehouse", "zaragoza_office",
    ] = Field(description="Sede TrackFlow que gestiona o reporta la incidencia.")

    @field_validator("description")
    @classmethod
    def description_has_five_non_whitespace_characters(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 5:
            raise ValueError("description must contain at least 5 non-whitespace characters")
        return value


class IncidentStatusInput(BaseModel):
    """Status transition payload matching PATCH /api/incidents/{id}/status."""

    model_config = ConfigDict(extra="forbid")
    status: Literal["open", "in_progress", "resolved", "discarded"] = Field(
        description="Nuevo estado. El backend valida el ciclo de vida y las transiciones permitidas."
    )


class InventoryQueryInput(BaseModel):
    """Read filters matching GET /inventory/products and GET /inventory/products/{id}."""

    model_config = ConfigDict(extra="forbid")
    product_id: int | None = Field(default=None, gt=0, description="ID numérico del SKU; exclusivo con filtros de lista.")
    warehouse: Literal["LA", "ZGZ"] | None = Field(default=None, description="Almacén: LA o ZGZ.")
    category: Literal["fashion", "electronics", "cosmetics"] | None = Field(default=None, description="Categoría del SKU.")


class ServiceError(RuntimeError):
    """Sanitized upstream service error."""


class TrackFlowApi:
    """HTTP client using a private service credential, never the user's OAuth token."""

    def __init__(self, *, base_url: str, service_token: str | None = None, timeout: float = 5.0, transport=None):
        self.base_url = base_url.rstrip("/")
        self.service_token = service_token if service_token is not None else os.getenv("MCP_API_SERVICE_TOKEN", "").strip()
        self.timeout = timeout
        self.transport = transport

    async def request(self, method: str, path: str, *, json: dict | None = None, params: dict | None = None):
        if method.upper() not in {"GET", "POST", "PATCH"}:
            raise ValueError("Unsupported internal API method")
        if not self.service_token:
            raise ServiceError("service_credentials_not_configured")
        try:
            async with httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout),
                follow_redirects=False,
                transport=self.transport,
            ) as client:
                response = await client.request(
                    method, path, headers={"Authorization": f"Bearer {self.service_token}"}, json=json, params=params,
                )
            if response.status_code == 404:
                raise ServiceError("not_found")
            if response.status_code in {400, 422}:
                raise ServiceError("invalid_transition_or_input")
            if response.status_code in {401, 403}:
                raise ServiceError("upstream_unauthorized")
            response.raise_for_status()
            return response.json()
        except ServiceError:
            raise
        except (httpx.TimeoutException, TimeoutError) as exc:
            raise ServiceError("upstream_timeout") from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise ServiceError("upstream_unavailable_or_invalid_response") from exc


def _optional_csv(name: str) -> list[str] | None:
    """Parse an optional comma-separated FastMCP HTTP allowlist."""
    value = os.getenv(name, "").strip()
    if not value:
        return None
    entries = [entry.strip() for entry in value.split(",") if entry.strip()]
    if not entries:
        return None
    return entries


class _ToolScopeHttpMiddleware(BaseHTTPMiddleware):
    """Return HTTP 403 for known tools missing their own scope before MCP dispatch."""

    def __init__(self, app, auth: MCPAuth, resource: str):
        super().__init__(app)
        self.auth = auth
        self.resource = resource
        self.required_by_tool = {
            "incidents_create": (INCIDENT_WRITE_SCOPE,),
            "incidents_get": (INCIDENT_SCOPE,),
            "incidents_update_status": (INCIDENT_WRITE_SCOPE,),
            "inventory_list_products": (INVENTORY_READ_SCOPE,),
            "inventory_get_product": (INVENTORY_READ_SCOPE,),
        }

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method != "POST":
            return await call_next(request)
        try:
            body = await request.body()
            payload = json.loads(body)
        except (ValueError, json.JSONDecodeError):
            return await call_next(request)
        # Starlette's BaseHTTPMiddleware caches Request.body() and replays it
        # to downstream middleware automatically.
        if not isinstance(payload, dict) or payload.get("method") != "tools/call":
            return await call_next(request)
        params = payload.get("params")
        tool_name = params.get("name") if isinstance(params, dict) else None
        scopes = self.required_by_tool.get(tool_name)
        if scopes is None:
            return await call_next(request)
        try:
            require_scopes(self.auth, *scopes)
        except MCPAuthBearerAuthException as exc:
            info = self.auth.auth_info
            claims = (info.claims or {}) if info is not None else {}
            client = str(
                claims.get("client_id") or claims.get("azp")
                or (info.subject if info is not None else None) or "unknown"
            )
            logger.warning(
                "mcp_tool_invocation",
                extra={
                    "tool": tool_name,
                    "client": client,
                    "result": "denied",
                    "error_code": "AUTH_FORBIDDEN",
                },
            )
            metadata_url = create_resource_metadata_endpoint(self.resource)
            challenge = (
                'Bearer error="insufficient_scope", '
                f'resource_metadata="{metadata_url}"'
            )
            return JSONResponse(exc.to_json(), status_code=403, headers={"WWW-Authenticate": challenge})
        return await call_next(request)


def create_mcp_app(*, api: TrackFlowApi | None = None, auth: MCPAuth | None = None, resource: str | None = None, audience: str | None = None) -> FastAPI:
    """Create a testable ASGI application with MCP Auth guarding all MCP requests."""
    if auth is None:
        auth, resource, audience = _DEFAULT_AUTH, _DEFAULT_RESOURCE, _DEFAULT_RESOURCE
    if not resource or not audience:
        raise RuntimeError("resource and audience are required")
    api = api or TrackFlowApi(base_url=os.getenv("TRACKFLOW_API_BASE_URL", "http://127.0.0.1:8000"))

    mcp = FastMCP(
        name="TrackFlow Operations",
        instructions=(
            "TrackFlow operations tools. Use incidents_create to create incidents, "
            "incidents_get to retrieve full incident state, incidents_update_status for "
            "lifecycle transitions, inventory_list_products/inventory_get_product for reads. "
            "Inventory mutations are unsupported and explicitly rejected."
        ),
    )

    @mcp.tool(
        name="incidents_create",
        output_schema=INCIDENT_RESPONSE_SCHEMA,
        description=(
            "Create a TrackFlow incident through POST /api/incidents. Input fields are title, description, "
            "category, status (default open), origin and branch; ID and timestamps are generated by the API. "
            "Categories: lost_parcel, delivery_failure, inventory_discrepancy, carrier_issue, returns_issue, "
            "warehouse_incident, system_failure, client_complaint, other. Origins: customer, branch, internal. "
            "Branches: central, la_warehouse, la_office, zaragoza_warehouse, zaragoza_office. Requires "
            "OAuth scope incidents:write. Returns the IncidentResponse object with id/title/description/category/"
            "status/origin/branch/created_at/updated_at."
        ),
    )
    @_audited_tool(auth, "incidents_create")
    async def incidents_create(
        title: str, description: str,
        category: Literal[
            "lost_parcel", "delivery_failure", "inventory_discrepancy", "carrier_issue", "returns_issue",
            "warehouse_incident", "system_failure", "client_complaint", "other",
        ],
        origin: Literal["customer", "branch", "internal"],
        branch: Literal["central", "la_warehouse", "la_office", "zaragoza_warehouse", "zaragoza_office"],
        status: Literal["open", "in_progress", "resolved", "discarded"] = "open",
    ) -> dict:
        """Create an incident with the API's canonical fields and enum values."""
        _authorized_token(auth, INCIDENT_WRITE_SCOPE)
        payload = IncidentCreateInput(
            title=title, description=description, category=category, status=status, origin=origin, branch=branch,
        )
        token = _authorized_token(auth, INCIDENT_WRITE_SCOPE)
        return await _call_api(api, "POST", "/api/incidents", json=payload.model_dump())

    @mcp.tool(
        name="incidents_get",
        output_schema=INCIDENT_RESPONSE_SCHEMA,
        description=(
            "Get one TrackFlow incident by its positive integer incident ID using GET /api/incidents/{incident_id}. "
            "Requires OAuth scope incidents:read. Returns id, title, description, category, status, origin, branch, "
            "created_at and updated_at; a missing ID returns a not_found error."
        ),
    )
    @_audited_tool(auth, "incidents_get")
    async def incidents_get(incident_id: int) -> dict:
        """Return the full existing IncidentResponse for one numeric incident ID."""
        _authorized_token(auth, INCIDENT_SCOPE)
        if isinstance(incident_id, bool) or incident_id <= 0:
            raise ValueError("incident_id must be a positive integer")
        return await _call_api(api, "GET", f"/api/incidents/{incident_id}")

    @mcp.tool(
        name="incidents_update_status",
        output_schema=INCIDENT_RESPONSE_SCHEMA,
        description=(
            "Change an incident's lifecycle status via PATCH /api/incidents/{incident_id}/status (never generic PATCH). "
            "Input: positive integer incident_id and status open|in_progress|resolved|discarded. The API enforces "
            "transitions open→in_progress|discarded and in_progress→resolved|discarded; resolved/discarded are final. "
            "Requires OAuth scope incidents:write. Returns the complete updated IncidentResponse."
        ),
    )
    @_audited_tool(auth, "incidents_update_status")
    async def incidents_update_status(
        incident_id: int, status: Literal["open", "in_progress", "resolved", "discarded"],
    ) -> dict:
        """Update status only through the Incidents Manager lifecycle endpoint."""
        _authorized_token(auth, INCIDENT_WRITE_SCOPE)
        if isinstance(incident_id, bool) or incident_id <= 0:
            raise ValueError("incident_id must be a positive integer")
        payload = IncidentStatusInput(status=status)
        return await _call_api(
            api, "PATCH", f"/api/incidents/{incident_id}/status",
            json=payload.model_dump(),
        )

    @mcp.tool(
        name="inventory_list_products",
        output_schema=SKU_LIST_OUTPUT_SCHEMA,
        description=(
            "Read-only query to GET /inventory/products with optional warehouse (LA|ZGZ) and category "
            "(fashion|electronics|cosmetics) filters. Requires OAuth scope inventory:read. Returns a list of SKUResponse "
            "objects: id, name, sku_code, client_name, category, warehouse, threshold_min, current_stock, created_at. "
            "This tool cannot create, receive, dispatch, delete, or otherwise modify inventory."
        ),
    )
    @_audited_tool(auth, "inventory_list_products")
    async def inventory_list_products(
        warehouse: Literal["LA", "ZGZ"] | None = None,
        category: Literal["fashion", "electronics", "cosmetics"] | None = None,
    ) -> dict[str, list[dict]]:
        """List SKUs and calculated stock using only the existing API GET endpoint."""
        _authorized_token(auth, INVENTORY_READ_SCOPE)
        query = InventoryQueryInput(warehouse=warehouse, category=category)
        result = await _call_api(
            api, "GET", "/inventory/products", params=query.model_dump(exclude_none=True),
        )
        if not isinstance(result, list):
            raise ServiceError("invalid_inventory_response")
        # The declared MCP output schema is an object with a `result` array;
        # return that exact shape so FastMCP can validate/serialize it.
        return {"result": result}

    @mcp.tool(
        name="inventory_get_product",
        output_schema=SKU_RESPONSE_SCHEMA,
        description=(
            "Read-only query to GET /inventory/products/{id}. Input product_id is the positive integer SKU ID used by "
            "the TrackFlow inventory API. Requires OAuth scope inventory:read. Returns one SKUResponse object with "
            "id, name, sku_code, client_name, category, warehouse, threshold_min, current_stock and created_at. "
            "No inventory writes are supported."
        ),
    )
    @_audited_tool(auth, "inventory_get_product")
    async def inventory_get_product(product_id: int) -> dict:
        """Return one SKU and calculated current stock using GET only."""
        _authorized_token(auth, INVENTORY_READ_SCOPE)
        if isinstance(product_id, bool) or product_id <= 0:
            raise ValueError("product_id must be a positive integer")
        return await _call_api(
            api, "GET", f"/inventory/products/{product_id}",
        )

    @mcp.tool(
        name="inventory_reject_write",
        description=(
            "Explicitly rejects every attempted inventory mutation. This tool never calls the inventory API. "
            "Input operation names a requested change (e.g. create_product, inbound, outbound, delete_product); "
            "payload may contain attempted fields. Fails the MCP call with INVENTORY_READ_ONLY and a clear "
            "explanation; no modification is performed. Use inventory_list_products or inventory_get_product for reads."
        ),
    )
    @_audited_tool(auth, "inventory_reject_write")
    async def inventory_reject_write(operation: str, payload: dict | None = None) -> dict:
        """Fail the MCP tool call explicitly; no downstream request or side effect occurs."""
        # This deny-only tool needs authentication, but no data-access scope: it
        # never reads or mutates inventory and always rejects the request.
        if auth.auth_info is None:
            raise ToolExecutionError("AUTH_REQUIRED", "A valid bearer access token is required.")
        raise ToolExecutionError(
            "INVENTORY_READ_ONLY",
            f"Inventory is read-only; operation '{operation}' was rejected and no modification was performed.",
        )

    # Browser-based clients send an Origin header. Keep DNS-rebinding protection
    # enabled and trust only explicitly configured Codespaces/client origins and
    # the public MCP hostname; never use a wildcard here.
    mcp_asgi = mcp.http_app(
        transport="streamable-http",
        path="/",
        stateless_http=True,
        allowed_hosts=_optional_csv("MCP_ALLOWED_HOSTS"),
        allowed_origins=_optional_csv("MCP_ALLOWED_ORIGINS"),
    )
    mcp.add_middleware(_ToolArgumentAuditMiddleware(auth))
    # Starlette wraps middleware in reverse registration order. Register scope
    # enforcement first so bearer validation runs before it and populates auth_info.
    mcp_asgi.add_middleware(_ToolScopeHttpMiddleware, auth=auth, resource=resource)
    bearer_middleware = auth.bearer_auth_middleware(
        "jwt",
        audience=audience,
        required_scopes=get_required_scopes(),
        show_error_details=False,
        resource=resource,
    )
    mcp_asgi.add_middleware(bearer_middleware)

    app = FastAPI(
        title="TrackFlow Operations MCP",
        description="OAuth-protected MCP tools for incidents and read-only inventory.",
        lifespan=mcp_asgi.lifespan,
    )
    metadata_router = auth.resource_metadata_router()
    for route in metadata_router.routes:
        app.router.routes.insert(0, route)

    @app.get("/health", include_in_schema=False)
    async def health() -> dict:
        return {"status": "ok"}

    # Mount after public metadata and health routes so OAuth discovery remains
    # reachable without credentials while every MCP protocol request is guarded.
    app.mount("/", mcp_asgi)

    return app


def _authorized_token(auth: MCPAuth, required_scope: str) -> None:
    """Enforce user OAuth scopes; API authentication is a separate service identity."""
    require_scopes(auth, required_scope)
    return None


async def _call_api(api: TrackFlowApi, method: str, path: str, *, json: dict | None = None, params: dict | None = None):
    try:
        return await api.request(method, path, json=json, params=params)
    except ServiceError as exc:
        code = {
            "not_found": "RESOURCE_NOT_FOUND",
            "invalid_transition_or_input": "INVALID_TRANSITION_OR_INPUT",
            "upstream_unauthorized": "UPSTREAM_UNAUTHORIZED",
            "service_credentials_not_configured": "SERVICE_CREDENTIALS_NOT_CONFIGURED",
            "upstream_timeout": "UPSTREAM_TIMEOUT",
            "invalid_inventory_response": "UPSTREAM_INVALID_RESPONSE",
        }.get(str(exc), "UPSTREAM_UNAVAILABLE")
        message = {
            "RESOURCE_NOT_FOUND": "The requested TrackFlow resource was not found.",
            "INVALID_TRANSITION_OR_INPUT": "The supplied input or lifecycle transition is invalid.",
            "UPSTREAM_UNAUTHORIZED": "The TrackFlow API rejected the configured service credentials.",
            "SERVICE_CREDENTIALS_NOT_CONFIGURED": "The MCP service credential is not configured.",
            "UPSTREAM_TIMEOUT": "The TrackFlow API did not respond before the deadline.",
            "UPSTREAM_INVALID_RESPONSE": "The TrackFlow API returned an invalid response.",
            "UPSTREAM_UNAVAILABLE": "The TrackFlow API is unavailable.",
        }[code]
        raise ToolExecutionError(code, message) from None


def create_app() -> FastAPI:
    """Factory for uvicorn and ASGI integrations."""
    return create_mcp_app()


# Fetch issuer metadata and construct the resource server once at process startup.
_DEFAULT_AUTH, _DEFAULT_RESOURCE, _AUTH_ISSUER, _ENDPOINT_SCOPES = build_mcp_auth()
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("mcps.trackflow_tools_mcp.server:app", host="0.0.0.0", port=int(os.getenv("MCP_PORT", "8001")))
