# TrackFlow Operations MCP

Standalone Python MCP resource server under `mcps/trackflow_tools_mcp/`. It exposes incident lifecycle operations and strictly read-only inventory queries, forwarding to the existing TrackFlow API rather than replacing it.

## OAuth/OIDC and MCP Auth

Authentication is implemented with `mcpauth` resource-server mode (Protected Resource Metadata, RFC 9728) and FastMCP Streamable HTTP. TrackFlow is the OAuth issuer: users authenticate at the TrackFlow API and obtain Authorization Code + PKCE (S256) access tokens. The metadata route is public for discovery; MCP protocol requests, including `initialize`, `tools/list`, and `tools/call`, require a valid TrackFlow-signed bearer JWT with the configured audience. JWT signature/issuer validation uses TrackFlow's JWKS and issuer settings through MCP Auth. Each tool enforces its own OAuth scope: `incidents:read` for incident reads, `incidents:write` for incident mutations, and `inventory:read` for inventory reads. MCP inventory access is read-only.

`mcpauth==0.2.0b1` is currently pinned because the stable PyPI release does not include the resource-server API. It is a pre-release dependency.

Required environment:

| Variable | Description |
|---|---|
| `MCP_AUTH_ISSUER` | Required TrackFlow issuer URL; must exactly match JWT `iss`. OIDC metadata and JWKS are discovered at startup. |
| `MCP_AUTH_RESOURCE` | Required canonical MCP URL and expected JWT `aud`, without trailing slash/query/fragment. Use HTTPS except localhost. |
| `MCP_AUTH_SCOPES` | Optional comma-separated scopes required for all MCP HTTP requests; tool-specific scopes are always additionally enforced. |
| `TRACKFLOW_API_BASE_URL` | Existing unified API base URL (default `http://127.0.0.1:8000`). |
| `MCP_API_SERVICE_TOKEN` | Required internal service credential for MCP→API calls. It is independent of the user's OAuth access token and accepted only on explicitly allowlisted API routes. Provision it with a secret manager; never use or forward the user bearer as the API service credential. |
| `MCP_PORT` | Listen port (default 8001). |
| `MCP_ALLOWED_HOSTS` | Optional comma-separated FastMCP Host allowlist (hostnames only, no URL scheme), e.g. the canonical Codespaces forwarded MCP hostname. Keep unset for the development default. |
| `MCP_ALLOWED_ORIGINS` | Optional comma-separated browser Origin allowlist (full origins including scheme), e.g. the Inspector UI origin. Never set this to `*` in a shared or production deployment. |

TrackFlow issues RS256 access tokens with audience `MCP_AUTH_RESOURCE` and granted scopes `incidents:read`, `incidents:write`, and/or `inventory:read`. Authorization Code + PKCE S256 is required; the MCP is a public client and does not use a client secret. Access tokens are short-lived (up to 30 minutes); no refresh token is issued. The legacy `/auth/login` HS256 tokens remain for backoffice sessions and are not MCP OAuth tokens. Startup fails if required auth settings are missing or OIDC discovery fails.

For browser-based Inspector in Codespaces, MCP Streamable HTTP also checks request `Host`/`Origin` to mitigate DNS-rebinding attacks. Set `MCP_ALLOWED_HOSTS` to the exact forwarded MCP hostname and `MCP_ALLOWED_ORIGINS` to the exact browser origin shown in the failed request's `Origin` header (often the Inspector app origin). Do not guess the origin from the target URL, and do not use wildcards. The MCP resource URL/audience stays the canonical forwarded MCP URL; these allowlists only control HTTP Host/Origin validation and do not change OAuth issuer, audience, or scopes.

For local development, use the TrackFlow backend issuer configured for the test deployment and set `MCP_AUTH_RESOURCE=http://localhost:8001`. Do not use an HTTP resource URL outside localhost.

## Run

From the monorepo root:

```sh
MCP_AUTH_ISSUER=https://api.example.test \
MCP_AUTH_RESOURCE=http://localhost:8001 \
TRACKFLOW_API_BASE_URL=http://127.0.0.1:8000 \
MCP_API_SERVICE_TOKEN='<secret from secret manager>' \
uv run uvicorn mcps.trackflow_tools_mcp.server:app --host 0.0.0.0 --port 8001
```

Resource metadata is available at `/.well-known/oauth-protected-resource`. The MCP Streamable HTTP endpoint is `/` (MCP SDK clients use the server URL). `/health` is an unauthenticated liveness-only endpoint. MCP tool discovery (list tools / JSON schemas) is available after bearer authentication through the MCP protocol; use an MCP client rather than CLI-specific `--help`.

## Validate with MCP Inspector / Playground

For a real remote Inspector/Playground session, the server must be running with a reachable OIDC provider and a test access token that has the appropriate audience and scopes. In Codespaces, start the server on `0.0.0.0:8001`, change port `8001` visibility to **Public** in the Ports panel, and copy the forwarded HTTPS URL. Use that URL as the MCP server URL in [MCP Inspector](https://github.com/modelcontextprotocol/inspector) (do not use `localhost`, which is local to the Playground host). If the deployment uses a path prefix, include it; otherwise use the forwarded URL itself. The configured `MCP_AUTH_RESOURCE` and JWT audience must match the externally reachable resource configuration/token expectations. Do not make a production server or real customer data publicly accessible for this test; use a dedicated test issuer, test credentials, and non-sensitive data.

After connecting with OAuth, confirm that `tools/list` returns the six tools and exercise each one with safe test data. This live flow is currently **blocked/unverified**: the recorded Inspector session never completed OAuth, and the TrackFlow issuer has not been demonstrated against Inspector's forwarded callback. Do not represent this checklist as passed until it is fixed and evidenced.

| Tool | Safe end-to-end Inspector action | Required scope / expected outcome |
|---|---|---|
| `incidents_create` | Create a clearly labelled disposable test incident (`category=other`, `origin=internal`, test branch). | `incidents:write`; returns the created incident. |
| `incidents_get` | Read the ID returned by the create action. | `incidents:read`; returns that incident. |
| `incidents_update_status` | Move the created incident from `open` to `in_progress`. | `incidents:write`; returns updated incident. |
| `inventory_list_products` | List using a harmless filter such as `warehouse=LA`. | `inventory:read`; returns a list. |
| `inventory_get_product` | Read a known non-sensitive test SKU ID. | `inventory:read`; returns one SKU. |
| `inventory_reject_write` | Request `operation=outbound` with a test-only payload. | Any authenticated token; tool returns a controlled `INVENTORY_READ_ONLY` tool error, and inventory is unchanged. |

The five API-backed tool flows above must target a disposable/test backend. Clean up the test incident through the normal application/API administrative process after the session; there is intentionally no MCP delete tool. Record the date, forwarded URL (redact workspace identifiers if needed), tool names, outcome/error codes, and evidence in the project audit/evidence area. Never save bearer tokens, Authorization headers, passwords, or sensitive payloads. This repository does not claim the remote Playground validation is complete until an operator has performed and recorded that live session. The prior attempt recorded `/health` and protected-resource metadata as reachable and anonymous MCP as 401, but no OAuth session or authenticated tool call. Inspector is not running in the current workspace session, so the precise failure cannot be reproduced here. The `400 Missing config` was from an empty local connect request, not the failed OAuth callback. A concrete configuration risk to check—not a confirmed diagnosis—is that `TRACKFLOW_OIDC_REDIRECT_URI` defaults to `http://localhost:6274/oauth/callback`; the actual Inspector deployment may require a different fixed redirect URI. Capture the real connect configuration and OAuth error (redacted) before changing issuer/client settings. TrackFlow remains the intended issuer.

### Inventory write rejection behavior

`inventory_reject_write` always rejects: a call such as `operation=outbound` returns an MCP tool result marked as an error, with the stable code `INVENTORY_READ_ONLY` and a message explaining that inventory is read-only and no modification was performed. It does not call the TrackFlow API. The payload is accepted only to let clients describe the attempted operation; it is never logged or forwarded. The automated mocked flow verifies all six tools and asserts that only the five expected incident/read API requests occur. The real Playground attempt should additionally verify that stock remains unchanged in the test backend.

## Tools

All tools use strict descriptions and schemas in MCP discovery. Returned values follow the existing API response models.

### Incidents

- **`incidents_create`** — `POST /api/incidents`. Input: `title`, `description` (minimum 5 non-whitespace chars), `category` (`lost_parcel`, `delivery_failure`, `inventory_discrepancy`, `carrier_issue`, `returns_issue`, `warehouse_incident`, `system_failure`, `client_complaint`, `other`), `status` (`open`, `in_progress`, `resolved`, `discarded`, default `open`), `origin` (`customer`, `branch`, `internal`), `branch` (`central`, `la_warehouse`, `la_office`, `zaragoza_warehouse`, `zaragoza_office`). Returns full incident `{id,title,description,category,status,origin,branch,created_at,updated_at}`. Scope: `incidents:write`.
- **`incidents_get`** — `GET /api/incidents/{incident_id}`. Input: positive numeric `incident_id`. Returns the full incident response above. Scope: `incidents:read`.
- **`incidents_update_status`** — `PATCH /api/incidents/{incident_id}/status` (the lifecycle endpoint; never generic resource PATCH). Input: positive `incident_id`, `status`. Valid transitions are enforced by the API: `open -> in_progress|discarded`, `in_progress -> resolved|discarded`; `resolved` and `discarded` are terminal. Returns full updated incident. Scope: `incidents:write`.

### Inventory (read-only)

- **`inventory_list_products`** — `GET /inventory/products`. Input: optional `warehouse` (`LA`, `ZGZ`) and `category` (`fashion`, `electronics`, `cosmetics`). Returns an MCP structured object `{result: [{id,name,sku_code,client_name,category,warehouse,threshold_min,current_stock,created_at}, ...]}`. Scope: `inventory:read`.
- **`inventory_get_product`** — `GET /inventory/products/{id}`. Input: positive numeric SKU `product_id`. Returns one SKU object as above. Scope: `inventory:read`.
- **`inventory_reject_write`** — explicit deny tool for attempted mutation requests (`operation`, optional `payload`). Fails the MCP call with `INVENTORY_READ_ONLY` and a clear explanation; performs no API request and no mutation. Any inventory mutation is unsupported by this server.

The server contains no routes/calls to inventory POST/PATCH/DELETE endpoints. Incident creation is intentionally separate from status changes; status changes always use the lifecycle endpoint.

## HTTP verification and MCP clients

Use the public resource URL and a disposable test token from the configured OIDC provider. The provider must issue a signed access token whose `iss` is `MCP_AUTH_ISSUER`, `aud` includes `MCP_AUTH_RESOURCE`, `exp` is in the future, and `scope`/`scp` contains the scope needed by the selected tool. Obtain the token through the provider's documented test-client flow (for example, a dedicated authorization-code/PKCE test client or client-credentials test client if the provider supports it); this MCP server is a resource server and does not have a token endpoint or issue tokens. Never paste a production token into shell history or project files.

```sh
export MCP_URL=http://localhost:8001
# Set this from your OIDC provider's approved test flow; do not commit it.
read -s ACCESS_TOKEN
export ACCESS_TOKEN

# Public RFC 9728 metadata and liveness.
curl -i "$MCP_URL/.well-known/oauth-protected-resource"
curl -i "$MCP_URL/health"

# 401: missing bearer token.
curl -i -H 'Content-Type: application/json' \
	-d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"auth-check","version":"1"}}}' \
	"$MCP_URL/"

# 401: malformed, expired, wrong-issuer, or wrong-audience bearer token.
curl -i -H 'Authorization: Bearer not-a-valid-token' \
	-H 'Content-Type: application/json' \
	-d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"auth-check","version":"1"}}}' \
	"$MCP_URL/"

# Successful authenticated protocol request (valid token with required scopes).
curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
	-H 'Content-Type: application/json' \
	-d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"auth-check","version":"1"}}}' \
	"$MCP_URL/"

# A valid token lacking inventory:read must get HTTP 403 for this tool call.
curl -i -H "Authorization: Bearer $ACCESS_TOKEN" \
	-H 'Content-Type: application/json' \
	-d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"inventory_list_products","arguments":{}}}' \
	"$MCP_URL/"
```

For a successful tool call, connect an MCP Streamable HTTP client to `MCP_URL` and configure its HTTP `Authorization` header as `Bearer <access-token>` (or configure the client's supported OAuth flow against the same OIDC provider). Supply tokens through the client's secret/credential facility, not a committed config. Use `incidents:read` for `incidents_get`, `incidents:write` for incident create/status changes, or `inventory:read` for inventory queries. If `MCP_AUTH_SCOPES` is configured, the token must also contain every endpoint-wide configured scope.

## Security notes

- Invalid/missing JWT, issuer, JWKS signature, audience or expiration is rejected by MCP Auth before MCP dispatch.
- Per-tool scope checks use `MCPAuthBearerAuthException`; known `tools/call` requests without that scope return HTTP 403 before dispatch, and never call the API.
- The user's OAuth token is validated at the MCP boundary and is never forwarded to the API. MCP authenticates separately to allowlisted API routes with `MCP_API_SERVICE_TOKEN`; missing or invalid service credentials fail closed. This service identity does not replace user-token or per-tool-scope validation at MCP.
- Error payloads from the backend are not reflected to MCP callers; upstream failures are sanitized.
- Inventory writes are explicitly rejected and never forwarded.

## Errors and audit logs

MCP authentication happens before protocol/tool dispatch. Unauthenticated or invalid bearer requests are rejected by MCP Auth (HTTP `401`; `WWW-Authenticate` points to RFC 9728 protected-resource metadata). Validly authenticated tool calls with insufficient permission are rejected as HTTP `403` before FastMCP dispatch and identify the missing scope. `/health` and metadata discovery remain public. The middleware validates JWT signature, issuer, audience, and expiry, but a live OIDC provider/token flow has not yet been exercised in this project.

Tool errors use a stable `{code, message}` shape rather than a generic `error`:

| Code | Meaning |
|---|---|
| `AUTH_REQUIRED` | No verified MCP bearer context is available. |
| HTTP `403` / `insufficient_scope` | Token is valid, but lacks the tool's required scope; this is an HTTP authorization response, not a stable tool-error code. |
| `INVALID_ARGUMENT` | Input failed Pydantic/schema or positive-ID validation. |
| `RESOURCE_NOT_FOUND` | Incident/product does not exist. |
| `INVALID_TRANSITION_OR_INPUT` | API rejected field validation or incident lifecycle transition. |
| `UPSTREAM_UNAUTHORIZED` | Existing TrackFlow API rejected the forwarded/bridge credential. |
| `UPSTREAM_TIMEOUT` | Existing API did not respond before the timeout. |
| `UPSTREAM_INVALID_RESPONSE` | Existing API response shape/content was invalid. |
| `UPSTREAM_UNAVAILABLE` | Other upstream HTTP/network failure. |
| `INTERNAL_ERROR` | Unexpected sanitized tool failure. |
| `INVENTORY_READ_ONLY` | Explicit tool error rejecting an inventory mutation attempt; no upstream call. |

Each dispatched tool logs an `mcp_tool_invocation` event with tool name, verified client identifier (`client_id`, `azp`, or subject), result (`success`, `denied`, or `error`) and, where relevant, error code. This includes scope denials and argument-schema validation failures (including failures rejected by FastMCP before the handler). Tokens, authorization headers, input payloads and incident/product data are not logged. Requests rejected by the bearer middleware do not reach MCP dispatch and therefore cannot be reliably attributed to a tool or verified client; MCP Auth emits its own generic authentication error log for these requests. Configure application logger handlers/retention in deployment to persist audit records securely and avoid enabling verbose auth error details.

Data-access tools enforce one scope each, rather than requiring a global union of scopes: `incidents_create` and `incidents_update_status` require `incidents:write`; `incidents_get` requires `incidents:read`; `inventory_list_products` and `inventory_get_product` require `inventory:read`. `inventory_reject_write` requires a valid authenticated MCP request but deliberately requires no data scope because it performs no read or write and always denies the requested mutation.

## Validation status

Local-only validation (no live OAuth provider, TrackFlow backend, or MCP Playground): run `uv run pytest tests/pipelines/test_trackflow_mcp.py -q`. Tests cover public metadata/health, HTTP 401 for missing and invalid bearer on `initialize`, `tools/list`, and `tools/call`, per-tool scope denials without downstream access, tool discovery/schemas, and a mocked full call for all six tools. The mocked write attempt returns `INVENTORY_READ_ONLY` and makes no upstream request. These checks do **not** validate JWT signature/JWKS handling against a real issuer or constitute an end-to-end Playground flow. The live Inspector/Playground checklist above remains pending until a real test OIDC configuration and test backend are supplied and an operator safely records the remote session.
