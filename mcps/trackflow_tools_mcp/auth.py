"""OIDC resource-server authentication helpers for the TrackFlow MCP."""

from __future__ import annotations

import os
from urllib.parse import urlparse

from mcpauth import MCPAuth
from mcpauth.config import AuthServerType
from mcpauth.exceptions import (
    BearerAuthExceptionCode,
    MCPAuthBearerAuthException,
    MCPAuthBearerAuthExceptionDetails,
)
from mcpauth.types import AuthInfo, ResourceServerConfig, ResourceServerMetadata
from mcpauth.utils import fetch_server_config


SCOPES_SUPPORTED = ["incidents:read", "incidents:write", "inventory:read"]


def _required_url(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    parsed = urlparse(value)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc or parsed.query or parsed.fragment:
        raise RuntimeError(f"{name} must be an absolute http(s) URL without query or fragment")
    if parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        raise RuntimeError(f"{name} must use HTTPS outside localhost")
    return value.rstrip("/")


def get_required_scopes() -> list[str]:
    """Read optional endpoint-wide scopes configured by the operator."""
    raw = os.getenv("MCP_AUTH_SCOPES", "").strip()
    if not raw:
        return []
    scopes = list(dict.fromkeys(scope.strip() for scope in raw.split(",") if scope.strip()))
    unsupported = set(scopes).difference(SCOPES_SUPPORTED)
    if unsupported:
        raise RuntimeError(f"Unsupported MCP_AUTH_SCOPES: {', '.join(sorted(unsupported))}")
    return scopes


def build_mcp_auth() -> tuple[MCPAuth, str, str, list[str]]:
    """Fetch OIDC metadata once and configure the MCP as a protected resource."""
    issuer = _required_url("MCP_AUTH_ISSUER")
    resource = _required_url("MCP_AUTH_RESOURCE")
    server = fetch_server_config(issuer, AuthServerType.OIDC)
    auth = MCPAuth(
        protected_resources=[
            ResourceServerConfig(
                metadata=ResourceServerMetadata(
                    resource=resource,
                    authorization_servers=[server],
                    scopes_supported=SCOPES_SUPPORTED,
                    bearer_methods_supported=["header"],
                    resource_name="TrackFlow Operations MCP",
                )
            )
        ]
    )
    return auth, resource, issuer, get_required_scopes()


def require_scopes(mcp_auth: MCPAuth, *required: str) -> AuthInfo:
    """Return the verified request auth context or raise MCP Auth's 401/403 errors."""
    info = mcp_auth.auth_info
    if info is None:
        raise MCPAuthBearerAuthException(BearerAuthExceptionCode.MISSING_AUTH_HEADER)

    missing = [scope for scope in required if scope not in info.scopes]
    if missing:
        raise MCPAuthBearerAuthException(
            BearerAuthExceptionCode.MISSING_REQUIRED_SCOPES,
            cause=MCPAuthBearerAuthExceptionDetails(missing_scopes=missing),
        )
    return info
