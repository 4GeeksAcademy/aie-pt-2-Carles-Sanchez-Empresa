"""Persistent execution, checkpoints and queryable, sanitized traces."""

import hashlib
import json
import sqlite3
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

import httpx
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END
from openai import APIError
from qdrant_client.http.exceptions import ResponseHandlingException, UnexpectedResponse

from .graph import (
    AgentState, after_question, after_retrieval, after_routing,
    after_incident, after_tool_fallback, build_graph,
    after_inventory, after_inventory_fallback,
)


class AgentRunError(Exception):
    def __init__(self, run_id: str, message: str, status_code: int):
        super().__init__(message)
        self.run_id = run_id
        self.status_code = status_code


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def validate_id(value: str) -> str:
    return str(UUID(value))


class TraceStore:
    def __init__(self, path: Path):
        self.path = path
        with sqlite3.connect(path, timeout=30) as connection:
            connection.execute("CREATE TABLE IF NOT EXISTS traces (run_id TEXT PRIMARY KEY, document TEXT NOT NULL)")

    def put(self, trace: dict) -> None:
        with sqlite3.connect(self.path, timeout=30) as connection:
            connection.execute(
                "INSERT OR REPLACE INTO traces VALUES (?, ?)",
                (trace["run_id"], json.dumps(trace, ensure_ascii=True, allow_nan=False)),
            )

    def get(self, run_id: str) -> dict:
        with sqlite3.connect(self.path, timeout=30) as connection:
            row = connection.execute("SELECT document FROM traces WHERE run_id = ?", (validate_id(run_id),)).fetchone()
        if row is None:
            raise KeyError(run_id)
        return json.loads(row[0])


class AgentRuntime:
    def __init__(
        self, state_dir: Path, *, retrieve_fn=None, generate_fn=None,
        route_fn=None, incident_fn=None, inventory_fn=None, mcp_server_url: str | None = None,
        interrupt_after=None, capture_kind: str = "live",
    ):
        state_dir = Path(state_dir)
        state_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.traces = TraceStore(state_dir / "traces.sqlite3")
        self.connection = sqlite3.connect(state_dir / "checkpoints.sqlite3", check_same_thread=False)
        self.checkpointer = SqliteSaver(self.connection)
        self.lock = threading.RLock()
        self._token = None
        self.capture_kind = "simulated" if any((retrieve_fn, generate_fn, route_fn, incident_fn, inventory_fn)) else capture_kind
        try:
            self.metadata = self._metadata()
            self.graph = build_graph(
                self.checkpointer, retrieve_fn=retrieve_fn, generate_fn=generate_fn,
                route_fn=route_fn, incident_fn=incident_fn, inventory_fn=inventory_fn,
                mcp_server_url=mcp_server_url,
                token_provider=lambda: self._token,
                instrument=self._instrument, interrupt_after=interrupt_after,
            )
        except Exception:
            self.connection.close()
            raise

    def _metadata(self) -> dict:
        from data.pipelines import rag

        root = Path(rag.__file__).resolve().parents[2]
        sources = root / "docs" / "company-knowledge-base"
        return {
            "graph_sha256": hashlib.sha256(Path(__file__).with_name("graph.py").read_bytes()).hexdigest(),
            "routing_sha256": hashlib.sha256(Path(__file__).with_name("routing.py").read_bytes()).hexdigest(),
            "tools_sha256": hashlib.sha256(Path(__file__).with_name("tools.py").read_bytes()).hexdigest(),
            "rag_sha256": hashlib.sha256(Path(rag.__file__).read_bytes()).hexdigest(),
            "corpus_sha256": {
                path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                for path in sorted(sources.glob("*.md"))
            },
            "generation_model": rag.GENERATION_MODEL,
            "top_k": rag.DEFAULT_TOP_K, "min_score": rag.DEFAULT_MIN_SCORE,
            "capture_kind": self.capture_kind,
        }

    def _instrument(self, name, node):
        def recorded(state: AgentState, config: RunnableConfig):
            run_id = config["configurable"]["trace_run_id"]
            trace = self.traces.get(run_id)
            event = {
                "sequence": len(trace["events"]) + 1, "node": name,
                "started_at": timestamp(), "input": state.model_dump(),
                "status": "running", "output": None, "next": None, "reason": None,
            }
            trace["events"].append(event)
            if name in {"retrieve_context", "lookup_incident", "lookup_inventory"}:
                event["source"] = {"retrieve_context": "rag", "lookup_incident": "incidents", "lookup_inventory": "inventory"}[name]
                trace["sources"].append(event["source"])
            self.traces.put(trace)
            start = time.perf_counter()
            try:
                output = node(state)
                updated = AgentState.model_validate({**state.model_dump(), **output})
                if name == "receive_question":
                    target = after_question(updated)
                    reason = "empty_question" if updated.error else "valid_question"
                elif name == "retrieve_context":
                    target = after_retrieval(updated)
                    reason = "knowledge_unavailable" if updated.knowledge_failed else ("context_available" if updated.context else "empty_context")
                elif name == "route_question":
                    target = after_routing(updated)
                    reason = "routing_failed" if updated.routing_failed else updated.decision.source
                elif name == "lookup_incident":
                    target, reason = after_incident(updated), updated.ticket_result.outcome
                elif name == "tool_fallback":
                    target, reason = after_tool_fallback(updated), updated.ticket_result.outcome
                elif name == "lookup_inventory":
                    target, reason = after_inventory(updated), updated.inventory_result.outcome
                elif name == "inventory_fallback":
                    target, reason = after_inventory_fallback(updated), updated.inventory_result.outcome
                else:
                    target, reason = END, "response_ready"
                event.update(status="completed", output=output, next=target, reason=reason)
                return output
            except Exception:
                event.update(status="failed", error={"code": "node_failed"})
                raise
            finally:
                event.update(finished_at=timestamp(), duration_ms=round((time.perf_counter() - start) * 1000, 3))
                self.traces.put(trace)

        return recorded

    def run(self, question: str, *, token: str | None = None) -> dict:
        return self._execute({"question": question}, str(uuid4()), token=token)

    def resume(self, thread_id: str, *, token: str | None = None) -> dict:
        thread_id = validate_id(thread_id)
        with self.lock:
            snapshot = self.graph.get_state({"configurable": {"thread_id": thread_id}})
            if not snapshot.values or not snapshot.next:
                raise ValueError("No pending checkpoint exists for this thread.")
            return self._execute(None, thread_id, token=token)

    def _execute(self, inputs: dict | None, thread_id: str, *, token: str | None = None) -> dict:
        with self.lock:
            run_id = str(uuid4())
            config = {"configurable": {"thread_id": thread_id, "trace_run_id": run_id}}
            previous = self.graph.get_state(config) if inputs is None else None
            question = inputs["question"] if inputs is not None else previous.values["question"]
            trace = {
                "schema_version": 1, "run_id": run_id, "thread_id": thread_id,
                "started_at": timestamp(), "status": "running", "question": question,
                "resumed": inputs is None, "events": [], "sources": [], "answer": None, "error": None,
                "metadata": self.metadata,
            }
            self.traces.put(trace)
            self._token = token
            try:
                result = AgentState.model_validate(self.graph.invoke(inputs, config))
                pending = self.graph.get_state(config).next
                trace = self.traces.get(run_id)
                trace.update(
                    status="paused" if pending else ("rejected" if result.error else "completed"),
                    answer=result.answer, error=result.error, finished_at=timestamp(),
                )
                self.traces.put(trace)
                return {**result.model_dump(), "run_id": run_id, "thread_id": thread_id, "status": trace["status"]}
            except Exception as exc:
                unavailable = isinstance(exc, (
                    ConnectionError, TimeoutError, APIError, httpx.HTTPError,
                    ResponseHandlingException, UnexpectedResponse,
                ))
                message = "Servicio de conocimiento no disponible temporalmente." if unavailable else "Error interno al procesar la consulta."
                trace = self.traces.get(run_id)
                trace.update(status="failed", error={"code": "dependency_unavailable" if unavailable else "internal_error"}, finished_at=timestamp())
                self.traces.put(trace)
                raise AgentRunError(run_id, message, 503 if unavailable else 500) from exc
            finally:
                self._token = None

    def history(self, thread_id: str) -> list:
        with self.lock:
            return list(self.graph.get_state_history({"configurable": {"thread_id": validate_id(thread_id)}}))

    def close(self) -> None:
        with self.lock:
            self.connection.close()