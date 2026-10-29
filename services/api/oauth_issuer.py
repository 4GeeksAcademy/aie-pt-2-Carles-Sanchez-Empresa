"""OIDC authorization-server endpoints for MCP clients.

The implementation deliberately supports one pre-registered public client,
Authorization Code + mandatory PKCE, fixed TrackFlow scopes, no refresh tokens,
and short-lived RS256 access tokens. It does not alter the legacy backoffice
HS256 login/session flow.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import time
from dataclasses import dataclass
from urllib.parse import parse_qs, urlencode, urlsplit

from authlib.oauth2.rfc6749 import AuthorizationServer
from authlib.oauth2.rfc6749.errors import InvalidRequestError, InvalidScopeError
from authlib.oauth2.rfc6749.grants import AuthorizationCodeGrant
from authlib.oauth2.rfc7636 import CodeChallenge
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from jose import jwt

from auth import verify_password
from database import users_table

SCOPES = {"incidents:read", "incidents:write", "inventory:read"}
ISSUER = os.getenv("TRACKFLOW_OIDC_ISSUER", "http://localhost:8000").rstrip("/")
CLIENT_ID = os.getenv("TRACKFLOW_OIDC_CLIENT_ID", "trackflow-mcp-playground")
CODE_TTL_SECONDS = 300
ACCESS_TTL_SECONDS = 1800
SESSION_TTL_SECONDS = 8 * 60 * 60
router = APIRouter(tags=["OAuth/OIDC"])


def _private_key() -> str:
    value = os.getenv("TRACKFLOW_OIDC_PRIVATE_KEY", "").replace("\\n", "\n").strip()
    if not value:
        raise RuntimeError("TRACKFLOW_OIDC_PRIVATE_KEY must contain a provisioned RSA private PEM")
    return value


def _public_jwk() -> dict[str, str]:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

    key = serialization.load_pem_private_key(_private_key().encode(), password=None)
    if not isinstance(key, RSAPrivateKey):
        raise RuntimeError("TRACKFLOW_OIDC_PRIVATE_KEY must be an RSA private key")
    numbers = key.public_key().public_numbers()

    def b64int(number: int) -> str:
        raw = number.to_bytes((number.bit_length() + 7) // 8, "big")
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")

    return {"kty": "RSA", "use": "sig", "alg": "RS256", "kid": os.getenv("TRACKFLOW_OIDC_KEY_ID", "trackflow-rsa-1"),
            "n": b64int(numbers.n), "e": b64int(numbers.e)}


@dataclass
class PublicClient:
    client_id: str
    redirect_uris: list[str]
    grant_types: list[str] | None = None
    response_types: list[str] | None = None
    token_endpoint_auth_method: str = "none"

    def __post_init__(self):
        self.grant_types = ["authorization_code"]
        self.response_types = ["code"]

    def check_redirect_uri(self, redirect_uri: str) -> bool:
        return redirect_uri in self.redirect_uris

    def check_client_secret(self, client_secret: str) -> bool:
        return False

    def check_grant_type(self, grant_type: str) -> bool:
        return grant_type in self.grant_types

    def check_response_type(self, response_type: str) -> bool:
        return response_type in self.response_types

    def check_endpoint_auth_method(self, method: str, endpoint: str) -> bool:
        return endpoint != "token" or method == "none"

    def get_client_id(self) -> str:
        return self.client_id

    def get_default_redirect_uri(self) -> str | None:
        return None

    def get_allowed_scope(self, scope: str | None) -> str:
        requested = set((scope or "").split())
        if not requested or not requested.issubset(SCOPES):
            raise InvalidScopeError()
        return " ".join(sorted(requested))

    def has_client_secret(self) -> bool:
        return False


@dataclass
class AuthorizationCode:
    code: str
    client_id: str
    redirect_uri: str
    user_id: int
    scope: str
    expires_at: float
    code_challenge: str | None
    code_challenge_method: str | None
    auth_time: int
    used: bool = False

    def is_expired(self) -> bool:
        return self.used or time.time() >= self.expires_at

    def is_redirect_uri_allowed(self, redirect_uri: str) -> bool:
        return redirect_uri == self.redirect_uri

    def get_redirect_uri(self) -> str:
        return self.redirect_uri

    def get_scope(self) -> str:
        return self.scope


class OIDCServer(AuthorizationServer):
    def __init__(self):
        super().__init__(scopes_supported=sorted(SCOPES))
        self.register_grant(TrackFlowAuthorizationCodeGrant, extensions=[S256CodeChallenge(required=True)])
        self.register_token_generator("authorization_code", self._generate_access_token)
        # Authlib's default client authentication methods omit ``none`` unless
        # explicitly registered; TrackFlow only supports a public PKCE client.
        from authlib.oauth2.rfc6749.authenticate_client import authenticate_none
        self.register_client_auth_method("none", authenticate_none)

    @staticmethod
    def _generate_access_token(*, grant_type, client, user=None, scope=None, expires_in=None, include_refresh_token=False):
        if user is None:
            raise ValueError("An authenticated user is required")
        now = int(time.time())
        lifetime = min(int(expires_in or ACCESS_TTL_SECONDS), ACCESS_TTL_SECONDS)
        return {
            "access_token": jwt.encode({
                "iss": ISSUER,
                "sub": str(user["id"]),
                "aud": os.getenv("MCP_AUTH_RESOURCE", "http://localhost:8001"),
                "iat": now,
                "exp": now + lifetime,
                "scope": scope or "",
                "client_id": client.client_id,
                "jti": secrets.token_urlsafe(24),
            }, _private_key(), algorithm="RS256", headers={"kid": os.getenv("TRACKFLOW_OIDC_KEY_ID", "trackflow-rsa-1")}),
            "token_type": "Bearer",
            "expires_in": lifetime,
            "scope": scope or "",
        }

    def query_client(self, client_id: str):
        if client_id != CLIENT_ID:
            return None
        redirect = os.getenv("TRACKFLOW_OIDC_REDIRECT_URI", "http://localhost:6274/oauth/callback")
        parts = urlsplit(redirect)
        if (parts.scheme not in {"https", "http"} or not parts.netloc or parts.fragment
                or parts.username or parts.password
                or (parts.scheme == "http" and parts.hostname not in {"localhost", "127.0.0.1", "::1"})):
            raise RuntimeError("TRACKFLOW_OIDC_REDIRECT_URI must be a fixed HTTPS URI (HTTP is allowed only for localhost)")
        return PublicClient(client_id, [redirect])

    def save_token(self, token: dict, request) -> None:
        # Tokens are self-contained; there are intentionally no refresh tokens.
        return None

    def handle_response(self, status_code, body, headers):
        return status_code, body, headers

    def send_signal(self, name, **kwargs):
        # The base class is an abstract hook; this standalone issuer has no
        # signal subscribers and must not fail while authenticating clients.
        return None

    def create_oauth2_request(self, request):
        from authlib.oauth2.rfc6749 import OAuth2Request as CoreRequest
        from authlib.oauth2.rfc6749.requests import BasicOAuth2Payload

        headers = {key.decode("latin-1"): value.decode("latin-1") for key, value in request.scope.get("headers", [])}
        query = parse_qs(request.scope.get("query_string", b"").decode("latin-1"), keep_blank_values=True)
        data = dict(getattr(request.state, "form_data", {}) or {})
        uri = str(request.base_url).rstrip("/") + request.scope.get("path", "/")
        core = CoreRequest(request.method, uri, headers=headers)
        core.payload = BasicOAuth2Payload({**{key: values[-1] for key, values in query.items()}, **data})
        # Authlib 1.9.1's public-client authenticator accesses request.form.
        # Attach parsed form data without using the deprecated body constructor.
        core._body = data
        core.request = request
        return core


class TrackFlowAuthorizationCodeGrant(AuthorizationCodeGrant):
    TOKEN_ENDPOINT_AUTH_METHODS = ["none"]

    def save_authorization_code(self, code: str, request) -> None:
        pending_codes[code] = AuthorizationCode(
            code=code,
            client_id=request.client.client_id,
            redirect_uri=request.payload.redirect_uri,
            user_id=int(request.user["id"]),
            scope=request.payload.scope or "",
            expires_at=time.time() + CODE_TTL_SECONDS,
            code_challenge=request.payload.data.get("code_challenge"),
            code_challenge_method=request.payload.data.get("code_challenge_method"),
            auth_time=int(request.user.get("auth_time", time.time())),
        )

    def query_authorization_code(self, code: str, client):
        item = pending_codes.get(code)
        if item is None or item.client_id != client.client_id or item.is_expired():
            return None
        return item

    def delete_authorization_code(self, authorization_code) -> None:
        authorization_code.used = True
        pending_codes.pop(authorization_code.code, None)

    def authenticate_user(self, authorization_code):
        user = users_table.get(doc_id=authorization_code.user_id)
        if not user or not user.get("is_active", True):
            return None
        return {"id": authorization_code.user_id, "auth_time": authorization_code.auth_time}



class S256CodeChallenge(CodeChallenge):
    """Require PKCE S256 (never accept the downgradeable plain method)."""

    def validate_code_challenge(self, grant, redirect_uri):
        method = grant.request.payload.data.get("code_challenge_method")
        challenge = grant.request.payload.data.get("code_challenge")
        if method != "S256" or not challenge:
            raise InvalidRequestError("PKCE with code_challenge_method=S256 is required")
        return super().validate_code_challenge(grant, redirect_uri)


pending_codes: dict[str, AuthorizationCode] = {}
server = OIDCServer()


@dataclass
class LoginSession:
    user_id: int
    expires_at: float


sessions: dict[str, LoginSession] = {}


def _session_user(request: Request):
    session_id = request.cookies.get("trackflow_oauth_session", "")
    session = sessions.get(session_id)
    if not session or session.expires_at < time.time():
        sessions.pop(session_id, None)
        return None
    user = users_table.get(doc_id=session.user_id)
    if not user or not user.get("is_active", True):
        sessions.pop(session_id, None)
        return None
    # TinyDB documents behave like mappings, while tests and alternate user
    # stores may expose only ``get``. Keep the issuer independent of that
    # storage representation and pass Authlib only the claims it needs.
    return {
        "id": session.user_id,
        "email": user.get("email"),
        "role": user.get("role", "user"),
        "is_active": user.get("is_active", True),
    }


def _authlib_response(result) -> Response:
    status_code, body, headers = result
    response_headers = dict(headers)
    content_type = next((v for k, v in response_headers.items() if k.lower() == "content-type"), None)
    if isinstance(body, (dict, list)):
        return JSONResponse(body, status_code=status_code, headers=response_headers)
    return Response(content=body, status_code=status_code, headers=response_headers, media_type=content_type)


@router.get("/.well-known/openid-configuration")
async def openid_configuration():
    return {
        "issuer": ISSUER,
        "authorization_endpoint": f"{ISSUER}/oauth/authorize",
        "token_endpoint": f"{ISSUER}/oauth/token",
        "jwks_uri": f"{ISSUER}/.well-known/jwks.json",
        "response_types_supported": ["code"],
        "response_modes_supported": ["query"],
        "grant_types_supported": ["authorization_code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "token_endpoint_auth_methods_supported": ["none"],
        "code_challenge_methods_supported": ["S256"],
        "scopes_supported": sorted(SCOPES),
    }


@router.get("/.well-known/jwks.json")
async def public_jwks():
    return {"keys": [_public_jwk()]}


@router.post("/oauth/logout", status_code=204)
async def oauth_logout(request: Request, response: Response):
    session_id = request.cookies.get("trackflow_oauth_session", "")
    sessions.pop(session_id, None)
    response.delete_cookie("trackflow_oauth_session", path="/oauth")
    return response


@router.get("/oauth/authorize", response_class=HTMLResponse)
async def authorize(request: Request):
    try:
        grant = server.get_consent_grant(request, end_user=_session_user(request))
    except Exception as exc:
        if getattr(exc, "error", None):
            return JSONResponse({"error": exc.error, "error_description": exc.description}, status_code=400)
        raise
    if not grant.request.user:
        safe_query = urlencode(list(request.query_params.multi_items()))
        return HTMLResponse(
            f'''<!doctype html><html lang="en"><meta charset="utf-8"><title>TrackFlow sign in</title>
            <h1>Sign in to TrackFlow</h1><form method="post" action="/oauth/login?{safe_query}">
            <label>Email <input type="email" name="email" required autocomplete="username"></label>
            <label>Password <input type="password" name="password" required autocomplete="current-password"></label>
            <button type="submit">Sign in and authorize</button></form></html>''', status_code=200,
        )
    result = grant.create_authorization_response(grant.request.payload.redirect_uri, grant.request.user)
    return _authlib_response(result)


@router.post("/oauth/login", include_in_schema=False)
async def oauth_browser_login(request: Request):
    form = await request.form()
    email = str(form.get("email", "")).strip().lower()
    password = str(form.get("password", ""))
    user = next((row for row in users_table.all() if (row.get("email") or "").lower() == email), None)
    if not user or not user.get("is_active", True) or not verify_password(password, user.get("hashed_password", "")):
        return HTMLResponse("Sign-in failed. Check your credentials and try again.", status_code=401)
    user_id = int(user.doc_id)
    session_id = secrets.token_urlsafe(32)
    sessions[session_id] = LoginSession(user_id, time.time() + SESSION_TTL_SECONDS)
    query = request.url.query
    response = RedirectResponse(f"/oauth/authorize?{query}", status_code=303)
    response.set_cookie("trackflow_oauth_session", session_id, max_age=SESSION_TTL_SECONDS,
                        httponly=True, secure=ISSUER.startswith("https://"), samesite="lax", path="/oauth")
    return response


@router.post("/oauth/token")
async def token_endpoint(request: Request):
    form = await request.form()
    request.state.form_data = dict(form)
    request.form_data = dict(form)
    return _authlib_response(server.create_token_response(request))
