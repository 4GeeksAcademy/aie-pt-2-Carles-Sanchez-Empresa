"""Focused tests for the first-party OAuth issuer and MCP service principal."""

from __future__ import annotations

import os
import sys

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from jose import jwt


@pytest.fixture
def issuer(monkeypatch):
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()
    monkeypatch.setenv("TRACKFLOW_OIDC_PRIVATE_KEY", pem)
    monkeypatch.setenv("TRACKFLOW_OIDC_ISSUER", "https://trackflow.test")
    monkeypatch.setenv("TRACKFLOW_OIDC_CLIENT_ID", "test-client")
    monkeypatch.setenv("TRACKFLOW_OIDC_REDIRECT_URI", "https://client.test/callback")
    monkeypatch.setenv("MCP_AUTH_RESOURCE", "https://mcp.trackflow.test")
    # The module loads issuer/client at import time; tests intentionally reload it.
    sys.path.insert(0, "services/api")
    import oauth_issuer
    import importlib
    module = importlib.reload(oauth_issuer)
    return module


def test_discovery_and_jwks_publish_matching_rsa_key(issuer):
    app = FastAPI()
    app.include_router(issuer.router)
    with TestClient(app, base_url="https://trackflow.test") as client:
        config = client.get("/.well-known/openid-configuration").json()
        jwks = client.get("/.well-known/jwks.json").json()
    assert config["issuer"] == "https://trackflow.test"
    assert config["code_challenge_methods_supported"] == ["S256"]
    key = jwks["keys"][0]
    assert key["alg"] == "RS256" and key["use"] == "sig"
    assert key["kid"] == os.getenv("TRACKFLOW_OIDC_KEY_ID", "trackflow-rsa-1")


def test_access_token_issuer_audience_scope_and_no_refresh(issuer):
    token_set = issuer.server._generate_access_token(
        grant_type="authorization_code",
        client=issuer.PublicClient("test-client", ["https://client.test/callback"]),
        user={"id": 42}, scope="incidents:read", expires_in=None, include_refresh_token=True,
    )
    assert set(token_set) == {"access_token", "token_type", "expires_in", "scope"}
    claims = jwt.decode(
        token_set["access_token"], issuer._public_jwk(), algorithms=["RS256"],
        issuer="https://trackflow.test", audience="https://mcp.trackflow.test",
    )
    assert claims["sub"] == "42"
    assert claims["scope"] == "incidents:read"
    assert claims["exp"] - claims["iat"] <= 1800


def test_pkce_extension_rejects_plain_or_missing_method(issuer):
    extension = issuer.S256CodeChallenge(required=True)

    class Payload:
        def __init__(self, data):
            self.data = data
            self.datalist = {key: [value] for key, value in data.items()}

    class Grant:
        request = None

    grant = Grant()
    grant.request = type("Request", (), {"payload": Payload({"code_challenge": "a" * 43, "code_challenge_method": "plain"})})()
    with pytest.raises(Exception, match="S256"):
        extension.validate_code_challenge(grant, "https://client.test/callback")
    grant.request.payload.data["code_challenge_method"] = "S256"
    # Valid challenge syntax is subsequently checked by Authlib's implementation.
    extension.validate_code_challenge(grant, "https://client.test/callback")


def test_client_rejects_unregistered_redirect_and_unknown_scopes(issuer):
    client = issuer.server.query_client("test-client")
    assert client.check_redirect_uri("https://client.test/callback")
    assert not client.check_redirect_uri("https://attacker.test/callback")
    with pytest.raises(Exception):
        client.get_allowed_scope("incidents:read admin")


def test_service_principal_is_limited_to_explicit_api_routes(monkeypatch):
    sys.path.insert(0, "services/api")
    import auth
    import asyncio
    from starlette.requests import Request
    monkeypatch.setenv("MCP_API_SERVICE_TOKEN", "internal-only-test-token")

    async def invoke(path: str, method: str):
        request = Request({"type": "http", "method": method, "path": path, "headers": [], "query_string": b""})
        return await auth.get_current_user(request, token="internal-only-test-token")

    assert asyncio.run(invoke("/api/incidents", "POST"))["is_service"] is True
    assert asyncio.run(invoke("/api/incidents/17", "GET"))["is_service"] is True
    assert asyncio.run(invoke("/inventory/products", "GET"))["is_service"] is True
    with pytest.raises(Exception) as denied:
        asyncio.run(invoke("/inventory/products", "POST"))
    assert getattr(denied.value, "status_code", None) == 403


def test_authorization_code_pkce_flow_issues_bearer_without_refresh(monkeypatch, issuer):
    import asyncio

    class FakeUser:
        doc_id = 42
        def get(self, key, default=None):
            return {"email": "test@example.test", "hashed_password": "fake-hash", "is_active": True}.get(key, default)

    class FakeUsers:
        def all(self):
            return [FakeUser()]
        def get(self, doc_id):
            return FakeUser() if doc_id == 42 else None

    monkeypatch.setattr(issuer, "users_table", FakeUsers())
    monkeypatch.setattr(issuer, "verify_password", lambda plain, hashed: plain == "test-password")
    app = FastAPI()
    app.include_router(issuer.router)
    verifier = "A" * 43
    challenge = __import__("base64").urlsafe_b64encode(__import__("hashlib").sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    params = {
        "response_type": "code", "client_id": "test-client",
        "redirect_uri": "https://client.test/callback", "scope": "incidents:read",
        "state": "csrf-test-state", "code_challenge": challenge, "code_challenge_method": "S256",
    }
    with TestClient(app, base_url="https://trackflow.test") as client:
        authorize = client.get("/oauth/authorize", params=params)
        assert authorize.status_code == 200, authorize.text
        assert "Sign in to TrackFlow" in authorize.text
        login = client.post("/oauth/login", params=params, data={"email": "test@example.test", "password": "test-password"}, follow_redirects=False)
        assert login.status_code == 303
        authorize_again = client.get(login.headers["location"], follow_redirects=False)
        assert authorize_again.status_code == 302, authorize_again.text
        code = dict(__import__("urllib.parse").parse.parse_qsl(__import__("urllib.parse").parse.urlsplit(authorize_again.headers["location"]).query))["code"]
        token_response = client.post("/oauth/token", data={
            "grant_type": "authorization_code", "client_id": "test-client",
            "redirect_uri": "https://client.test/callback", "code": code, "code_verifier": verifier,
        })
        assert token_response.status_code == 200, token_response.text
        token_set = token_response.json()
        assert token_set["token_type"] == "Bearer"
        assert "refresh_token" not in token_set
        assert "access_token" in token_set

