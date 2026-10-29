"""Evaluate saved traces only: no graph execution, Qdrant or model calls."""

import hashlib
import json
import re
import unicodedata
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = Path(__file__).parent / "fixtures/support_agent/reference_traces.json"
POLICY = ROOT / "docs/company-knowledge-base/trackflow-storage-pricing.es.md"


def normalized(text):
    return " ".join("".join(character for character in unicodedata.normalize("NFKD", text)
                            if not unicodedata.combining(character)).lower().split())


@pytest.fixture(scope="module")
def traces():
    saved = json.loads(FIXTURE.read_text(encoding="utf-8"))
    for trace in saved.values():
        assert trace["schema_version"] == 1
        assert trace["metadata"]["capture_kind"] in {"live", "simulated"}
        assert trace["metadata"]["graph_sha256"] == hashlib.sha256((ROOT / "services/support_agent/graph.py").read_bytes()).hexdigest()
        for module in ("routing", "tools"):
            assert trace["metadata"][f"{module}_sha256"] == hashlib.sha256((ROOT / f"services/support_agent/{module}.py").read_bytes()).hexdigest()
        assert trace["metadata"]["rag_sha256"] == hashlib.sha256((ROOT / "data/pipelines/rag.py").read_bytes()).hexdigest()
        for name, digest in trace["metadata"]["corpus_sha256"].items():
            assert hashlib.sha256((ROOT / "docs/company-knowledge-base" / name).read_bytes()).hexdigest() == digest
        assert trace["metadata"]["corpus_sha256"], "Missing corpus provenance"
    return saved


def assert_storage_grounding(trace):
    policy = normalized(POLICY.read_text(encoding="utf-8"))
    expected = re.search(r"(\d+) eur por metro cubico al mes \(zaragoza\)", policy).group(1)
    answer = normalized(trace["answer"])
    assert "zaragoza" in answer
    assert f"{expected} eur por metro cubico al mes" in answer
    assert "usd" not in answer
    assert "no es" not in answer
    assert re.findall(r"\b(\d+)\s*eur\b", answer) == [expected]
    chunks = next(event for event in trace["events"] if event["node"] == "retrieve_context")["output"]["context"]
    assert any(chunk["source_document"] == "storage-pricing"
               and f"{expected} eur por metro cubico al mes" in normalized(chunk["text"])
               for chunk in chunks)


def test_eval_retrieve_precedes_generation_and_context_is_not_retrieved_twice(traces):
    trace = traces["storage"]
    events = trace["events"]
    assert trace["status"] == "completed"
    assert [event["node"] for event in events] == ["receive_question", "route_question", "retrieve_context", "generate_response"]
    assert [event["sequence"] for event in events] == [1, 2, 3, 4]
    assert all(event["status"] == "completed" and event["duration_ms"] >= 0 for event in events)
    assert events[2]["output"]["context"] == events[3]["input"]["context"]
    assert events[2]["next"] == "generate_response"
    assert events[2]["reason"] == "context_available"
    assert events[3]["output"]["answer"] == trace["answer"]
    assert all(chunk["score"] >= trace["metadata"]["min_score"] for chunk in events[2]["output"]["context"])


def test_eval_answer_is_grounded_in_existing_storage_policy(traces):
    assert_storage_grounding(traces["storage"])


def test_eval_empty_context_routes_to_honest_response_without_generation(traces):
    trace = traces["out_of_domain"]
    assert trace["status"] == "completed"
    assert [event["node"] for event in trace["events"]] == ["receive_question", "route_question", "retrieve_context", "no_information"]
    retrieval = trace["events"][2]
    assert retrieval["output"]["context"] == []
    assert retrieval["reason"] == "empty_context"
    assert retrieval["next"] == "no_information"
    assert "no disponemos de informacion suficiente" in normalized(trace["answer"])


def test_eval_empty_question_ends_without_retrieval(traces):
    trace = traces["empty"]
    assert trace["status"] == "rejected"
    assert [event["node"] for event in trace["events"]] == ["receive_question"]
    assert trace["events"][0]["reason"] == "empty_question"
    assert trace["events"][0]["next"] == "__end__"
    assert trace["error"]
    assert trace["answer"] is None


def test_eval_perfect_routing_does_not_excuse_wrong_policy_answer(traces):
    incorrect = {**traces["storage"], "answer": "La tarifa en Zaragoza es de 18 USD por metro cubico al mes."}
    with pytest.raises(AssertionError):
        assert_storage_grounding(incorrect)


def test_eval_ticket_question_uses_tool_and_never_rag(traces):
    trace = traces["ticket"]
    assert trace["status"] == "completed"
    assert trace["sources"] == ["incidents"]
    assert trace["events"][1]["output"]["decision"]["source"] == "incidents"
    assert "retrieve_context" not in [event["node"] for event in trace["events"]]
    lookup = next(event for event in trace["events"] if event["node"] == "lookup_incident")
    result = lookup["output"]["ticket_result"]
    assert result["outcome"] in {"found", "not_found"}
    if result["outcome"] == "found":
        assert f"Estado: {result['incident']['status']}" in trace["answer"]
    else:
        assert "no se encontro" in normalized(trace["answer"])
        assert "estado:" not in normalized(trace["answer"])


def test_eval_policy_question_uses_rag_and_never_tool(traces):
    trace = traces["storage"]
    assert trace["sources"] == ["rag"]
    assert trace["events"][1]["output"]["decision"]["source"] == "rag"
    assert "lookup_incident" not in [event["node"] for event in trace["events"]]
    assert_storage_grounding(trace)


def test_eval_mixed_question_uses_incidents_before_rag(traces):
    trace = traces["mixed"]
    assert trace["status"] == "completed"
    assert trace["sources"] == ["incidents", "rag"]
    assert trace["events"][1]["output"]["decision"]["source"] == "both"
    sources = [event["source"] for event in trace["events"] if "source" in event]
    assert sources == ["incidents", "rag"]
    assert_storage_grounding(trace)


def test_eval_unavailable_tool_has_explicit_fallback_without_invented_state(traces):
    if "ticket_unavailable" not in traces:
        pytest.skip("Live captures do not deliberately interrupt the incidents service.")
    trace = traces["ticket_unavailable"]
    assert trace["status"] == "completed"
    assert trace["sources"] == ["incidents"]
    lookup = next(event for event in trace["events"] if event["node"] == "lookup_incident")
    assert lookup["output"]["ticket_result"] == {"outcome": "unavailable", "incident": None}
    assert lookup["next"] == "tool_fallback"
    assert trace["events"][-1]["node"] == "tool_fallback"
    assert "no pude confirmar" in normalized(trace["answer"])
    assert "estado:" not in normalized(trace["answer"])


def test_eval_inventory_question_never_uses_rag_or_incidents(traces):
    trace = traces["inventory"]
    assert trace["status"] == "completed"
    assert trace["sources"] == ["inventory"]
    assert [event["node"] for event in trace["events"]][:3] == ["receive_question", "route_question", "lookup_inventory"]
    result = trace["events"][2]["output"]["inventory_result"]
    assert result["outcome"] in {"found", "not_found"}
    if result["outcome"] == "found":
        assert f"Stock informado: {result['products'][0]['current_stock']} unidades" in trace["answer"]
    else:
        assert result["products"] == []
        assert "stock informado:" not in normalized(trace["answer"])


def test_eval_inventory_mixed_uses_documentation_after_tool(traces):
    trace = traces["inventory_mixed"]
    assert trace["status"] == "completed"
    assert trace["sources"] == ["inventory", "rag"]
    assert trace["events"][1]["output"]["decision"]["source"] == "inventory_rag"
    assert_storage_grounding(trace)


def test_eval_three_sources_remain_separate_and_ordered(traces):
    trace = traces["all_sources"]
    assert trace["status"] == "completed"
    assert trace["sources"] == ["incidents", "inventory", "rag"]
    assert_storage_grounding(trace)


def test_eval_inventory_unavailable_has_explicit_honest_fallback(traces):
    if "inventory_unavailable" not in traces:
        pytest.skip("Live captures do not deliberately interrupt inventory.")
    trace = traces["inventory_unavailable"]
    assert trace["status"] == "completed"
    assert trace["sources"] == ["inventory"]
    lookup = next(event for event in trace["events"] if event["node"] == "lookup_inventory")
    assert lookup["output"]["inventory_result"] == {"outcome": "unavailable", "products": []}
    assert lookup["next"] == "inventory_fallback"
    assert trace["events"][-1]["node"] == "inventory_fallback"
    assert "no pude confirmar el stock" in normalized(trace["answer"])
    assert "stock informado:" not in normalized(trace["answer"])
