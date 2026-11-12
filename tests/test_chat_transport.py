import asyncio
import sys
import types
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

from support_agent.chat_pubsub import ChatPubSub
from support_agent.chat_store import ChatStore


# Avoid keeping optional-runtime stubs in sys.modules after this test module is
# imported, where they could interfere with other suites in the same process.
_STUB_MODULES = (
    "langchain_core", "langchain_core.runnables", "langgraph",
    "langgraph.checkpoint", "langgraph.checkpoint.sqlite", "langgraph.graph",
)
_PREVIOUS_MODULES = {name: sys.modules.get(name) for name in _STUB_MODULES}
for module_name in ("support_agent.chat_api", "support_agent.runtime", "support_agent.graph"):
    sys.modules.pop(module_name, None)
if "langchain_core.runnables" not in sys.modules:
    langchain_core = types.ModuleType("langchain_core")
    runnables = types.ModuleType("langchain_core.runnables")
    runnables.RunnableConfig = dict
    sys.modules.setdefault("langchain_core", langchain_core)
    sys.modules.setdefault("langchain_core.runnables", runnables)
if "langgraph.checkpoint.sqlite" not in sys.modules:
    langgraph = types.ModuleType("langgraph")
    checkpoint = types.ModuleType("langgraph.checkpoint")
    sqlite_module = types.ModuleType("langgraph.checkpoint.sqlite")
    sqlite_module.SqliteSaver = object
    sys.modules.setdefault("langgraph", langgraph)
    sys.modules.setdefault("langgraph.checkpoint", checkpoint)
    sys.modules.setdefault("langgraph.checkpoint.sqlite", sqlite_module)
if "langgraph.graph" not in sys.modules:
    graph_module = types.ModuleType("langgraph.graph")
    graph_module.END = "END"
    graph_module.START = "START"
    graph_module.StateGraph = object
    sys.modules.setdefault("langgraph.graph", graph_module)

from support_agent.chat_api import router

for _module_name, _previous_module in _PREVIOUS_MODULES.items():
    if _previous_module is None:
        sys.modules.pop(_module_name, None)
    else:
        sys.modules[_module_name] = _previous_module


class FakeRuntime:
    def __init__(self, store):
        self.chat_store = store

    def stream(self, question, *, on_token, on_stream=None, cancel_event=None, **kwargs):
        for token in ("Hola", " mundo"):
            if cancel_event.is_set():
                from support_agent.chat_api import GenerationCancelled
                raise GenerationCancelled()
            on_token(token)
        return {"answer": "Hola mundo"}


def test_websocket_sends_completed_answer_when_agent_does_not_stream(tmp_path, monkeypatch):
    import support_agent.chat_api as chat_api

    store = ChatStore(tmp_path / "chat.sqlite3")
    session = store.create_session("user-1")

    class NonStreamingRuntime(FakeRuntime):
        def stream(self, question, **kwargs):
            return {"answer": "Respuesta final sin chunks"}

    app = FastAPI()
    app.state.support_agent = NonStreamingRuntime(store)
    app.include_router(router)

    async def authenticated_user(*args, **kwargs):
        return {"id": "user-1"}

    monkeypatch.setattr(chat_api, "get_current_user", authenticated_user)

    with TestClient(app) as client:
        with client.websocket_connect(
            f"/agent/chat/ws/{session['session_id']}?token=test-token"
        ) as websocket:
            snapshot = websocket.receive_json()
            assert snapshot["event"] == "session_snapshot"
            websocket.send_json({
                "event": "user_message",
                "data": {"session_id": session["session_id"], "text": "Pregunta"},
            })

            events = []
            while not any(event["event"] == "generation_completed" for event in events):
                events.append(websocket.receive_json())

    assistant_message = next(event for event in events if event["event"] == "assistant_message")
    completed = next(event for event in events if event["event"] == "generation_completed")
    assert assistant_message["data"]["role"] == "assistant"
    assert completed["data"]["content"] == "Respuesta final sin chunks"
    saved_assistant = store.messages(session["session_id"])[-1]
    assert saved_assistant["content"] == "Respuesta final sin chunks"
    assert saved_assistant["status"] == "completed"


def make_client(tmp_path, monkeypatch):
    store = ChatStore(tmp_path / "chat.sqlite3")
    import asyncio
    import sys
    import types

    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from support_agent.chat_pubsub import ChatPubSub
    from support_agent.chat_store import ChatStore


    def load_chat_router():
        stub_names = (
            "langchain_core", "langchain_core.runnables", "langgraph",
            "langgraph.checkpoint", "langgraph.checkpoint.sqlite", "langgraph.graph",
        )
        previous = {name: sys.modules.get(name) for name in stub_names}
        for name in ("support_agent.chat_api", "support_agent.runtime", "support_agent.graph"):
            sys.modules.pop(name, None)
        if "langchain_core.runnables" not in sys.modules:
            core = types.ModuleType("langchain_core")
            runnables = types.ModuleType("langchain_core.runnables")
            runnables.RunnableConfig = dict
            sys.modules["langchain_core"] = core
            sys.modules["langchain_core.runnables"] = runnables
        if "langgraph.checkpoint.sqlite" not in sys.modules:
            graph = types.ModuleType("langgraph")
            checkpoint = types.ModuleType("langgraph.checkpoint")
            sqlite = types.ModuleType("langgraph.checkpoint.sqlite")
            sqlite.SqliteSaver = object
            sys.modules.update({"langgraph": graph, "langgraph.checkpoint": checkpoint,
                                "langgraph.checkpoint.sqlite": sqlite})
        if "langgraph.graph" not in sys.modules:
            graph_module = types.ModuleType("langgraph.graph")
            graph_module.END = "END"
            graph_module.START = "START"
            graph_module.StateGraph = object
            sys.modules["langgraph.graph"] = graph_module
        try:
            from support_agent.chat_api import router
            return router
        finally:
            for name, module in previous.items():
                if module is None:
                    sys.modules.pop(name, None)
                else:
                    sys.modules[name] = module


    router = load_chat_router()
    loop.close()
