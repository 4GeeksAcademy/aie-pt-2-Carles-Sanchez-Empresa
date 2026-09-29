"""Exportación nocturna de telemetría y lanzamiento del pipeline.

Uso: ``python scripts/nightly_export.py``
TARGET_DATE=YYYY-MM-DD permite ejecutar una fecha concreta en pruebas.
"""

from __future__ import annotations

import csv
import logging
import os
import subprocess
import sys
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

from sqlalchemy import text

# Permite ejecutar el archivo directamente desde la raíz sin importar FastAPI.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.job_runner import (  # noqa: E402
    JOB_NAME,
    create_job_run,
    fail_job_run,
    get_engine,
    has_completed_for_date,
    has_processing_lock,
    update_job_run,
)

LOG_FORMAT = "%(asctime)s %(levelname)s job=%(job_name)s status=%(status)s %(message)s"
logger = logging.getLogger(JOB_NAME)


def log_info(status: str, message: str) -> None:
    logger.info(message, extra={"job_name": JOB_NAME, "status": status})


def log_error(status: str, message: str) -> None:
    logger.error(message, extra={"job_name": JOB_NAME, "status": status})


def resolve_target_date() -> date:
    configured = os.getenv("TARGET_DATE")
    if configured:
        try:
            return date.fromisoformat(configured)
        except ValueError as exc:
            raise ValueError("TARGET_DATE debe tener formato YYYY-MM-DD") from exc
    return datetime.now(timezone.utc).date() - timedelta(days=1)


def export_telemetry(engine, target_date: date, output_path: Path) -> None:
    """Crea el snapshot una sola vez; no es input del pipeline."""
    if output_path.exists():
        log_info("processing", f"CSV ya existente, no se sobrescribe: {output_path}")
        return

    start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    with engine.connect() as connection:
        rows = connection.execute(
            text(
                """SELECT event_id, timestamp, event_type, session_id, user_id, service, tags
                   FROM telemetry_events
                   WHERE timestamp >= :start_at AND timestamp < :end_at
                   ORDER BY timestamp, id"""
            ),
            {"start_at": start.isoformat(), "end_at": end.isoformat()},
        ).mappings()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("x", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(
                csv_file,
                fieldnames=["event_id", "timestamp", "event_type", "session_id", "user_id", "service", "tags"],
            )
            writer.writeheader()
            for row in rows:
                item = dict(row)
                item["tags"] = str(item["tags"])
                writer.writerow(item)


def run_pipeline() -> None:
    command = [sys.executable, "-m", "data.pipelines.pipeline"]
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
    target_date = resolve_target_date()
    output_path = ROOT / "data" / "raw" / f"telemetry_{target_date.isoformat()}.csv"
    engine = get_engine()
    run_id: int | None = None
    log_info("pending", f"Inicio de ejecución para target_date={target_date}")

    try:
        # Cada intento queda auditado, incluso las cancelaciones idempotentes.
        run_id = create_job_run(engine, JOB_NAME, target_date)
        if has_processing_lock(engine, JOB_NAME):
            message = "Ejecución cancelada: ya existe otra ejecución en processing"
            fail_job_run(engine, run_id, message)
            log_info("failed", message)
            return 0
        if has_completed_for_date(engine, JOB_NAME, target_date):
            message = f"Ejecución omitida: ya existe completed para {target_date}"
            fail_job_run(engine, run_id, message)
            log_info("failed", message)
            return 0

        update_job_run(engine, run_id, "processing")
        log_info("processing", f"Procesando target_date={target_date}")
        export_telemetry(engine, target_date, output_path)
        run_pipeline()
        update_job_run(engine, run_id, "completed")
        log_info("completed", f"Ejecución completada para target_date={target_date}")
        return 0
    except Exception as exc:
        if run_id is not None:
            fail_job_run(engine, run_id, str(exc))
        log_error("failed", f"Ejecución fallida: {exc}")
        raise


if __name__ == "__main__":
    raise SystemExit(main())
