"""Configuración de Celery y tareas asíncronas de TrackFlow."""

from __future__ import annotations

import logging
import os
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path

from celery import Celery
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine

# Permite importar data/ y los módulos del backend desde el worker.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
# La API se copia como /app/api en Docker, mientras que en local vive en
# services/api. El pipeline usa imports históricos como `from database import`.
for API_DIR in (ROOT / "api", ROOT / "services" / "api"):
    if API_DIR.exists() and str(API_DIR) not in sys.path:
        sys.path.insert(0, str(API_DIR))
load_dotenv(ROOT / ".env")

logger = logging.getLogger(__name__)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery("trackflow", broker=REDIS_URL, backend=REDIS_URL)
app.conf.update(
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    result_expires=86400,
    accept_content=["json"],
    task_serializer="json",
    result_serializer="json",
)


def _record_dlq(task_id: str, attempt: int, error: Exception) -> None:
    """Guarda un fallo definitivo en la base de datos compartida."""
    try:
        from services.api.database import engine
        from services.api.models import TaskFailure
    except ModuleNotFoundError:
        # En Docker /app/api está en sys.path; en local puede estarlo
        # services/api. En ambos casos estos imports son compatibles.
        from database import engine
        from models import TaskFailure

    SQLModel.metadata.create_all(engine, tables=[TaskFailure.__table__])
    with Session(engine) as session:
        session.add(TaskFailure(
            task_id=task_id,
            task_name="run_weekly_pipeline",
            attempt=attempt,
            error_message=str(error),
            failed_at=datetime.now(timezone.utc).isoformat(),
        ))
        session.commit()


@app.task(bind=True, name="trackflow.run_weekly_pipeline", max_retries=3)
def run_weekly_pipeline(self, week_start: str | None = None) -> str:
    """Ejecuta el pipeline semanal usando solo parámetros ligeros."""
    started = time.perf_counter()
    attempt = self.request.retries + 1
    task_id = self.request.id
    try:
        from data.pipelines import disparar_corrida_semanal

        parsed_week = date.fromisoformat(week_start) if week_start else None
        result = disparar_corrida_semanal(parsed_week)
        duration = time.perf_counter() - started
        logger.info("task_id=%s intento=%s estado=success duracion=%.3fs", task_id, attempt, duration)
        return result
    except Exception as exc:
        duration = time.perf_counter() - started
        logger.exception("task_id=%s intento=%s estado=failure duracion=%.3fs error=%s", task_id, attempt, duration, exc)
        if self.request.retries < self.max_retries:
            # Backoff 10, 20 y 40 segundos entre intentos.
            countdown = 10 * (2 ** self.request.retries)
            raise self.retry(exc=exc, countdown=countdown)
        _record_dlq(task_id, attempt, exc)
        raise


def _record_rfp_operational_error(ticket_id: str, error: Exception, *, failed: bool) -> None:
    """Actualiza solo telemetría operativa; conserva el estado de negocio del ticket."""
    try:
        from services.api.database import engine
        from services.api.models import RfpTicket
    except ModuleNotFoundError:
        from database import engine
        from models import RfpTicket

    with Session(engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        if ticket is None:
            logger.error("RFP ticket desapareció mientras se procesaba: %s", ticket_id)
            return
        if ticket.status != "analizando":
            logger.info(
                "Se omite registrar error de RFP %s: el ticket ya está en estado terminal (%s)",
                ticket_id,
                ticket.status,
            )
            return
        ticket.retry_count += 1
        ticket.last_error = str(error)[:2000]
        if failed:
            ticket.failed_at = datetime.now(timezone.utc)
        ticket.updated_at = datetime.now(timezone.utc)
        session.add(ticket)
        session.commit()


def _is_permanent_rfp_error(error: Exception) -> bool:
    """Return whether retrying an RFP task unchanged cannot fix the failure.

    Authentication/authorization responses require an operator to rotate or
    correct provider credentials; retrying them only repeats the same failure.
    Keep this check based on HTTP status so SDK-specific exception classes are
    not required here.
    """
    status_code = getattr(error, "status_code", None)
    if status_code is None:
        response = getattr(error, "response", None)
        status_code = getattr(response, "status_code", None)
    return status_code in {401, 403}


@app.task(bind=True, name="trackflow.process_rfp_ticket", max_retries=3)
def process_rfp_ticket(self, ticket_id: str) -> dict:
    """Execute the RFP graph with three retries after the initial attempt."""
    try:
        # La API persiste el ticket/fichero; Celery ejecuta Parte 1 y, cuando
        # el handoff queda completo, genera y evalúa las secciones de Parte 2.
        from data.pipelines.rfp_intake import process_ticket

        result = process_ticket(ticket_id)
        if result.get("status") == "analisis_completo" and not result.get("skipped"):
            from data.pipelines.rfp_response_generation import generate_ticket_responses
            from data.pipelines.rfp_intake.pipeline import engine as rfp_engine

            result["response_generation"] = generate_ticket_responses(ticket_id, db_engine=rfp_engine)
            if result["response_generation"].get("status") == "en_evaluación":
                from data.pipelines.rfp_approval import start_approval

                result["approval"] = start_approval(ticket_id, db_engine=rfp_engine)
        elif result.get("skipped") and result.get("status") in {
            "generando_borrador", "en_evaluación"
        }:
            # A Celery retry after Part 1 resumes Part 2 from the durable handoff.
            from data.pipelines.rfp_response_generation import generate_ticket_responses
            from data.pipelines.rfp_intake.pipeline import engine as rfp_engine

            result["response_generation"] = generate_ticket_responses(ticket_id, db_engine=rfp_engine)
            if result["response_generation"].get("status") == "en_evaluación":
                from data.pipelines.rfp_approval import start_approval

                result["approval"] = start_approval(ticket_id, db_engine=rfp_engine)
        return result
    except Exception as exc:
        # Celery retries=3 means up to four total executions (initial + 3 retries).
        exhausted = self.request.retries >= self.max_retries
        permanent = _is_permanent_rfp_error(exc)
        failed = exhausted or permanent
        if permanent:
            # Avoid exposing a provider's raw authentication payload in the
            # dashboard. Record a safe diagnosis and the corrective action.
            response = getattr(exc, "response", None)
            status_code = getattr(exc, "status_code", None) or getattr(response, "status_code", None)
            operational_error = RuntimeError(
                f"El proveedor LLM rechazó las credenciales (HTTP {status_code}). "
                "Rota o corrige la clave del proveedor y reinicia el worker Celery."
            )
            _record_rfp_operational_error(ticket_id, operational_error, failed=True)
            logger.error(
                "Fallo permanente de autenticación LLM en ticket RFP %s; no se reintentará",
                ticket_id,
            )
            raise

        _record_rfp_operational_error(ticket_id, exc, failed=failed)
        logger.exception("Fallo en ticket RFP %s; intento %s", ticket_id, self.request.retries + 1)
        if not exhausted:
            raise self.retry(exc=exc, countdown=10 * (2 ** self.request.retries))
        raise
