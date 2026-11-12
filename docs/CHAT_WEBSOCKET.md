# TrackFlow First-line CX WebSocket chat

The backoffice chat creates an authenticated `ChatSession` with
`POST /agent/chat/sessions` before opening `WS /agent/chat/ws/{session_id}`.
The WebSocket authenticates with the existing JWT as the `token` query
parameter, validates session ownership, and sends a persisted `session_snapshot`
on every connection. Messages are persisted in the agent state directory's
`chat.sqlite3`; each session UUID is also the LangGraph conversation/thread ID.

## Client/server frames

Frames have `{ "event": string, "data": object }` shape. Client events are
`user_message` (`session_id`, `text`), `interrupt_requested` (`session_id`,
`new_input`) and `close_session` (`session_id`). Server events include
`session_snapshot`, `user_message`, `assistant_message`, `token_chunk` (`message_id`, `token`,
`sequence`), `generation_completed`, `generation_interrupted`,
`generation_failed` and `protocol_error`.

the available assistant prefix with `interrupted` status, waits for the prior
The producer calls the existing First-line CX graph. The plain RAG answer path
emits provider stream chunks as they arrive. The structured memory-response
path buffers and validates its JSON before use, and deliberately emits no
intermediate chunks so that `memory_proposal` and JSON internals cannot leak to
the client. An interruption sets a cancellation event, closes the provider
stream where available, persists the available assistant prefix with
`interrupted` status, waits for the prior worker, and only then starts the
redirected input. A reconnect reuses the same session and rehydrates stored
messages before the client accepts new turns.

## Deployment notes

The in-process pub/sub and runtime lock assume one API process. Multi-worker
deployments need shared pub/sub (for example Redis) and coordinated generation
ownership before scaling the API horizontally. Configure
`NEXT_PUBLIC_API_WS_URL` if the browser must connect directly to a distinct API
WebSocket origin; otherwise the backoffice uses its own origin at `/api`. The
backoffice CSP allows `ws:` and `wss:`; production should use `wss:`.

The query token is required by browser WebSocket APIs, so access logs and proxy
logs must redact the `token` query parameter. Chat messages are scoped to their
creating user and are not RFP/SSE events.