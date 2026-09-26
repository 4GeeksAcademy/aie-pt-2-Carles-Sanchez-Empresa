"""Persistencia y máquina de estados para trabajos batch independientes de FastAPI."""

from __future__ import annotations

import os
from datetime import date, datetime, timezone
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

load_dotenv()

JOB_NAME = "nightly_export"
VALID_STATUSES = {"pending", "processing", "completed", "failed"}


def get_engine() -> Engine:
    """Construye un engine nuevo sin importar ni arrancar la aplicación API."""
    database_url = os.getenv("SUPABASE_URL")
    if not database_url:
        raise RuntimeError("SUPABASE_URL no está configurada")
    return create_engine(database_url, pool_pre_ping=True)


def create_job_run(engine: Engine, job_name: str, target_date: date) -> int:
    """Crea un intento de ejecución en estado ``pending``."""
    with engine.begin() as connection:
        result = connection.execute(
            text(
                """INSERT INTO job_runs (job_name, target_date, status)
                   VALUES (:job_name, :target_date, 'pending')
                   RETURNING id"""
            ),
            {"job_name": job_name, "target_date": target_date},
        )
        return int(result.scalar_one())


def has_processing_lock(engine: Engine, job_name: str) -> bool:
    """Indica si existe una ejecución activa; ``processing`` es el único lock."""
    with engine.connect() as connection:
        return bool(
            connection.execute(
                text("SELECT 1 FROM job_runs WHERE job_name = :job_name AND status = 'processing' LIMIT 1"),
                {"job_name": job_name},
            ).first()
        )


def has_completed_for_date(engine: Engine, job_name: str, target_date: date) -> bool:
    """Consulta la idempotencia por job y fecha, nunca solo por job."""
    with engine.connect() as connection:
        return bool(
            connection.execute(
                text(
                    """SELECT 1 FROM job_runs
                       WHERE job_name = :job_name AND target_date = :target_date
                         AND status = 'completed' LIMIT 1"""
                ),
                {"job_name": job_name, "target_date": target_date},
            ).first()
        )


def update_job_run(
    engine: Engine,
    run_id: int,
    status: str,
    *,
    error_message: str | None = None,
) -> None:
    """Actualiza una ejecución validando la transición y timestamps UTC."""
    if status not in VALID_STATUSES:
        raise ValueError(f"Estado no válido: {status}")

    now = datetime.now(timezone.utc)
    with engine.begin() as connection:
        if status == "processing":
            result = connection.execute(
                text(
                                        """UPDATE job_runs AS candidate
                       SET status = 'processing', started_at = :now
                                             WHERE candidate.id = :run_id AND candidate.status = 'pending'
                         AND NOT EXISTS (
                                                     SELECT 1 FROM job_runs AS active
                                                     WHERE active.job_name = candidate.job_name AND active.status = 'processing'
                                                 )
                                                 AND NOT EXISTS (
                                                     SELECT 1 FROM job_runs AS completed
                                                     WHERE completed.job_name = candidate.job_name
                                                         AND completed.target_date = candidate.target_date
                                                         AND completed.status = 'completed'
                         )"""
                ),
                {"run_id": run_id, "now": now},
            )
        elif status in {"completed", "failed"}:
            result = connection.execute(
                text(
                    """UPDATE job_runs
                       SET status = :status, finished_at = :now,
                           error_message = :error_message
                       WHERE id = :run_id AND status = 'processing'"""
                ),
                {"run_id": run_id, "status": status, "now": now, "error_message": error_message},
            )
        else:
            result = connection.execute(
                text("UPDATE job_runs SET status = 'pending' WHERE id = :run_id AND status = 'pending'"),
                {"run_id": run_id},
            )

        if result.rowcount != 1:
            raise RuntimeError(f"Transición inválida o lock ocupado para job_run={run_id}: {status}")


def fail_job_run(engine: Engine, run_id: int, error_message: str) -> None:
    """Marca un intento como fallido, también si fue cancelado antes de procesar."""
    now = datetime.now(timezone.utc)
    with engine.begin() as connection:
        connection.execute(
            text(
                """UPDATE job_runs
                   SET status = 'failed', finished_at = :now, error_message = :error_message
                   WHERE id = :run_id AND status IN ('pending', 'processing')"""
            ),
            {"run_id": run_id, "now": now, "error_message": error_message},
        )


def get_job_run(engine: Engine, run_id: int) -> dict[str, Any] | None:
    with engine.connect() as connection:
        row = connection.execute(text("SELECT * FROM job_runs WHERE id = :run_id"), {"run_id": run_id}).mappings().first()
        return dict(row) if row else None
