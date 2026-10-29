# MCP Playground Codespaces update — 2026-10-23

- Inspector CORS/DNS-rebinding diagnosis: with the UI opened through the Codespaces forwarded URL for port 6280, the browser's request `Origin` was observed by Inspector middleware as `https://localhost:6280`. The allowlist was set to exactly that origin (no wildcard).
- Inspector's separate API authentication caused pre-connect 401s on `/api/log`, `/api/fetch`, and `/api/mcp/connect`. Inspector was restarted with `DANGEROUSLY_OMIT_AUTH=true` only while ports 6280/6281 were private. MCP port 8001 remains separately protected by OAuth and forwarded publicly for the remote test.
- Local checks after restart: Inspector `/api/config` returned 200; empty `/api/mcp/connect` returned 400 `Missing config` (proving the local auth/origin guards were passed); local `/api/servers/events` returned 200 `text/event-stream`. Remote MCP `/health` returned 200.
- Still pending: no successful Inspector MCP session, OAuth authorization, tool invocation, or final backend non-mutation recheck has been confirmed after the last configuration change. User reports toggle stays disconnected; the pair of `blob:` requests and an intermittent HTTP/2 error on the SSE events route do not alone identify a connection state. Continue from a fresh 6280 page, select the remote server URL, and capture the response/status from the real connect request without sharing credentials. Do not claim Playground validation complete.
# MCP Playground / Codespaces validation

- Date: 2026-10-23 (UTC, date reported by the execution environment)
- MCP endpoint: Codespaces forwarded port 8001 (public during test; URL omitted)
- API port 8000: remained private.
- Inspector: CLI smoke check and web UI startup attempted.

## Results

| Check | Result |
|---|---|
| Remote MCP `/health` | HTTP 200 |
| Remote Protected Resource Metadata | HTTP 200 |
| MCP protocol request without bearer | HTTP 401 |
| Supabase OpenID configuration / JWKS endpoints | HTTP 200 |
| Inspector CLI using stored auth | Blocked: no stored OAuth session (`auth_required`) |
| Inspector web UI | Started locally; no browser OAuth login or authenticated remote tool call completed |
| Local TrackFlow API inventory read before/after | HTTP 200 / HTTP 200 |
| Inventory records before/after | 57 / 57 |
| Deterministic full-response snapshot | Unchanged (SHA-256 comparison performed in memory; digest intentionally not recorded) |
| `inventory_reject_write` | Returned `INVENTORY_READ_ONLY`; no API write request was made |

The backend comparison used an ephemeral local API JWT held only in process memory. No token, password, authorization header, product row, snapshot digest, or public forwarding URL is stored in this evidence file.

## Scope and limitation

This validates remote anonymous protection and local backend non-mutation by the deny-only MCP tool. It does **not** complete the requested authenticated Codespaces/Inspector Playground flow: a real OAuth session was unavailable, so no remote MCP tool was executed with an OAuth bearer token. The full six-tool live remote flow remains pending.

## Cleanup

The Inspector process was stopped after startup. Ports 6274 and 6275 were explicitly left private. The MCP port 8001 was public to permit remote smoke checks; return it to private when no longer needed.