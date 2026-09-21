"""Pipeline Prefect del Reporte Semanal de Desempeño de TrackFlow.

CLI: ``python data/pipelines/pipeline.py [--week-start YYYY-MM-DD]``
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import pandas as pd

# Desactiva la analítica auxiliar para evitar bloqueos SQLite en ejecuciones CLI.
os.environ.setdefault("PREFECT_SERVER_ANALYTICS_ENABLED", "false")
from prefect import flow, task
from prefect.states import State

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT / "services" / "api") not in sys.path:
    sys.path.insert(0, str(ROOT / "services" / "api"))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from data.process.transform import calcular_kpis_por_almacen_cliente, dataframe_cache_key  # noqa: E402

EVENT_TYPES = (
    "inbound_order_created",
    "outbound_order_created",
    "stock_threshold_triggered",
    "inventory_discrepancy_detected",
)


def _engine():
    from database import engine
    return engine


@task(name="preparar_tablas_reporting", retries=3, retry_delay_seconds=10)
def preparar_tablas_reporting() -> None:
    """Prepara el destino; 3 reintentos cubren indisponibilidad transitoria."""
    from sqlalchemy import text
    statements = [
        "CREATE SCHEMA IF NOT EXISTS reporting",
        """CREATE TABLE IF NOT EXISTS reporting.weekly_warehouse_client_performance (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(), warehouse text NOT NULL,
          client_id text NOT NULL, week_start date NOT NULL,
          inbound_units_count integer NOT NULL DEFAULT 0,
          outbound_orders_count integer NOT NULL DEFAULT 0,
          stockout_events_count integer NOT NULL DEFAULT 0,
          discrepancy_events_count integer NOT NULL DEFAULT 0,
          discrepancy_rate numeric NOT NULL DEFAULT 0,
          computed_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (warehouse, client_id, week_start))""",
        """CREATE TABLE IF NOT EXISTS reporting.pipeline_execution_log (
          run_id uuid PRIMARY KEY, pipeline_name text NOT NULL,
          started_at timestamptz NOT NULL, completed_at timestamptz,
          status text NOT NULL, records_processed integer NOT NULL DEFAULT 0,
          records_written integer NOT NULL DEFAULT 0, errors jsonb,
          week_start date NOT NULL)""",
    ]
    with _engine().begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


@task(name="extraer_eventos_telemetria", retries=3, retry_delay_seconds=10)
def extraer_eventos_telemetria(week_start: date) -> pd.DataFrame:
    """Lee telemetría sin modificarla; 3 reintentos absorben fallos transitorios."""
    from sqlalchemy import text
    end = week_start + timedelta(days=7)
    query = text("""
        SELECT event_type, timestamp, tags
        FROM telemetry_events
        WHERE event_type = ANY(:event_types)
          AND timestamp >= :start_at AND timestamp < :end_at
    """)
    with _engine().connect() as connection:
        rows = connection.execute(query, {
            "event_types": list(EVENT_TYPES),
            "start_at": f"{week_start.isoformat()}T00:00:00+00:00",
            "end_at": f"{end.isoformat()}T00:00:00+00:00",
        }).mappings().all()
    return pd.DataFrame(rows, columns=["event_type", "timestamp", "tags"])


@task(
    name="transformar_kpis_por_almacen_cliente",
    cache_key_fn=dataframe_cache_key,
    cache_expiration=timedelta(hours=1),
)
def transformar_kpis_por_almacen_cliente(events: pd.DataFrame, week_start: date) -> pd.DataFrame:
    """Transformación costosa cacheada una hora por contenido y semana."""
    return calcular_kpis_por_almacen_cliente(events, week_start)


@task(name="cargar_en_reporting", retries=3, retry_delay_seconds=15)
def cargar_en_reporting(kpis: pd.DataFrame) -> int:
    """Upsert idempotente; 3 reintentos cubren interrupciones de Supabase."""
    if kpis.empty:
        return 0
    from sqlalchemy import text
    statement = text("""
        INSERT INTO reporting.weekly_warehouse_client_performance
        (warehouse, client_id, week_start, inbound_units_count,
         outbound_orders_count, stockout_events_count, discrepancy_events_count,
         discrepancy_rate, computed_at)
        VALUES (:warehouse, :client_id, :week_start, :inbound, :outbound,
                :stockouts, :discrepancies, :rate, now())
        ON CONFLICT (warehouse, client_id, week_start) DO UPDATE SET
          inbound_units_count = EXCLUDED.inbound_units_count,
          outbound_orders_count = EXCLUDED.outbound_orders_count,
          stockout_events_count = EXCLUDED.stockout_events_count,
          discrepancy_events_count = EXCLUDED.discrepancy_events_count,
          discrepancy_rate = EXCLUDED.discrepancy_rate,
          computed_at = now()
    """)
    with _engine().begin() as connection:
        for row in kpis.to_dict(orient="records"):
            connection.execute(statement, {
                "warehouse": row["warehouse"], "client_id": row["client_id"],
                "week_start": row["week_start"], "inbound": int(row["inbound_units_count"]),
                "outbound": int(row["outbound_orders_count"]), "stockouts": int(row["stockout_events_count"]),
                "discrepancies": int(row["discrepancy_events_count"]), "rate": float(row["discrepancy_rate"]),
            })
    return len(kpis)


@task(name="exportar_snapshot_eval")
def exportar_snapshot_eval(kpis: pd.DataFrame, week_start: date) -> str:
    """Exportación secundaria; no es necesaria para publicar los KPIs."""
    output = ROOT / "data" / "eval" / f"weekly_report_{week_start}.csv"
    kpis.to_csv(output, index=False)
    return str(output)


@task(name="registrar_ejecucion", retries=2, retry_delay_seconds=5)
def registrar_ejecucion(run_id: str, started_at: datetime, completed_at: datetime,
                        status: str, records_processed: int, records_written: int,
                        errors: list[str], week_start: date) -> None:
    from sqlalchemy import text
    statement = text("""
        INSERT INTO reporting.pipeline_execution_log
        (run_id, pipeline_name, started_at, completed_at, status,
         records_processed, records_written, errors, week_start)
        VALUES (:run_id, :name, :started, :completed, :status,
                :processed, :written, CAST(:errors AS jsonb), :week)
    """)
    with _engine().begin() as connection:
        connection.execute(statement, {
            "run_id": run_id, "name": "pipeline_semanal_desempeno",
            "started": started_at, "completed": completed_at, "status": status,
            "processed": records_processed, "written": records_written,
            "errors": json.dumps(errors), "week": week_start,
        })


@flow(name="preparar_reporting_flow")
def preparar_reporting_flow() -> None:
    """Prepara el esquema y las tablas de destino del reporting."""
    preparar_tablas_reporting()


@flow(name="procesar_kpis_flow")
def procesar_kpis_flow(week_start: date) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Extrae eventos y calcula los KPIs para una semana."""
    events = extraer_eventos_telemetria(week_start)
    kpis = transformar_kpis_por_almacen_cliente(events, week_start)
    return events, kpis


@flow(name="publicar_reporting_flow")
def publicar_reporting_flow(kpis: pd.DataFrame) -> int:
    """Publica los KPIs mediante el upsert idempotente."""
    return cargar_en_reporting(kpis)


@flow(name="snapshot_eval_flow")
def snapshot_eval_flow(kpis: pd.DataFrame, week_start: date) -> str:
    """Exporta el snapshot de evaluación como actividad secundaria."""
    return exportar_snapshot_eval(kpis, week_start)


def _latest_monday() -> date:
    today = datetime.now(timezone.utc).date()
    return today - timedelta(days=today.weekday() + 7)


@flow(name="pipeline_semanal_desempeno")
def pipeline_semanal_desempeno(week_start: date | None = None) -> str:
    week_start = week_start or _latest_monday()
    run_id = str(uuid4())
    started_at = datetime.now(timezone.utc)
    errors: list[str] = []
    processed = written = 0
    status = "completed"
    try:
        preparar_reporting_flow()
        events, kpis = procesar_kpis_flow(week_start)
        processed = len(events)
        written = publicar_reporting_flow(kpis)
        snapshot_state: State = snapshot_eval_flow(kpis, week_start, return_state=True)
        if snapshot_state.is_failed():
            errors.append(f"snapshot_eval: {snapshot_state.message}")
    except Exception as exc:
        status = "failed"
        errors.append(str(exc))
    finally:
        registrar_ejecucion(run_id, started_at, datetime.now(timezone.utc), status,
                            processed, written, errors, week_start)
    if status == "failed":
        raise RuntimeError(errors[-1])
    return run_id


def consultar_desempeno_semanal(week_start: date | None = None) -> dict:
    from sqlalchemy import text
    with _engine().connect() as connection:
        if week_start is None:
            week_start = connection.execute(text("SELECT max(week_start) FROM reporting.weekly_warehouse_client_performance")).scalar()
        rows = connection.execute(text("SELECT warehouse, client_id, inbound_units_count, outbound_orders_count, stockout_events_count, discrepancy_events_count, discrepancy_rate FROM reporting.weekly_warehouse_client_performance WHERE week_start = :week ORDER BY warehouse, client_id"), {"week": week_start}).mappings().all() if week_start else []
    return {"week_start": str(week_start) if week_start else None, "entries": [dict(row) for row in rows]}


def obtener_ultima_ejecucion() -> dict | None:
    from sqlalchemy import text
    with _engine().connect() as connection:
        row = connection.execute(text("SELECT * FROM reporting.pipeline_execution_log WHERE pipeline_name = 'pipeline_semanal_desempeno' ORDER BY started_at DESC LIMIT 1")).mappings().first()
    return dict(row) if row else None


def disparar_corrida_semanal(week_start: date | None = None) -> str:
    return pipeline_semanal_desempeno(week_start)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline semanal de desempeño TrackFlow")
    parser.add_argument("--week-start", type=date.fromisoformat)
    args = parser.parse_args()
    pipeline_semanal_desempeno(args.week_start)
