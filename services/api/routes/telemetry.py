"""
routes/telemetry.py — Endpoint stub de telemetría (TrackFlow).

Fase 2 — Solo validación de formato, sin persistencia.
Fase 3 — Se reemplazará por la implementación real con Supabase.

Endpoint: POST /telemetry/events
Body: { "events": [ TelemetryEvent, ... ] }
Response 200: { "received": N }
"""

import logging
from typing import Any

from fastapi import APIRouter

from pydantic_models import TelemetryBatchRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post("/events")
async def receive_telemetry_events(payload: TelemetryBatchRequest):
    """
    Endpoint stub de telemetría.

    Recibe un lote de eventos, valida la estructura básica del envelope,
    registra en log los event_type recibidos y responde 200.

    ⚠️ Temporal — no persiste nada. En Fase 3 se reemplazará por la
    implementación real con validación completa y almacenamiento en Supabase.
    """
    events = payload.events
    count = len(events)

    # Log de los event_type recibidos para depuración
    event_types = [e.event_type for e in events]
    logger.info(
        "Telemetry batch received: %d events | types: %s",
        count,
        event_types,
    )

    # Validación básica por ahora — solo registrar anomalías
    for i, event in enumerate(events):
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

    return {"received": count}