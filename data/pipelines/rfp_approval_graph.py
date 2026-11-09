"""Durable LangGraph interrupt/resume primitive for one RFP department gate.

The SQL rows remain the business source of truth. LangGraph checkpoints capture
execution state by ticket/department/approval iteration so each branch can pause
and resume independently. Configure RFP_CHECKPOINT_DB to a persistent shared
volume in deployments; the default is a local SQLite file for development.
"""
from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path
from typing import TypedDict

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt


class ApprovalState(TypedDict, total=False):
    ticket_id: str
    department_id: str
    approval_iteration: int
    draft: str
    decision: dict
    checkpoint: dict


def _interrupt(state: ApprovalState) -> dict:
    payload = {
        "ticket_id": state["ticket_id"],
        "department_id": state["department_id"],
        "approval_iteration": state["approval_iteration"],
        "draft": state.get("draft", ""),
    }
    decision = interrupt(payload)
    return {"decision": decision}


def _record_decision(state: ApprovalState) -> dict:
    return {"checkpoint": {
        "ticket_id": state["ticket_id"],
        "department_id": state["department_id"],
        "approval_iteration": state["approval_iteration"],
        "decision": state["decision"],
    }}


def _build_graph(checkpointer):
    graph = StateGraph(ApprovalState)
    graph.add_node("approval_interrupt", _interrupt)
    graph.add_node("resume_department", _record_decision)
    graph.add_edge(START, "approval_interrupt")
    graph.add_edge("approval_interrupt", "resume_department")
    graph.add_edge("resume_department", END)
    return graph.compile(checkpointer=checkpointer)


@contextmanager
def approval_graph():
    path = Path(os.getenv("RFP_CHECKPOINT_DB", "data/rfp_approval_checkpoints.sqlite"))
    path.parent.mkdir(parents=True, exist_ok=True)
    with SqliteSaver.from_conn_string(str(path)) as saver:
        saver.setup()
        yield _build_graph(saver)


def thread_config(ticket_id: str, department_id: str, approval_iteration: int) -> dict:
    """A checkpoint key cannot collide across tickets, branches, or retries."""
    return {"configurable": {
        "thread_id": f"rfp-{ticket_id}:{department_id}:approval-{approval_iteration}",
    }}


def pause_for_approval(*, ticket_id: str, department_id: str, approval_iteration: int,
                       draft: str, config: dict | None = None) -> tuple[dict, dict]:
    config = config or thread_config(ticket_id, department_id, approval_iteration)
    with approval_graph() as graph:
        graph.invoke({
            "ticket_id": ticket_id,
            "department_id": department_id,
            "approval_iteration": approval_iteration,
            "draft": draft,
        }, config=config)
        checkpoint = graph.get_state(config)
    return {"interrupts": [item.value for item in checkpoint.tasks[0].interrupts]}, checkpoint.values


def resume_department(*, ticket_id: str, department_id: str, approval_iteration: int,
                      decision: dict, config: dict | None = None) -> dict:
    config = config or thread_config(ticket_id, department_id, approval_iteration)
    with approval_graph() as graph:
        state = graph.invoke(Command(resume=decision), config=config)
    return state.get("checkpoint", {})
