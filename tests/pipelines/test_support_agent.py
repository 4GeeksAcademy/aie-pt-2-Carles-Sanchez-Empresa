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

import httpx
from support_agent.tools import IncidentTool, TicketInput, TicketResult, InventoryInput, InventoryResult, InventoryTool
from support_agent import routing
from support_agent.routing import RouteDecision


@pytest.fixture(autouse=True)
def documentation_router(monkeypatch):
    production_route = routing.decide_route
    monkeypatch.setattr(routing, "decide_route", lambda question: RouteDecision(
        source="rag", knowledge_question=question,
    ))
    return production_route


def incident_payload(ticket_id=482):
    return {
        "id": ticket_id, "title": "Entrega pendiente", "description": "Consultar transporte",
        "category": "delivery_failure", "status": "in_progress", "origin": "customer",
        "branch": "zaragoza_warehouse", "created_at": "2026-10-18T10:00:00Z",
        "updated_at": "2026-10-19T09:00:00Z",
    }


def test_incident_tool_uses_authenticated_get_and_validates_real_api_contract():
    def handle(request):
        assert request.method == "GET"
        assert str(request.url) == "http://incidents/api/incidents/482"
        assert request.headers["Authorization"] == "Bearer ephemeral-test-token"
        assert set(request.extensions["timeout"].values()) == {5.0}
        return httpx.Response(200, json=incident_payload())

    tool = IncidentTool("http://incidents", transport=httpx.MockTransport(handle))
    result = tool(TicketInput(ticket_id=482), token="ephemeral-test-token")
    assert result.outcome == "found"
    assert result.incident.status == "in_progress"


@pytest.mark.parametrize("status,outcome", [
    (404, "not_found"), (401, "unauthorized"), (403, "unauthorized"),
    (500, "unavailable"), (302, "unavailable"), (200, "invalid_response"),
])
def test_incident_tool_returns_sanitized_failures(status, outcome):
    tool = IncidentTool("http://incidents", transport=httpx.MockTransport(
        lambda request: httpx.Response(status, json={"detail": "private-host-secret"}),
    ))
    result = tool(TicketInput(ticket_id=482), token="test-token")
    assert result.outcome == outcome
    assert result.incident is None
    assert "private-host-secret" not in result.model_dump_json()


@pytest.mark.parametrize("error,outcome", [
    (httpx.ReadTimeout("private-host-secret"), "timeout"),
    (httpx.ConnectError("private-host-secret"), "unavailable"),
])
def test_incident_tool_handles_transport_errors(error, outcome):
    def handle(request):
        raise error

    tool = IncidentTool("http://incidents", transport=httpx.MockTransport(handle))
    assert tool(TicketInput(ticket_id=482), token="test-token").outcome == outcome


def test_incident_tool_missing_auth_never_calls_backend():
    transport = Mock()
    tool = IncidentTool("http://incidents", transport=transport)
    assert tool(TicketInput(ticket_id=482)).outcome == "unauthorized"
    transport.assert_not_called()
    with pytest.raises(ValidationError):
        TicketInput(ticket_id=True)
    with pytest.raises(ValidationError):
        TicketInput(ticket_id=0)
    with pytest.raises(ValidationError):
        TicketResult(outcome="found")


def test_incident_tool_rejects_mismatched_ticket():
    tool = IncidentTool("http://incidents", transport=httpx.MockTransport(
        lambda request: httpx.Response(200, json=incident_payload(483)),
    ))
    assert tool(TicketInput(ticket_id=482), token="test-token").outcome == "invalid_response"


def test_incident_tool_has_total_deadline(monkeypatch):
    import asyncio
    from support_agent import tools

    async def handle(request):
        await asyncio.Event().wait()

    monkeypatch.setattr(tools, "INCIDENT_TIMEOUT_SECONDS", 0.01)
    tool = IncidentTool("http://incidents", transport=httpx.MockTransport(handle))
    assert tool(TicketInput(ticket_id=482), token="test-token").outcome == "timeout"


def inventory_payload(product_id=7, **overrides):
    return {
        "id": product_id, "name": "Camiseta azul", "sku_code": f"SHIRT-{product_id}",
        "client_name": "Test brand", "category": "fashion", "warehouse": "ZGZ",
        "threshold_min": 10, "current_stock": 28, "created_at": "2026-10-19T09:00:00Z",
        **overrides,
    }


@pytest.mark.parametrize("payload", [InventoryInput(product_id=7), InventoryInput(sku_code="shirt-7", warehouse="ZGZ")])
def test_inventory_tool_authenticated_get_uses_api_contract(payload):
    def handle(request):
        assert request.method == "GET"
        assert request.headers["Authorization"] == "Bearer test-token"
        assert set(request.extensions["timeout"].values()) == {5.0}
        if payload.product_id:
            assert request.url.path == "/inventory/products/7"
            return httpx.Response(200, json=inventory_payload())
        assert request.url.path == "/inventory/products"
        assert request.url.params["warehouse"] == "ZGZ"
        return httpx.Response(200, json=[inventory_payload(), inventory_payload(8)])

    tool = InventoryTool("http://inventory", transport=httpx.MockTransport(handle))
    result = tool(payload, token="test-token")
    assert result.outcome == "found"
    assert result.products[0].model_dump() == inventory_payload()


def test_inventory_tool_reports_ambiguity_without_adding_stock():
    tool = InventoryTool("http://inventory", transport=httpx.MockTransport(
        lambda request: httpx.Response(200, json=[inventory_payload(), inventory_payload(8, warehouse="LA")]),
    ))
    result = tool(InventoryInput(product_name="Camiseta"), token="test-token")
    assert result.outcome == "ambiguous"
    assert len(result.products) == 2
    result = tool(InventoryInput(product_name="Camiseta", warehouse="LA"), token="test-token")
    assert result.outcome == "found"
    assert result.products[0].warehouse == "LA"


@pytest.mark.parametrize("response,payload,outcome", [
    (httpx.Response(404), InventoryInput(product_id=7), "not_found"),
    (httpx.Response(401), InventoryInput(product_id=7), "unauthorized"),
    (httpx.Response(403), InventoryInput(product_id=7), "unauthorized"),
    (httpx.Response(500), InventoryInput(product_id=7), "unavailable"),
    (httpx.Response(302), InventoryInput(product_id=7), "unavailable"),
    (httpx.Response(200, json={"private": "secret"}), InventoryInput(product_id=7), "invalid_response"),
    (httpx.Response(200, json=inventory_payload(8)), InventoryInput(product_id=7), "invalid_response"),
    (httpx.Response(200, json=[]), InventoryInput(sku_code="MISSING"), "not_found"),
    (httpx.Response(200, json=[inventory_payload()]), InventoryInput(sku_code="MISSING"), "not_found"),
])
def test_inventory_tool_sanitizes_failed_and_missing_lookups(response, payload, outcome):
    tool = InventoryTool("http://inventory", transport=httpx.MockTransport(lambda request: response))
    result = tool(payload, token="test-token")
    assert result.outcome == outcome
    assert not result.products
    assert "secret" not in result.model_dump_json()


@pytest.mark.parametrize("error,outcome", [
    (httpx.ReadTimeout("private-secret"), "timeout"), (httpx.ConnectError("private-secret"), "unavailable"),
])
def test_inventory_tool_transport_failure(error, outcome):
    def handle(request):
        raise error

    tool = InventoryTool("http://inventory", transport=httpx.MockTransport(handle))
    assert tool(InventoryInput(product_id=7), token="test-token").outcome == outcome


def test_inventory_tool_contract_and_missing_auth():
    with pytest.raises(ValidationError):
        InventoryInput()
    with pytest.raises(ValidationError):
        InventoryInput(product_id=True)
    with pytest.raises(ValidationError):
        InventoryInput(product_id=7, sku_code="SHIRT-7")
    with pytest.raises(ValidationError):
        InventoryInput(product_name=" ")
    with pytest.raises(ValidationError):
        InventoryResult(outcome="found")
    tool = InventoryTool("http://inventory", transport=Mock())
    assert tool(InventoryInput(product_id=7)).outcome == "unauthorized"


def test_inventory_tool_total_deadline(monkeypatch):
    import asyncio
    from support_agent import tools

    async def handle(request):
        await asyncio.Event().wait()

    monkeypatch.setattr(tools, "INVENTORY_TIMEOUT_SECONDS", 0.01)
    tool = InventoryTool("http://inventory", transport=httpx.MockTransport(handle))
    assert tool(InventoryInput(product_id=7), token="test-token").outcome == "timeout"


def test_inventory_route_never_calls_other_sources_or_persists_jwt(tmp_path):
    retrieve, incidents = Mock(), Mock()
    inventory = Mock(return_value=InventoryResult(outcome="found", products=[inventory_payload()]))
    runtime = AgentRuntime(
        tmp_path, retrieve_fn=retrieve, incident_fn=incidents, inventory_fn=inventory,
        route_fn=lambda question: RouteDecision(source="inventory", inventory_query=InventoryInput(sku_code="SHIRT-7")),
    )
    try:
        result = runtime.run("Tenemos stock de SHIRT-7?", token="private-inventory-jwt")
        trace = runtime.traces.get(result["run_id"])
        assert "Stock informado: 28 unidades" in result["answer"]
        assert trace["sources"] == ["inventory"]
        assert trace["events"][2]["node"] == "lookup_inventory"
        assert trace["events"][2]["reason"] == "found"
        assert trace["events"][-1]["node"] == "inventory_response"
        retrieve.assert_not_called()
        incidents.assert_not_called()
        inventory.assert_called_once_with(InventoryInput(sku_code="SHIRT-7"), token="private-inventory-jwt")
        assert "private-inventory-jwt" not in str(trace)
        assert "private-inventory-jwt" not in str(runtime.history(result["thread_id"]))
        assert runtime._token is None
    finally:
        runtime.close()


@pytest.mark.parametrize("outcome", ["not_found", "ambiguous", "timeout", "unauthorized", "unavailable", "invalid_response"])
def test_inventory_graph_has_honest_explicit_fallback(tmp_path, outcome):
    inventory = lambda payload, token: InventoryResult(
        outcome=outcome, products=[inventory_payload(), inventory_payload(8)] if outcome == "ambiguous" else [],
    )
    runtime = AgentRuntime(tmp_path, inventory_fn=inventory, route_fn=lambda question: RouteDecision(
        source="inventory", inventory_query=InventoryInput(product_name="Camiseta"),
    ))
    try:
        result = runtime.run("Stock de Camiseta?")
        trace = runtime.traces.get(result["run_id"])
        assert result["status"] == "completed"
        assert trace["sources"] == ["inventory"]
        assert trace["events"][2]["reason"] == outcome
        assert trace["events"][2]["next"] == "inventory_fallback"
        assert trace["events"][-1]["node"] == "inventory_fallback"
        assert "Stock informado:" not in result["answer"]
        assert "28" not in result["answer"]
    finally:
        runtime.close()


@pytest.mark.parametrize("source,expected", [
    ("inventory_rag", ["inventory", "rag"]),
    ("operations", ["incidents", "inventory"]),
    ("all", ["incidents", "inventory", "rag"]),
])
@pytest.mark.parametrize("inventory_outcome", ["found", "timeout"])
def test_inventory_combined_routes_preserve_available_sources(tmp_path, source, expected, inventory_outcome):
    runtime = AgentRuntime(
        tmp_path, retrieve_fn=lambda question: [{"text": "Policy"}], generate_fn=lambda question, chunks: "Policy answer",
        incident_fn=lambda payload, token: TicketResult(outcome="found", incident=incident_payload()),
        inventory_fn=lambda payload, token: InventoryResult(
            outcome=inventory_outcome, products=[inventory_payload()] if inventory_outcome == "found" else [],
        ),
        route_fn=lambda question: RouteDecision(
            source=source, ticket_id=482 if source in {"operations", "all"} else None,
            inventory_query=InventoryInput(sku_code="SHIRT-7"),
            knowledge_question="Storage policy?" if source in {"inventory_rag", "all"} else None,
        ),
    )
    try:
        result = runtime.run("Ticket 482, stock de SHIRT-7 y politica de almacenamiento?")
        trace = runtime.traces.get(result["run_id"])
        assert trace["sources"] == expected
        assert ("Stock informado: 28 unidades" if inventory_outcome == "found" else "No pude confirmar el stock") in result["answer"]
        if "incidents" in expected:
            assert "Estado: in_progress" in result["answer"]
        if "rag" in expected:
            assert "Policy answer" in result["answer"]
    finally:
        runtime.close()


def test_inventory_missing_product_requests_clarification():
    inventory = Mock()
    result = build_graph(inventory_fn=inventory, route_fn=lambda question: RouteDecision(source="inventory")).invoke({"question": "Tenemos stock?"})
    assert "Indica el ID, SKU o nombre" in result["answer"]
    inventory.assert_not_called()


def test_inventory_router_rejects_invented_product_reference():
    inventory = Mock()
    result = build_graph(inventory_fn=inventory, route_fn=lambda question: RouteDecision(
        source="inventory", inventory_query=InventoryInput(sku_code="INVENTED"),
    )).invoke({"question": "Stock de SHIRT-7?"})
    assert result["routing_failed"]
    inventory.assert_not_called()


def test_inventory_router_does_not_treat_sku_suffix_as_product_id():
    with pytest.raises(ValueError):
        routing.validate_decision(RouteDecision(source="inventory", inventory_query=InventoryInput(product_id=7)), "Stock de SHIRT-7?")


def test_real_inventory_router_calculates_stock_and_only_reads_sql(monkeypatch):
    from fastapi import Depends
    from sqlalchemy import event
    from sqlalchemy.pool import StaticPool
    from sqlmodel import SQLModel, Session, create_engine, select
    from tinydb import TinyDB
    from tinydb.storages import MemoryStorage
    import auth
    from caching import invalidate
    from database import get_db
    from models import SKU, StockEntry, StockExit
    from routes import inventory

    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine, tables=[SKU.__table__, StockEntry.__table__, StockExit.__table__])
    with Session(engine) as session:
        session.add(SKU(id=7, name="Camiseta azul", sku_code="SHIRT-7", client_name="Test brand", category="fashion", warehouse="ZGZ"))
        session.add(StockEntry(sku_id=7, quantity=40, reference="TEST-IN", warehouse="ZGZ", user_uuid="1"))
        session.add(StockEntry(sku_id=7, quantity=100, reference="OTHER-WAREHOUSE", warehouse="LA", user_uuid="1"))
        session.add(StockExit(sku_id=7, quantity=12, exit_type="dispatch", tracking_number="TEST", warehouse="ZGZ", user_uuid="1"))
        session.commit()
    statements = []
    event.listen(engine, "before_cursor_execute", lambda connection, cursor, statement, params, context, many: statements.append(statement))

    def database_session():
        with Session(engine) as session:
            yield session

    invalidate("GET:/inventory/products")
    try:
        with TinyDB(storage=MemoryStorage) as users_db:
            users = users_db.table("users")
            identifier = users.insert({"email": "inventory-integration@example.test", "role": "user"})
            monkeypatch.setattr(auth, "users_table", users)
            application = FastAPI()
            application.include_router(inventory.router, dependencies=[Depends(auth.get_current_user)])
            application.dependency_overrides[get_db] = database_session
            token = auth.create_access_token({"sub": str(identifier)})
            tool = InventoryTool("http://inventory", transport=httpx.ASGITransport(app=application))
            result = tool(InventoryInput(product_id=7), token=token)
            assert result.outcome == "found"
            assert result.products[0].current_stock == 28
            result = tool(InventoryInput(sku_code="SHIRT-7", warehouse="ZGZ"), token=token)
            assert result.outcome == "found"
            assert result.products[0].current_stock == 28
            assert tool(InventoryInput(product_id=999), token=token).outcome == "not_found"
            assert tool(InventoryInput(product_id=7), token="invalid-jwt").outcome == "unauthorized"
            assert statements and all(statement.lstrip().upper().startswith("SELECT") for statement in statements)
    finally:
        invalidate("GET:/inventory/products")
        engine.dispose()


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
    assert set(result) == set(AgentState.model_fields)


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
        assert [event["node"] for event in trace["events"]] == ["receive_question", "route_question", "retrieve_context"]
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
        assert trace["sources"] == ["rag"]
        assert trace["events"][-1]["source"] == "rag"
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
            assert [event["node"] for event in trace["events"]] == ["receive_question", "route_question", "retrieve_context", "generate_response"]
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
        assert response.status_code == 401
        assert "run_id" not in response.json().get("detail", {})


def test_api_imports_when_root_services_package_was_loaded_first():
    repository = Path(__file__).resolve().parents[2]
    api = repository / "services" / "api"
    script = (
        "import services, sys; "
        f"sys.path.insert(0, {str(api)!r}); "
        "assert hasattr(services, '__path__'); import main"
    )
    subprocess.run([sys.executable, "-c", script], cwd=repository, check=True)


def test_ticket_route_never_calls_rag_and_does_not_persist_credentials(tmp_path):
    retrieve, generate = Mock(), Mock()
    tool = Mock(return_value=TicketResult(outcome="found", incident=incident_payload()))
    runtime = AgentRuntime(
        tmp_path, retrieve_fn=retrieve, generate_fn=generate, incident_fn=tool,
        route_fn=lambda question: RouteDecision(source="incidents", ticket_id=482),
    )
    try:
        result = runtime.run("En que estado esta el ticket 482?", token="private-jwt")
        trace = runtime.traces.get(result["run_id"])
        assert "Estado: in_progress" in result["answer"]
        assert trace["sources"] == ["incidents"]
        assert [event["node"] for event in trace["events"]] == [
            "receive_question", "route_question", "lookup_incident", "ticket_response",
        ]
        assert trace["events"][2]["reason"] == "found"
        tool.assert_called_once_with(TicketInput(ticket_id=482), token="private-jwt")
        retrieve.assert_not_called()
        generate.assert_not_called()
        assert "private-jwt" not in str(trace)
        assert "private-jwt" not in str(runtime.history(result["thread_id"]))
        assert runtime._token is None
    finally:
        runtime.close()


@pytest.mark.parametrize("outcome", ["not_found", "timeout", "unauthorized", "unavailable", "invalid_response"])
def test_ticket_failures_have_explicit_honest_fallback(tmp_path, outcome):
    retrieve = Mock()
    runtime = AgentRuntime(
        tmp_path, retrieve_fn=retrieve,
        route_fn=lambda question: RouteDecision(source="incidents", ticket_id=482),
        incident_fn=lambda payload, token: TicketResult(outcome=outcome),
    )
    try:
        result = runtime.run("Estado del ticket 482?")
        trace = runtime.traces.get(result["run_id"])
        assert result["status"] == "completed"
        assert trace["events"][-1]["node"] == "tool_fallback"
        assert trace["events"][2]["next"] == "tool_fallback"
        assert trace["events"][2]["reason"] == outcome
        assert "in_progress" not in result["answer"]
        assert "No se encontro" in result["answer"] if outcome == "not_found" else "No pude confirmar" in result["answer"]
        retrieve.assert_not_called()
    finally:
        runtime.close()


@pytest.mark.parametrize("outcome", ["found", "timeout"])
def test_mixed_question_separates_sources_and_preserves_partial_answer(tmp_path, outcome):
    chunks = [{"text": "Politica de devoluciones", "score": 0.9}]
    retrieve = Mock(return_value=chunks)
    generate = Mock(return_value="Las devoluciones internacionales requieren gestion manual.")
    runtime = AgentRuntime(
        tmp_path, retrieve_fn=retrieve, generate_fn=generate,
        route_fn=lambda question: RouteDecision(source="both", ticket_id=482, knowledge_question="Politica de devoluciones internacionales?"),
        incident_fn=lambda payload, token: TicketResult(
            outcome=outcome, incident=incident_payload() if outcome == "found" else None,
        ),
    )
    try:
        result = runtime.run("Estado del ticket 482 y politica de devoluciones internacionales?")
        trace = runtime.traces.get(result["run_id"])
        assert trace["sources"] == ["incidents", "rag"]
        assert "gestion manual" in result["answer"]
        assert ("Estado: in_progress" if outcome == "found" else "No pude confirmar") in result["answer"]
        retrieve.assert_called_once_with("Politica de devoluciones internacionales?")
        generate.assert_called_once_with("Politica de devoluciones internacionales?", chunks)
    finally:
        runtime.close()


def test_missing_ticket_id_requests_clarification_without_sources():
    retrieve, tool = Mock(), Mock()
    graph = build_graph(
        retrieve_fn=retrieve, incident_fn=tool,
        route_fn=lambda question: RouteDecision(source="incidents"),
    )
    result = graph.invoke({"question": "Como esta mi ticket?"})
    assert "Indica el ID" in result["answer"]
    retrieve.assert_not_called()
    tool.assert_not_called()


@pytest.mark.parametrize("decision", [None, {"source": "incidents", "ticket_id": 999}])
def test_invalid_router_never_falls_back_to_rag(decision):
    retrieve, tool = Mock(), Mock()
    result = build_graph(
        retrieve_fn=retrieve, incident_fn=tool, route_fn=lambda question: decision,
    ).invoke({"question": "Estado del ticket 482?"})
    assert result["routing_failed"]
    assert "No pude determinar" in result["answer"]
    retrieve.assert_not_called()
    tool.assert_not_called()


def test_graph_without_mcp_fails_closed_for_operations_but_keeps_rag():
    retrieve = Mock(return_value=[{"text": "Policy"}])
    route = lambda question: RouteDecision(source="incidents", ticket_id=482)
    result = build_graph(route_fn=route, retrieve_fn=retrieve).invoke({"question": "Estado del ticket 482?"})
    assert result["ticket_result"]["outcome"] == "unavailable"
    retrieve.assert_not_called()

    rag_result = build_graph(
        route_fn=lambda question: RouteDecision(source="rag", knowledge_question=question),
        retrieve_fn=retrieve, generate_fn=lambda question, chunks: "Policy answer",
    ).invoke({"question": "Politica de devoluciones?"})
    assert rag_result["answer"] == "Policy answer"
    retrieve.assert_called_once()


def test_graph_routes_operational_lookup_through_mcp_when_configured(monkeypatch):
    from types import SimpleNamespace
    from support_agent.tools import MCPTrackFlowTools

    calls = []
    incident = incident_payload(482)

    def fake_mcp_call(self, name, arguments, *, token=None):
        calls.append(("mcp", name, arguments, token))
        return SimpleNamespace(isError=False, structuredContent=incident)

    def retrieve(question):
        calls.append(("rag", question))
        return [{"text": "Return policy"}]

    monkeypatch.setattr(MCPTrackFlowTools, "_call", fake_mcp_call)
    graph = build_graph(
        retrieve_fn=retrieve,
        generate_fn=lambda question, chunks: "Policy answer",
        route_fn=lambda question: RouteDecision(source="both", ticket_id=482, knowledge_question="Politica?"),
        mcp_server_url="https://mcp.trackflow.test/mcp",
        token_provider=lambda: "request-oauth-token",
    )

    result = graph.invoke({"question": "Estado del ticket 482 y politica?"})

    assert result["ticket_result"]["outcome"] == "found"
    assert "Estado: in_progress" in result["answer"]
    assert "Documentacion: Policy answer" in result["answer"]
    assert calls == [
        ("mcp", "incidents_get", {"incident_id": 482}, "request-oauth-token"),
        ("rag", "Politica?"),
    ]


def test_http_forwards_only_callers_token(tmp_path):
    tool = Mock(return_value=TicketResult(outcome="unauthorized"))
    runtime = AgentRuntime(tmp_path, incident_fn=tool, route_fn=lambda question: RouteDecision(source="incidents", ticket_id=482))
    application = FastAPI()
    application.state.support_agent = runtime
    application.include_router(router)
    try:
        with TestClient(application) as client:
            response = client.post("/agent/query", json={"question": "Ticket 482?"}, headers={"Authorization": "Bearer request-only-token"})
            assert response.status_code == 200
            assert tool.call_args.kwargs["token"] == "request-only-token"
            client.post("/agent/query", json={"question": "Ticket 482?"})
            assert tool.call_args.kwargs["token"] is None
    finally:
        runtime.close()


def test_real_incident_router_and_auth_are_read_only(tmp_path, monkeypatch):
    from fastapi import Depends
    from tinydb import TinyDB
    from tinydb.storages import MemoryStorage
    import auth
    from routes import incidents

    with TinyDB(storage=MemoryStorage) as database:
        users = database.table("users")
        tickets = database.table("incidents")
        user_id = users.insert({"email": "integration@example.test", "role": "user"})
        payload = incident_payload(1)
        payload.pop("id")
        ticket_id = tickets.insert(payload)
        before = tickets.all()
        monkeypatch.setattr(auth, "users_table", users)
        monkeypatch.setattr(incidents, "incidents_table", tickets)
        application = FastAPI()
        application.include_router(incidents.router, dependencies=[Depends(auth.get_current_user)])
        tool = IncidentTool("http://incidents", transport=httpx.ASGITransport(app=application))
        token = auth.create_access_token({"sub": str(user_id)})
        found = tool(TicketInput(ticket_id=ticket_id), token=token)
        assert found.incident.status == "in_progress"
        assert found.incident.model_dump() == {**payload, "id": ticket_id}
        assert tool(TicketInput(ticket_id=999), token=token).outcome == "not_found"
        assert tool(TicketInput(ticket_id=ticket_id), token="invalid-token").outcome == "unauthorized"
        assert tickets.all() == before


def test_resume_requires_new_credentials_without_checkpointing_them(tmp_path):
    route = lambda question: RouteDecision(source="incidents", ticket_id=482)
    runtime = AgentRuntime(tmp_path, route_fn=route, interrupt_after=["route_question"])
    try:
        paused = runtime.run("Ticket 482?", token="old-private-token")
        assert paused["status"] == "paused"
    finally:
        runtime.close()
    tool = Mock(return_value=TicketResult(outcome="unauthorized"))
    resumed = AgentRuntime(tmp_path, route_fn=route, incident_fn=tool)
    try:
        result = resumed.resume(paused["thread_id"])
        tool.assert_called_once_with(TicketInput(ticket_id=482), token=None)
        assert "old-private-token" not in str(resumed.history(result["thread_id"]))
        assert "No pude confirmar" in result["answer"]
    finally:
        resumed.close()


def test_resume_legacy_rag_checkpoint_without_routing_decision(tmp_path):
    retrieve = Mock(return_value=[{"text": "Existing policy"}])
    runtime = AgentRuntime(tmp_path, retrieve_fn=retrieve, interrupt_after=["retrieve_context"])
    try:
        paused = runtime.run("Politica de devoluciones?")
        config = {"configurable": {"thread_id": paused["thread_id"]}}
        runtime.graph.update_state(config, {"decision": None}, as_node="retrieve_context")
    finally:
        runtime.close()
    generate = Mock(return_value="Existing policy answer")
    restarted = AgentRuntime(tmp_path, retrieve_fn=retrieve, generate_fn=generate)
    try:
        result = restarted.resume(paused["thread_id"])
        assert result["answer"] == "Existing policy answer"
        retrieve.assert_called_once()
        generate.assert_called_once_with("Politica de devoluciones?", [{"text": "Existing policy"}])
    finally:
        restarted.close()


def test_production_router_uses_validated_model_output(monkeypatch, documentation_router):
    from types import SimpleNamespace
    decide_route = documentation_router

    completion = SimpleNamespace(choices=[SimpleNamespace(finish_reason="stop", message=SimpleNamespace(
        content='{"source":"incidents","ticket_id":482,"knowledge_question":null}',
    ))])
    client = Mock()
    client.with_options.return_value = client
    client.chat.completions.create.return_value = completion
    monkeypatch.setattr(routing.rag, "get_openai_client", lambda: client)
    decision = decide_route("Estado del ticket 482?")
    assert decision.source == "incidents"
    client.with_options.assert_called_once_with(timeout=20.0, max_retries=0)
    assert client.chat.completions.create.call_args.kwargs["response_format"] == {"type": "json_object"}
    assert client.chat.completions.create.call_args.kwargs["max_tokens"] == 1024
    completion.choices[0].finish_reason = "length"
    with pytest.raises(ValueError, match="Incomplete"):
        decide_route("Estado del ticket 482?")
    completion.choices[0].finish_reason = "stop"
    completion.choices[0].message.content = '{"source":"unknown"}'
    with pytest.raises(ValidationError):
        decide_route("Estado del ticket 482?")


@pytest.mark.parametrize("failure", ["retrieve", "generate"])
def test_mixed_question_keeps_ticket_data_when_knowledge_fails(failure):
    retrieve = Mock(return_value=[{"text": "Policy"}])
    generate = Mock(return_value="Policy")
    (retrieve if failure == "retrieve" else generate).side_effect = ConnectionError("private")
    result = build_graph(
        retrieve_fn=retrieve, generate_fn=generate,
        route_fn=lambda question: RouteDecision(source="both", ticket_id=482, knowledge_question="Politica?"),
        incident_fn=lambda payload, token: TicketResult(outcome="found", incident=incident_payload()),
    ).invoke({"question": "Estado del ticket 482 y politica?"})
    assert "Estado: in_progress" in result["answer"]
    assert "No pude consultar la documentacion" in result["answer"]
    assert "private" not in result["answer"]