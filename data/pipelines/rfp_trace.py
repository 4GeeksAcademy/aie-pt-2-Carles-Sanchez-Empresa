"""Durable, size-bounded execution traces shared by RFP pipeline parts."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session

try:
    from models import RfpNodeTrace
except ImportError:  # pragma: no cover - compatibility for minimal test modules
    RfpNodeTrace = None

_MAX_STRING = 4000
_MAX_ITEMS = 100


def _safe(value: Any, depth: int = 0) -> Any:
    """Keep trace payloads JSON-safe and bounded; avoid storing entire PDFs."""
    if depth >= 5:
        return repr(value)[:_MAX_STRING]
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, str):
        return value[:_MAX_STRING]
    if isinstance(value, dict):
        return {str(key)[:120]: _safe(item, depth + 1) for key, item in list(value.items())[:_MAX_ITEMS]}
    if isinstance(value, (list, tuple, set)):
        return [_safe(item, depth + 1) for item in list(value)[:_MAX_ITEMS]]
    if hasattr(value, "model_dump"):
        return _safe(value.model_dump(mode="json"), depth + 1)
    if hasattr(value, "__dict__"):
        return _safe(vars(value), depth + 1)
    return repr(value)[:_MAX_STRING]


def record_node(db_engine, ticket_id: str, node_name: str, agent_name: str,
                input_payload: Any, output_payload: Any, department_id: str | None = None) -> None:
    if RfpNodeTrace is None:
        return
    with Session(db_engine) as session:
        session.add(RfpNodeTrace(
            ticket_id=ticket_id,
            department_id=department_id,
            node_name=node_name,
            agent_name=agent_name,
            input_payload=_safe(input_payload),
            output_payload=_safe(output_payload),
            created_at=datetime.now(timezone.utc),
        ))
        session.commit()
