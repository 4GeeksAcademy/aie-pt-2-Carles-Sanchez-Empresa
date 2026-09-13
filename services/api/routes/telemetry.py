"""
routes/telemetry.py — Endpoint real de telemetría (TrackFlow).

Fase 3 — Persistencia en Supabase con bulk insert.

Endpoint: POST /telemetry/events
Body: { "events": [ ... ] }  (lista de dicts crudos, no tipada)
Response 200: { "received": N, "stored": M, "rejected": R }

Validación parcial: cada evento se valida individualmente con
TelemetryEvent.model_validate(). Los inválidos se rechazan pero
el resto del lote se persiste igual (aceptación parcial).
"""

import logging

from fastapi import APIRouter, Request
from pydantic import ValidationError
from sqlmodel import Session

from database import engine
from models import TelemetryEventRecord
from pydantic_models import TelemetryEvent
from telemetry_schemas import filter_properties, get_event_category

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


# ──────────────────────────── Deduplicación (web_vital_measured) ────────────────────────

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


# ──────────────────────────── Endpoint real ────────────────────────

@router.post("/events")
async def receive_telemetry_events(request: Request):
    """
    Endpoint real de telemetría — Fase 3.
    
    1. Acepta envelope laxo { "events": [...] }
    2. Valida cada evento contra TelemetryEvent (parseo por evento)
    3. Filtra properties contra allowlist
    4. Deduplica web_vital_measured
    5. Persiste válidos en bulk insert (una transacción)
    6. Devuelve HTTP 200 con conteo received/stored/rejected
    """
    # ── 1. Parsear envelope ──
    try:
        body = await request.json()
    except Exception:
        return _error_response("Invalid JSON body", 400)
    
    if not isinstance(body, dict) or "events" not in body:
        return _error_response("Body must be { \"events\": [...] }", 400)
    
    raw_events = body["events"]
    if not isinstance(raw_events, list):
        return _error_response("\"events\" must be an array", 400)
    
    received = len(raw_events)
    
    # ── 2. Validar y filtrar evento por evento ──
    valid_records = []
    rejected = 0
    seen_vitals: set[str] = set()
    
    for raw in raw_events:
        # 2a. Validar contra Pydantic TelemetryEvent
        try:
            event = TelemetryEvent.model_validate(raw)
        except ValidationError:
            rejected += 1
            continue
        
        # 2b. Deduplicar web_vital_measured
        dedup = _dedup_key(event.event_type, event.properties or {})
        if dedup is not None:
            if dedup in seen_vitals:
                rejected += 1
                continue
            seen_vitals.add(dedup)
        
        # 2c. Obtener categoría (service) del event_type
        category = get_event_category(event.event_type)
        if category is None:
            # event_type desconocido — no está en nuestro catálogo
            logger.warning("Unknown event_type rejected: %s", event.event_type)
            rejected += 1
            continue
        
        # 2d. Filtrar properties contra allowlist
        filtered_props = filter_properties(event.event_type, event.properties or {})
        if filtered_props is None:
            # Faltan required keys o event_type desconocido
            logger.warning(
                "Event rejected (missing required properties): type=%s props=%s",
                event.event_type,
                list((event.properties or {}).keys()),
            )
            rejected += 1
            continue
        
        # 2e. Crear registro para persistencia
        record = TelemetryEventRecord(
            event_id=event.eventId,
            timestamp=event.timestamp,
            event_type=event.event_type,
            session_id=event.sessionId,
            user_id=event.userId,
            service=category,
            tags=filtered_props,
        )
        valid_records.append(record)
    
    # ── 3. Persistir en bulk (una transacción) ──
    stored = 0
    if valid_records:
        try:
            with Session(engine) as session:
                session.add_all(valid_records)
                session.commit()
                stored = len(valid_records)
                logger.info(
                    "Telemetry bulk insert: %d stored (%d received, %d rejected)",
                    stored, received, rejected,
                )
        except Exception:
            logger.exception("Error in telemetry bulk insert")
            # No retornar 500 — los eventos se procesaron parcialmente
            # Retornar 200 con stored=0 si falla la DB
    
    # ── 4. Responder ──
    return {
        "received": received,
        "stored": stored,
        "rejected": rejected,
    }


def _error_response(detail: str, status_code: int) -> dict:
    """Helper para respuestas de error (el frontend solo mira status code)."""
    # El frontend no lee el body en errores — solo verifica res.ok
    # Retornamos el dict con status_code para que FastAPI lo use
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=status_code, content={"detail": detail})