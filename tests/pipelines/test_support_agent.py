"""Offline graph contracts and persistent runtime regression tests."""

import sys
import subprocess
from pathlib import Path
from unittest.mock import Mock

import pytest
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "services"))

from support_agent.graph import AgentState, GraphStructureError, build_graph, compile_graph
from support_agent.runtime import AgentRunError, AgentRuntime
from fastapi import FastAPI
from fastapi.testclient import TestClient
from support_agent.api import router
from support_agent import api as agent_api


def test_retrieves_once_and_generates_from_same_context():
    chunks = [{"text": "Documented policy", "score": 0.9, "source_document": "storage-pricing"}]
    retrieve = Mock(return_value=chunks)
    generate = Mock(return_value="Documented answer")
    graph = build_graph(InMemorySaver(), retrieve_fn=retrieve, generate_fn=generate)
    config = {"configurable": {"thread_id": "contract"}}
    result = graph.invoke({"question": "  Storage?  "}, config)
    retrieve.assert_called_once_with("Storage?")
    generate.assert_called_once_with("Storage?", chunks)
    assert result["answer"] == "Documented answer"
    assert set(result) == {"question", "context", "answer", "error"}


@pytest.mark.parametrize("question", ["", "   "])
def test_empty_question_ends_without_retrieval(question):
    retrieve = Mock()
    generate = Mock()
    result = build_graph(retrieve_fn=retrieve, generate_fn=generate).invoke({"question": question})
    assert result["error"]
    assert result["answer"] is None
    retrieve.assert_not_called()
    generate.assert_not_called()


def test_no_context_uses_honest_fallback_without_generation():
    generate = Mock()
    result = build_graph(retrieve_fn=lambda question: [], generate_fn=generate).invoke({"question": "Pizza?"})
    assert "no disponemos de informaci" in result["answer"]
    generate.assert_not_called()


def test_state_rejects_wrong_types_and_history():
    with pytest.raises(ValidationError):
        build_graph().invoke({"question": 123})
    with pytest.raises(ValidationError):
        AgentState(question="Question", history=[])


def test_compile_rejects_disconnected_node():
    builder = StateGraph(AgentState)
    builder.add_node("receive", lambda state: {})
    builder.add_node("orphan", lambda state: {})
    builder.add_edge(START, "receive")
    builder.add_edge("receive", END)
    with pytest.raises(GraphStructureError, match="orphan"):
        compile_graph(builder)


def test_compile_rejects_unvalidated_schema():
    with pytest.raises(GraphStructureError, match="AgentState"):
        compile_graph(StateGraph(dict))


def test_checkpoint_and_trace_survive_restart_and_resume_without_retrieval(tmp_path):
    chunks = [{"text": "Policy", "score": 0.9}]
    retrieve = Mock(return_value=chunks)
    generate = Mock(return_value="Grounded answer")
    runtime = AgentRuntime(tmp_path, retrieve_fn=retrieve, generate_fn=generate, interrupt_after=["retrieve_context"])
    try:
        first = runtime.run("Question")
        assert first["status"] == "paused"
        assert any(snapshot.values.get("context") == chunks and snapshot.next == ("generate_response",)
                   for snapshot in runtime.history(first["thread_id"]))
    finally:
        runtime.close()
    restarted = AgentRuntime(tmp_path, retrieve_fn=retrieve, generate_fn=generate)
    try:
        trace = restarted.traces.get(first["run_id"])
        assert [event["node"] for event in trace["events"]] == ["receive_question", "retrieve_context"]
        resumed = restarted.resume(first["thread_id"])
        assert resumed["answer"] == "Grounded answer"
        assert resumed["status"] == "completed"
        assert resumed["run_id"] != first["run_id"]
        retrieve.assert_called_once()
        generate.assert_called_once_with("Question", chunks)
        assert [event["node"] for event in restarted.traces.get(resumed["run_id"])["events"]] == ["generate_response"]
    finally:
        restarted.close()


def test_failed_node_has_persistent_sanitized_trace_and_can_resume(tmp_path):
    retrieve = Mock(side_effect=ConnectionError("secret-token-and-internal-host"))
    runtime = AgentRuntime(tmp_path, retrieve_fn=retrieve, generate_fn=lambda question, context: "Recovered")
    try:
        with pytest.raises(AgentRunError) as raised:
            runtime.run("Question")
        assert raised.value.status_code == 503
        trace = runtime.traces.get(raised.value.run_id)
        assert trace["status"] == "failed"
        assert trace["events"][-1]["node"] == "retrieve_context"
        assert trace["events"][-1]["status"] == "failed"
        assert "secret-token" not in str(trace)
        assert "secret-token" not in str(raised.value)
        retrieve.side_effect = None
        retrieve.return_value = [{"text": "Recovered policy", "score": 0.9}]
        result = runtime.resume(trace["thread_id"])
        assert result["answer"] == "Recovered"
    finally:
        runtime.close()


def test_endpoint_invokes_graph_and_returns_trace_id(tmp_path):
    retrieve = Mock(return_value=[{"text": "Policy", "score": 0.9}])
    generate = Mock(return_value="Answer from existing RAG")
    runtime = AgentRuntime(tmp_path, retrieve_fn=retrieve, generate_fn=generate)
    application = FastAPI()
    application.state.support_agent = runtime
    application.include_router(router)
    try:
        with TestClient(application) as client:
            response = client.post("/agent/query", json={"question": "Policy?"})
            assert response.status_code == 200
            assert set(response.json()) == {"answer", "run_id", "thread_id"}
            trace = runtime.traces.get(response.json()["run_id"])
            assert trace["answer"] == response.json()["answer"]
            assert [event["node"] for event in trace["events"]] == ["receive_question", "retrieve_context", "generate_response"]
            retrieve.assert_called_once_with("Policy?")
            generate.assert_called_once()
            empty = client.post("/agent/query", json={"question": "   "})
            assert empty.status_code == 400
            assert runtime.traces.get(empty.json()["detail"]["run_id"])["status"] == "rejected"
            for invalid in [{}, {"question": 1}, {"question": "Question", "history": []}]:
                assert client.post("/agent/query", json=invalid).status_code == 422
    finally:
        runtime.close()


@pytest.mark.parametrize("node,error,status_code", [
    ("retrieve", ConnectionError("private-host-secret"), 503),
    ("generate", RuntimeError("private-host-secret"), 500),
])
def test_endpoint_sanitizes_node_errors(tmp_path, node, error, status_code):
    retrieve = Mock(return_value=[{"text": "Policy", "score": 0.9}])
    generate = Mock(return_value="Answer")
    (retrieve if node == "retrieve" else generate).side_effect = error
    runtime = AgentRuntime(tmp_path, retrieve_fn=retrieve, generate_fn=generate)
    application = FastAPI()
    application.state.support_agent = runtime
    application.include_router(router)
    try:
        with TestClient(application) as client:
            response = client.post("/agent/query", json={"question": "Question"})
        assert response.status_code == status_code
        assert "private-host" not in response.text
        assert "Traceback" not in response.text
        assert runtime.traces.get(response.json()["detail"]["run_id"])["status"] == "failed"
    finally:
        runtime.close()


def test_invalid_retrieval_output_fails_before_generation():
    generate = Mock(return_value="Must not run")
    graph = build_graph(retrieve_fn=lambda question: "wrong context type", generate_fn=generate)
    with pytest.raises(ValidationError):
        graph.invoke({"question": "Question"})
    generate.assert_not_called()


def test_startup_fails_clearly_if_graph_cannot_compile(monkeypatch):
    monkeypatch.setattr(agent_api, "AgentRuntime", Mock(side_effect=GraphStructureError("Invalid graph")))
    with pytest.raises(GraphStructureError, match="Invalid graph"):
        with TestClient(agent_api.app):
            pytest.fail("The service must not start with an invalid graph")


def test_unified_api_registers_agent_and_preserves_legacy_rag(tmp_path, monkeypatch):
    import main

    monkeypatch.setenv("SUPPORT_AGENT_STATE_DIR", str(tmp_path))
    monkeypatch.setattr(main.SQLModel.metadata, "create_all", Mock())
    with TestClient(main.app) as client:
        assert main.app.state.support_agent.graph is not None
        paths = client.get("/openapi.json").json()["paths"]
        assert "/knowledge/query" in paths
        assert "/agent/query" in paths
        response = client.post("/agent/query", json={"question": "   "})
        assert response.status_code == 400
        assert main.app.state.support_agent.traces.get(response.json()["detail"]["run_id"])["status"] == "rejected"


def test_api_imports_when_root_services_package_was_loaded_first():
    repository = Path(__file__).resolve().parents[2]
    api = repository / "services" / "api"
    script = (
        "import services, sys; "
        f"sys.path.insert(0, {str(api)!r}); "
        "assert hasattr(services, '__path__'); import main"
    )
    subprocess.run([sys.executable, "-c", script], cwd=repository, check=True)