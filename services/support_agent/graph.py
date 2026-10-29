"""Explicit RAG orchestration, without duplicating retrieval or generation."""

from collections.abc import Callable
from typing import Any

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, ConfigDict, Field

from data.pipelines import rag


class AgentState(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    question: str
    context: list[dict[str, Any]] = Field(default_factory=list)
    answer: str | None = None
    error: str | None = None


class GraphStructureError(ValueError):
    pass


def after_question(state: AgentState) -> str:
    return END if state.error else "retrieve_context"


def after_retrieval(state: AgentState) -> str:
    return "generate_response" if state.context else "no_information"


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
    instrument: Callable | None = None,
    interrupt_after: list[str] | None = None,
):
    retrieve = retrieve_fn or rag.retrieve
    generate = generate_fn or rag.generate_answer

    def receive_question(state: AgentState) -> dict:
        question = state.question.strip()
        return {
            "question": question, "context": [], "answer": None,
            "error": None if question else "La pregunta no puede estar vacia.",
        }

    def retrieve_context(state: AgentState) -> dict:
        return {"context": retrieve(state.question)}

    def generate_response(state: AgentState) -> dict:
        return {"answer": generate(state.question, state.context)}

    def no_information(state: AgentState) -> dict:
        return {"answer": rag.generate_answer(state.question, [])}

    builder = StateGraph(AgentState)
    for name, node in {
        "receive_question": receive_question,
        "retrieve_context": retrieve_context,
        "generate_response": generate_response,
        "no_information": no_information,
    }.items():
        builder.add_node(name, instrument(name, node) if instrument else node)
    builder.add_edge(START, "receive_question")
    builder.add_conditional_edges("receive_question", after_question, {
        END: END, "retrieve_context": "retrieve_context",
    })
    builder.add_conditional_edges("retrieve_context", after_retrieval, {
        "generate_response": "generate_response", "no_information": "no_information",
    })
    builder.add_edge("generate_response", END)
    builder.add_edge("no_information", END)
    return compile_graph(builder, checkpointer, interrupt_after=interrupt_after)