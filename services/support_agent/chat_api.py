"""Authenticated ChatSession creation and bidirectional WebSocket transport."""

import asyncio
import json
import logging
import threading
from contextlib import suppress
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ConfigDict

from auth import get_current_user
from .chat_pubsub import ChatPubSub
from .runtime import AgentRunError

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Support Chat"])


class ChatSessionCreate(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    client_id: str | None = None


def pubsub_for(app) -> ChatPubSub:
    bus = getattr(app.state, "chat_pubsub", None)
    if bus is None:
        bus = ChatPubSub()
        app.state.chat_pubsub = bus
    return bus


@router.post("/agent/chat/sessions")
async def create_chat_session(payload: ChatSessionCreate, request: Request,
                              request_user: dict = Depends(get_current_user)):
    runtime = getattr(request.app.state, "support_agent", None)
    if runtime is None:
        raise HTTPException(status_code=503, detail="Chat no disponible.")
    session = runtime.chat_store.create_session(str(request_user["id"]), payload.client_id)
    return session


@router.websocket("/agent/chat/ws/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str, token: str | None = None):
    try:
        session_id = str(UUID(session_id))
    except ValueError:
        await websocket.close(code=4400)
        return
    if not token:
        await websocket.close(code=4401)
        return
    try:
        user = await get_current_user(websocket, token=token)
    except HTTPException:
        await websocket.close(code=4401)
        return
    except Exception:
        # Authentication backend/configuration errors must not leave an
        # unauthenticated WebSocket open or leak internal exception details.
        logger.exception("Chat WebSocket authentication failed")
        await websocket.close(code=1011)
        return

    runtime = getattr(websocket.app.state, "support_agent", None)
    store = getattr(runtime, "chat_store", None)
    if runtime is None or store is None:
        await websocket.close(code=1011)
        return
    session = store.get_session(session_id, str(user["id"]))
    if not session or session["status"] == "closed":
        await websocket.close(code=4404)
        return
    if session["status"] == "active" and store.messages(session_id):
        # A process crash/restart may leave an unfinished assistant row. Preserve
        # its prefix and mark it interrupted before exposing a consistent snapshot.
        for message in store.messages(session_id):
            if message["role"] == "assistant" and message["status"] == "streaming":
                store.update_message(message["message_id"], message["content"], "interrupted")
                store.set_session_status(session_id, "interrupted")
                break

    await websocket.accept()
    bus = pubsub_for(websocket.app)
    queue = bus.subscribe(session_id)
    await websocket.send_json({
        "event": "session_snapshot",
        "data": {"session_id": session_id, "messages": store.messages(session_id)},
    })

    active: dict | None = None
    generation_task: asyncio.Task | None = None

    def publish(event: dict) -> None:
        bus.publish_threadsafe(loop, session_id, event)

    def start_turn(text: str) -> None:
        nonlocal active, generation_task
        if not text.strip():
            return
        user_message = store.add_message(session_id, "user", text)
        assistant_message = store.add_message(session_id, "assistant", "", "streaming")
        store.set_session_status(session_id, "active")
        active = {
            "message_id": assistant_message["message_id"], "text": "", "sequence": 0,
            "cancel": threading.Event(), "stream": None, "interrupted": False,
        }
        publish({"event": "user_message", "data": user_message})
        # Give the browser an assistant row before any token arrives. Some
        # agent branches complete without emitting token chunks.
        publish({"event": "assistant_message", "data": assistant_message})
        state = active

        def on_stream(stream) -> None:
            state["stream"] = stream
            if state["cancel"].is_set():
                stream.close()

        def on_token(token_text: str) -> None:
            if state["cancel"].is_set():
                raise GenerationCancelled()
            state["text"] += token_text
            state["sequence"] += 1
            store.update_message(state["message_id"], state["text"], "streaming")
            publish({"event": "token_chunk", "data": {
                "session_id": session_id, "message_id": state["message_id"],
                "token": token_text, "sequence": state["sequence"],
            }})

        async def produce() -> None:
            try:
                result = await asyncio.to_thread(
                    runtime.stream, text, token=token, actor_id=str(user["id"]),
                    conversation_id=session_id, on_token=on_token,
                    on_stream=on_stream, cancel_event=state["cancel"],
                )
                if state["cancel"].is_set():
                    state["interrupted"] = True
                else:
                    # Non-RAG branches and no-context fallbacks have no model tokens.
                    answer = result.get("answer") or ""
                    # Structured memory generation deliberately buffers its
                    # JSON response, so it has no token chunks. Prefer the
                    # graph's final answer in that case; for tokenized RAG,
                    # retain the exact streamed text.
                    if not state["text"]:
                        state["text"] = answer
                    store.update_message(state["message_id"], state["text"], "completed")
                    publish({"event": "generation_completed", "data": {
                        "session_id": session_id, "message_id": state["message_id"],
                        "content": state["text"],
                    }})
            except (GenerationCancelled, AgentRunError):
                state["interrupted"] = state["cancel"].is_set()
                if not state["interrupted"]:
                    logger.exception("Chat agent run failed session_id=%s", session_id)
                    publish({"event": "generation_failed", "data": {"session_id": session_id,
                             "message_id": state["message_id"], "message": "No se pudo completar la respuesta."}})
            except Exception:
                logger.exception("Chat agent run failed session_id=%s", session_id)
                publish({"event": "generation_failed", "data": {"session_id": session_id,
                         "message_id": state["message_id"], "message": "No se pudo completar la respuesta."}})
            finally:
                if state["interrupted"]:
                    store.update_message(state["message_id"], state["text"], "interrupted")
                    store.set_session_status(session_id, "interrupted")
                    publish({"event": "generation_interrupted", "data": {
                        "session_id": session_id, "message_id": state["message_id"],
                        "content": state["text"], "status": "interrupted",
                    }})

        generation_task = asyncio.create_task(produce())

    loop = asyncio.get_running_loop()
    receive_task = asyncio.create_task(websocket.receive_json())
    queue_task = asyncio.create_task(queue.get())
    try:
        while True:
            done, _ = await asyncio.wait({receive_task, queue_task}, return_when=asyncio.FIRST_COMPLETED)
            if queue_task in done:
                event = queue_task.result()
                with suppress(Exception):
                    await websocket.send_json(event)
                queue_task = asyncio.create_task(queue.get())
            if receive_task in done:
                incoming = receive_task.result()
                receive_task = asyncio.create_task(websocket.receive_json())
                if not isinstance(incoming, dict):
                    await websocket.close(code=4400)
                    break
                event = incoming.get("event")
                data = incoming.get("data")
                if not isinstance(data, dict) or data.get("session_id") != session_id:
                    await websocket.send_json({"event": "protocol_error", "data": {"message": "session_id no coincide."}})
                    continue
                if event == "user_message":
                    if generation_task and not generation_task.done():
                        await websocket.send_json({"event": "protocol_error", "data": {"message": "Usa interrupt_requested para redirigir durante una generación."}})
                        continue
                    text = data.get("text")
                    if not isinstance(text, str) or not text.strip() or len(text) > 10000:
                        await websocket.send_json({"event": "protocol_error", "data": {"message": "Mensaje vacío o demasiado largo."}})
                        continue
                    start_turn(text)
                elif event == "interrupt_requested":
                    new_input = data.get("new_input")
                    if not isinstance(new_input, str) or not new_input.strip() or len(new_input) > 10000:
                        await websocket.send_json({"event": "protocol_error", "data": {"message": "new_input vacío o demasiado largo."}})
                        continue
                    if not active or not generation_task or generation_task.done():
                        start_turn(new_input)
                        continue
                    active["cancel"].set()
                    active["interrupted"] = True
                    stream = active.get("stream")
                    if stream is not None:
                        with suppress(Exception):
                            stream.close()
                    await generation_task
                    start_turn(new_input)
                elif event == "close_session":
                    if active and generation_task and not generation_task.done():
                        active["cancel"].set()
                        if active.get("stream") is not None:
                            with suppress(Exception):
                                active["stream"].close()
                        await generation_task
                    store.set_session_status(session_id, "closed")
                    await websocket.close(code=1000)
                    break
                else:
                    await websocket.send_json({"event": "protocol_error", "data": {"message": "Evento no soportado."}})
    except WebSocketDisconnect:
        pass
    finally:
        receive_task.cancel()
        queue_task.cancel()
        if active and generation_task and not generation_task.done():
            active["cancel"].set()
            stream = active.get("stream")
            if stream is not None:
                with suppress(Exception):
                    stream.close()
            await generation_task
        bus.unsubscribe(session_id, queue)


class GenerationCancelled(Exception):
    """Internal signal used to unwind the synchronous LangGraph worker."""


