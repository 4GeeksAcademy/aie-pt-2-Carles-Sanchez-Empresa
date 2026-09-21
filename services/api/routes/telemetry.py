"""
routes/telemetry.py — Endpoint stub de telemetría (TrackFlow).

Fase 2 — Solo validación de formato, sin persistencia.
Fase 3 — Se reemplazará por la implementación real con Supabase.

Endpoint: POST /telemetry/events
Body: { "events": [ TelemetryEvent, ... ] }
Response 200: { "received": N, "deduplicated": D }
"""

import logging
from typing import Any

from fastapi import APIRouter

from pydantic_models import TelemetryBatchRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


def _dedup_key(event_type: str, props: dict) -> str | None:
    """
    Genera una clave de deduplicación para eventos web_vital_measured.
    Dos eventos con la misma clave se consideran duplicados.
    """
    if event_type != "web_vital_measured":
        return None
    metric_name = props.get("metric_name", "")
    metric_id = props.get("metric_id", "")
    page = props.get("page", "")
    return f"{metric_name}:{metric_id}:{page}"


@router.post("/events")
async def receive_telemetry_events(payload: TelemetryBatchRequest):
    """
    Endpoint stub de telemetría.

    Recibe un lote de eventos, valida la estructura del envelope,
    deduplica web_vital_measured (mismo metric_name + metric_id + page),
    registra en log los event_type recibidos y responde 200.
    """
    events = payload.events
    count = len(events)

    # Deduplicar web_vital_measured: quedarse con el primero de cada metric_id
    seen_vitals: set[str] = set()
    deduplicated = 0
    unique_events = []

    for event in events:
        key = _dedup_key(event.event_type, event.properties or {})
        if key is not None:
            if key in seen_vitals:
                deduplicated += 1
                continue
            seen_vitals.add(key)
        unique_events.append(event)

    event_types = [e.event_type for e in unique_events]
    logger.info(
        "Telemetry batch received: %d events (%d deduplicated) | types: %s",
        len(unique_events),
        deduplicated,
        event_types,
    )

    # Validación básica por ahora — solo registrar anomalías
    for i, event in enumerate(unique_events):
        issues = []
        if not event.eventId:
            issues.append("missing eventId")
        if not event.event_type:
            issues.append("missing event_type")
        if not event.timestamp:
            issues.append("missing timestamp")
        if not event.sessionId:
            issues.append("missing sessionId")
        if event.properties is None:
            issues.append("missing properties")

        if issues:
            logger.warning("Event #%d (%s) has issues: %s", i, event.event_type, "; ".join(issues))

    return {"received": len(unique_events), "deduplicated": deduplicated}