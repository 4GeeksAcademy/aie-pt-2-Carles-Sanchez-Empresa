"""Explicit RAG orchestration, without duplicating retrieval or generation."""

from collections.abc import Callable
from typing import Any

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, ConfigDict, Field
import logging

from data.pipelines import rag

from . import routing
from .routing import RouteDecision
from .memory import (
    MemoryDecision, MemoryProposal, MemoryStore, classify_pending_decision,
    validate_memorizable, generate_structured_response,
)
from .tools import (
    IncidentTool, TicketInput, TicketResult, InventoryTool, InventoryResult,
    InventoryInput, MCPTrackFlowTools,
)
from .guardrails import inspect_input, validate_output

logger = logging.getLogger(__name__)


class AgentState(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    question: str
    context: list[dict[str, Any]] = Field(default_factory=list)
    answer: str | None = None
    error: str | None = None
    decision: RouteDecision | None = None
    routing_failed: bool = False
    ticket_result: TicketResult | None = None
    inventory_result: InventoryResult | None = None
    knowledge_failed: bool = False
    actor_id: str | None = None
    conversation_id: str | None = None
    memory_context: list[dict[str, Any]] = Field(default_factory=list)
    memory_proposal: dict[str, Any] | None = None
    pending_decision: dict[str, Any] | None = None
    memory_result: str | None = None
    guardrail_events: list[dict[str, str]] = Field(default_factory=list)


class GraphStructureError(ValueError):
    pass


class _UnavailableMCPTools:
    """Fail-closed operational adapter when the MCP endpoint is not configured."""

    def incident(self, _payload: TicketInput, *, token: str | None = None) -> TicketResult:
        return TicketResult(outcome="unavailable")

    def inventory(self, _payload: InventoryInput, *, token: str | None = None) -> InventoryResult:
        return InventoryResult(outcome="unavailable")


def after_question(state: AgentState) -> str:
    return END if state.error or state.answer else "route_question"


def after_memory_decision(state: AgentState) -> str:
    return "route_question"


def after_routing(state: AgentState) -> str:
    if state.routing_failed:
        return "routing_fallback"
    if state.decision.source == "rag":
        return "retrieve_context"
    if state.decision.uses_incidents:
        return "lookup_incident" if state.decision.ticket_id else "clarify_ticket"
    return "lookup_inventory" if state.decision.inventory_query else "clarify_inventory"


def after_incident(state: AgentState) -> str:
    if state.ticket_result.outcome != "found":
        return "tool_fallback"
    if state.decision.uses_inventory:
        return after_tool_fallback(state)
    return "retrieve_context" if state.decision.uses_rag else "ticket_response"


def after_tool_fallback(state: AgentState) -> str:
    if state.decision.uses_inventory:
        return "lookup_inventory" if state.decision.inventory_query else "clarify_inventory"
    return "retrieve_context" if state.decision.uses_rag else END


def after_inventory(state: AgentState) -> str:
    if state.inventory_result.outcome != "found":
        return "inventory_fallback"
    return "retrieve_context" if state.decision.uses_rag else "inventory_response"


def after_inventory_fallback(state: AgentState) -> str:
    return "retrieve_context" if state.decision.uses_rag else END


def after_retrieval(state: AgentState) -> str:
    return "generate_response" if state.context else "no_information"


def ticket_answer(state: AgentState) -> str:
    result = state.ticket_result
    ticket_id = state.decision.ticket_id
    if result.outcome == "found":
        incident = result.incident
        return (f"Ticket {incident.id}: {incident.title}. Estado: {incident.status}. "
                f"Categoria: {incident.category}. Origen: {incident.origin}. Sede: {incident.branch}. "
                f"Creado: {incident.created_at}. Ultima actualizacion: {incident.updated_at}.")
    if result.outcome == "not_found":
        return f"No se encontro el ticket {ticket_id} en el gestor de incidentes."
    if result.outcome == "unauthorized":
        return f"No pude confirmar el estado del ticket {ticket_id}: se requiere una sesion valida con acceso a incidentes."
    return f"No pude confirmar el estado del ticket {ticket_id} ahora mismo. Intentalo mas tarde."


def inventory_answer(state: AgentState) -> str:
    result = state.inventory_result
    if result.outcome == "found":
        product = result.products[0]
        return (f"Producto {product.id}: {product.name}. SKU: {product.sku_code}. "
                f"Almacen: {product.warehouse}. Stock informado: {product.current_stock} unidades. "
                f"Categoria: {product.category}. Cliente: {product.client_name}.")
    if result.outcome == "ambiguous":
        candidates = "; ".join(f"{product.sku_code} (ID {product.id}, {product.warehouse})" for product in result.products)
        return f"Hay varios productos coincidentes: {candidates}. Indica un ID o SKU y, si procede, el almacen; no he confirmado un stock unico."
    if result.outcome == "not_found":
        return "No se encontro un producto que coincida con la consulta en el gestor de inventario."
    if result.outcome == "unauthorized":
        return "No pude confirmar el stock: se requiere una sesion valida con acceso al inventario."
    return "No pude confirmar el stock ahora mismo. Intentalo mas tarde."


def operations_answer(state: AgentState) -> str:
    parts = []
    if state.ticket_result is not None:
        parts.append(ticket_answer(state))
    if state.inventory_result is not None:
        parts.append(inventory_answer(state))
    return "\n\n".join(parts)


def combine_answer(state: AgentState, knowledge_answer: str) -> str:
    operational = operations_answer(state)
    if operational:
        return f"{operational}\n\nDocumentacion: {knowledge_answer}"
    return knowledge_answer


def knowledge_question(state: AgentState) -> str:
    return state.decision.knowledge_question if state.decision else state.question


def compile_graph(builder: StateGraph, checkpointer=None, *, interrupt_after=None):
    if builder.state_schema is not AgentState:
        raise GraphStructureError("The graph must use the validated AgentState schema.")
    links = set(builder.edges)
    for source, branches in builder.branches.items():
        for branch in branches.values():
            if branch.ends is None:
                raise GraphStructureError("Conditional edges require explicit destinations.")
            links.update((source, target) for target in branch.ends.values())

    def reachable(origin: str, reverse: bool = False) -> set[str]:
        visited = {origin}
        pending = [origin]
        while pending:
            current = pending.pop()
            for source, target in links:
                parent, child = (target, source) if reverse else (source, target)
                if parent == current and child not in visited:
                    visited.add(child)
                    pending.append(child)
        return visited

    disconnected = set(builder.nodes) - (reachable(START) & reachable(END, reverse=True))
    if disconnected or END not in reachable(START):
        raise GraphStructureError(f"Nodes must be reachable from START and lead to END: {sorted(disconnected)}")
    try:
        return builder.compile(checkpointer=checkpointer, interrupt_after=interrupt_after)
    except (ValueError, TypeError) as exc:
        raise GraphStructureError("Invalid support agent graph structure.") from exc


def build_graph(
    checkpointer=None,
    *,
    retrieve_fn: Callable | None = None,
    generate_fn: Callable | None = None,
    route_fn: Callable | None = None,
    incident_fn: Callable | None = None,
    inventory_fn: Callable | None = None,
    token_provider: Callable | None = None,
    memory_store: MemoryStore | None = None,
    memory_classifier: Callable | None = None,
    memory_evaluator: Callable | None = None,
    mcp_server_url: str | None = None,
    instrument: Callable | None = None,
    interrupt_after: list[str] | None = None,
):
    retrieve = retrieve_fn or rag.retrieve
    generate = generate_fn or rag.generate_answer
    route = route_fn or routing.decide_route
    if incident_fn is None and inventory_fn is None:
        mcp_tools = (
            MCPTrackFlowTools(mcp_server_url, token_provider=token_provider or (lambda: None))
            if mcp_server_url else _UnavailableMCPTools()
        )
        incidents = mcp_tools
        inventory = mcp_tools
        using_mcp = True
    else:
        incidents = incident_fn or IncidentTool()
        inventory = inventory_fn or InventoryTool()
        using_mcp = False
    credentials = token_provider or (lambda: None)
    decide_memory = memory_classifier or classify_pending_decision

    def prepare_memory(state: AgentState) -> dict:
        if not memory_store or not state.actor_id or not state.conversation_id:
            return {"memory_context": []}
        pending = memory_store.pending(state.actor_id, state.conversation_id)
        result = None
        if pending:
            proposal = MemoryProposal.model_validate_json(pending["proposal_json"])
            try:
                decision = MemoryDecision.model_validate(decide_memory(proposal, state.question))
            except Exception:
                decision = MemoryDecision(decision="unclear", confidence=0)
            result = memory_store.resolve(state.actor_id, state.conversation_id, decision, state.question)
        memories = memory_store.relevant(state.actor_id, state.question)
        return {"pending_decision": {"result": result} if result else None,
                "memory_result": result, "memory_context": memories}

    def receive_question(state: AgentState) -> dict:
        question = state.question.strip()
        decision = inspect_input(question)
        events = []
        if decision.action != "allow":
            event = {"guardrail": decision.guardrail or "input_policy",
                     "failure_type": decision.failure_type or "content",
                     "action": decision.action}
            events.append(event)
            logger.warning("support_agent_guardrail guardrail=%s failure_type=%s action=%s",
                           event["guardrail"], event["failure_type"], event["action"])
        return {
            "question": question, "context": [],
            "error": None if question else "La pregunta no puede estar vacia.",
            "decision": None, "routing_failed": False, "ticket_result": None,
            "knowledge_failed": False, "inventory_result": None,
            "actor_id": state.actor_id, "conversation_id": state.conversation_id,
            "memory_context": [], "memory_proposal": None, "pending_decision": None,
            "memory_result": None, "guardrail_events": events,
            "answer": decision.answer if question and decision.action != "allow" else None,
        }

    def route_question(state: AgentState) -> dict:
        try:
            decision = routing.validate_decision(route(state.question), state.question)
            return {"decision": decision.model_dump()}
        except Exception:
            return {"routing_failed": True}

    def lookup_incident(state: AgentState) -> dict:
        try:
            ticket_input = TicketInput(ticket_id=state.decision.ticket_id)
            if using_mcp:
                raw_result = incidents.incident(ticket_input, token=credentials())
            else:
                raw_result = incidents(ticket_input, token=credentials())
            result = TicketResult.model_validate(raw_result)
            if result.incident and result.incident.id != state.decision.ticket_id:
                result = TicketResult(outcome="invalid_response")
        except TimeoutError:
            result = TicketResult(outcome="timeout")
        except Exception:
            result = TicketResult(outcome="unavailable")
        return {"ticket_result": result.model_dump()}

    def lookup_inventory(state: AgentState) -> dict:
        try:
            query = state.decision.inventory_query
            if using_mcp:
                result = InventoryResult.model_validate(inventory.inventory(query, token=credentials()))
            else:
                # The unified MCP inventory tools query by ID or list filters;
                # keep legacy tool compatibility for SKU/name lookup.
                result = InventoryResult.model_validate(inventory(query, token=credentials()))
            query = state.decision.inventory_query
            for product in result.products:
                if ((query.product_id and product.id != query.product_id)
                        or (query.sku_code and product.sku_code.casefold() != query.sku_code.casefold())
                        or (query.product_name and query.product_name.casefold() not in product.name.casefold())
                        or (query.warehouse and product.warehouse != query.warehouse)
                        or (query.category and product.category != query.category)):
                    result = InventoryResult(outcome="invalid_response")
                    break
        except TimeoutError:
            result = InventoryResult(outcome="timeout")
        except Exception:
            result = InventoryResult(outcome="unavailable")
        return {"inventory_result": result.model_dump()}

    def retrieve_context(state: AgentState) -> dict:
        try:
            return {"context": retrieve(knowledge_question(state))}
        except Exception:
            if state.decision is None or not (state.decision.uses_incidents or state.decision.uses_inventory):
                raise
            return {"context": [], "knowledge_failed": True}

    def generate_response(state: AgentState) -> dict:
        try:
            if memory_store and state.actor_id and state.conversation_id and generate_fn is None:
                answer = generate_structured_response(
                    knowledge_question(state), state.context, state.memory_context,
                    evaluator=memory_evaluator,
                )
            else:
                answer = generate(knowledge_question(state), state.context)
        except TypeError as exc:
            # Preserve injected legacy doubles; production generator is the same RAG model.
            if "unexpected keyword" not in str(exc):
                raise
            answer = generate(knowledge_question(state), state.context)
        except Exception:
            if state.decision is None or not (state.decision.uses_incidents or state.decision.uses_inventory):
                raise
            return {"answer": combine_answer(state, "No pude consultar la documentacion ahora mismo."),
                    "knowledge_failed": True}
        answer_text, proposal = answer if isinstance(answer, tuple) and len(answer) == 2 else (answer, None)
        proposal_dump = None
        if proposal and memory_store and state.actor_id and state.conversation_id:
            try:
                proposal = validate_memorizable(MemoryProposal.model_validate(proposal))
                memory_store.propose(state.actor_id, state.conversation_id, proposal, state.question)
                proposal_dump = proposal.model_dump()
                answer_text = f"{answer_text}\n\n¿Quieres que recuerde esto para la próxima vez? {proposal.content}"
            except (ValueError, TypeError, ValidationError):
                proposal_dump = None
        return {"answer": combine_answer(state, answer_text), "memory_proposal": proposal_dump}

    def no_information(state: AgentState) -> dict:
        answer = ("No pude consultar la documentacion ahora mismo." if state.knowledge_failed
                  else rag.generate_answer(knowledge_question(state), []))
        return {"answer": combine_answer(state, answer)}

    def operational_response(state: AgentState) -> dict:
        return {"answer": operations_answer(state)}

    def clarify_ticket(state: AgentState) -> dict:
        return {"answer": "Indica el ID del ticket que quieres consultar. Solo puedo consultar tickets, no modificarlos."}

    def clarify_inventory(state: AgentState) -> dict:
        clarification = "Indica el ID, SKU o nombre del producto que quieres consultar. Solo puedo consultar inventario, no modificar existencias."
        operational = operations_answer(state)
        return {"answer": f"{operational}\n\n{clarification}" if operational else clarification}

    def protect_output(node):
        def protected(state: AgentState) -> dict:
            output = node(state)
            if output.get("answer") is None:
                return output
            answer, failure_type, guardrail = validate_output(output["answer"])
            output["answer"] = answer
            if failure_type:
                event = {"guardrail": guardrail or "output_validation",
                         "failure_type": failure_type, "action": "block"}
                output["guardrail_events"] = [*state.guardrail_events, event]
                logger.warning(
                    "support_agent_guardrail guardrail=%s failure_type=%s action=block",
                    event["guardrail"], event["failure_type"],
                )
            return output
        return protected

    def routing_fallback(state: AgentState) -> dict:
        return {"answer": "No pude determinar que fuente consultar ahora mismo. Intentalo de nuevo; no he confirmado datos operativos."}

    builder = StateGraph(AgentState)
    for name, node in {
        "receive_question": receive_question,
        "prepare_memory": prepare_memory,
        "route_question": route_question,
        "lookup_incident": lookup_incident,
        "ticket_response": operational_response,
        "tool_fallback": operational_response,
        "clarify_ticket": clarify_ticket,
        "routing_fallback": routing_fallback,
        "lookup_inventory": lookup_inventory,
        "inventory_response": operational_response,
        "inventory_fallback": operational_response,
        "clarify_inventory": clarify_inventory,
        "retrieve_context": retrieve_context,
        "generate_response": generate_response,
        "no_information": no_information,
    }.items():
        guarded_node = protect_output(node)
        builder.add_node(name, instrument(name, guarded_node) if instrument else guarded_node)
    builder.add_edge(START, "receive_question")
    builder.add_conditional_edges("receive_question", after_question, {
        END: END, "route_question": "prepare_memory",
    })
    builder.add_edge("prepare_memory", "route_question")
    builder.add_conditional_edges("route_question", after_routing, {
        name: name for name in ["routing_fallback", "retrieve_context", "lookup_incident", "clarify_ticket", "lookup_inventory", "clarify_inventory"]
    })
    builder.add_conditional_edges("lookup_incident", after_incident, {
        name: name for name in ["tool_fallback", "retrieve_context", "ticket_response", "lookup_inventory", "clarify_inventory"]
    })
    builder.add_conditional_edges("tool_fallback", after_tool_fallback, {
        END: END, "retrieve_context": "retrieve_context",
        "lookup_inventory": "lookup_inventory", "clarify_inventory": "clarify_inventory",
    })
    builder.add_conditional_edges("lookup_inventory", after_inventory, {
        name: name for name in ["inventory_fallback", "retrieve_context", "inventory_response"]
    })
    builder.add_conditional_edges("inventory_fallback", after_inventory_fallback, {
        END: END, "retrieve_context": "retrieve_context",
    })
    builder.add_conditional_edges("retrieve_context", after_retrieval, {
        "generate_response": "generate_response", "no_information": "no_information",
    })
    builder.add_edge("generate_response", END)
    builder.add_edge("no_information", END)
    for name in ["ticket_response", "clarify_ticket", "routing_fallback", "inventory_response", "clarify_inventory"]:
        builder.add_edge(name, END)
    return compile_graph(builder, checkpointer, interrupt_after=interrupt_after)