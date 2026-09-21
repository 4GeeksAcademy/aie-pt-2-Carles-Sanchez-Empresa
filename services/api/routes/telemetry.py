"""
routes/telemetry.py — Endpoints de telemetría (TrackFlow).

Fase 3 — Persistencia en Supabase con bulk insert.
Fase 4 — Reporte técnico con cache.

Endpoints:
  - POST /telemetry/events — Recibe y almacena eventos
  - GET  /telemetry/report — Sirve métricas operacionales con cache
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from cachetools import TTLCache
from fastapi import APIRouter, Query, Request
from pydantic import ValidationError
from sqlmodel import Session

from database import engine
from models import TelemetryEventRecord
from pydantic_models import TelemetryEvent
from telemetry.analysis import (
    api_latency_stats,
    auth_failure_rate,
    error_events_by_type,
    events_per_day,
)
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


# ──────────────────────────── Cache para reporte ────────────────────────

# Cache con TTL de 60 segundos — thread-safe por defecto
_report_cache: TTLCache = TTLCache(maxsize=128, ttl=60)


def _get_cache_key(start_date: str, end_date: str) -> tuple[str, str]:
    """Genera una clave de cache para el reporte."""
    return (start_date, end_date)


# ──────────────────────────── Endpoint: Reporte ────────────────────────

@router.get("/report")
async def get_telemetry_report(
    start_date: Optional[str] = Query(None, description="Fecha inicio ISO 8601 (UTC)"),
    end_date: Optional[str] = Query(None, description="Fecha fin ISO 8601 (UTC)"),
):
    """
    Endpoint de reporte técnico de telemetría — Fase 4.

    Devuelve métricas operacionales calculadas a partir de los eventos
    almacenados en `telemetry_events`.

    Parámetros query opcionales:
      - start_date: Fecha de inicio en formato ISO 8601 (inclusivo)
      - end_date: Fecha de fin en formato ISO 8601 (exclusivo)

    Si no se proveen fechas, usa por defecto los últimos 7 días (UTC).

    Respuesta:
      {
        "period": { "from": "...", "to": "..." },
        "metrics": {
          "events_per_day": [...],
          "error_events_by_type": [...],
          "api_latency_stats": [...],
          "auth_failure_rate": [...]
        }
      }
    """
    now = datetime.now(timezone.utc)

    # ── 1. Resolver período (una sola vez) ──
    if end_date is None:
        end_date = now.isoformat()
    if start_date is None:
        start_dt = now - timedelta(days=7)
        start_date = start_dt.isoformat()

    # ── 2. Verificar cache ──
    cache_key = _get_cache_key(start_date, end_date)
    cached_result = _report_cache.get(cache_key)
    if cached_result is not None:
        logger.info("Cache hit for report: %s", cache_key)
        return cached_result

    # ── 3. Ejecutar pipeline de métricas ──
    logger.info("Cache miss — computing report for: %s", cache_key)

    metrics = {
        "events_per_day": events_per_day(start_date, end_date),
        "error_events_by_type": error_events_by_type(start_date, end_date),
        "api_latency_stats": api_latency_stats(start_date, end_date),
        "auth_failure_rate": auth_failure_rate(start_date, end_date),
    }

    # ── 4. Construir respuesta ──
    result = {
        "period": {
            "from": start_date,
            "to": end_date,
        },
        "metrics": metrics,
    }

    # ── 5. Almacenar en cache ──
    _report_cache[cache_key] = result

    return result


# ──────────────────────────── Endpoint: Eventos ────────────────────────

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