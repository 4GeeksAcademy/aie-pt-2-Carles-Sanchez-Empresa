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
