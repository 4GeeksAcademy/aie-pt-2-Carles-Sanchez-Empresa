"""API separada para consultar y ejecutar el pipeline de reporting."""

from datetime import date
import sys
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query

_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from data.pipelines import (
    consultar_desempeno_semanal,
    disparar_corrida_semanal,
    obtener_ultima_ejecucion,
)

router = APIRouter(prefix="/reporting", tags=["Reporting"])


@router.get("/weekly-warehouse-client-performance")
def weekly_performance(week_start: Optional[date] = None):
    return consultar_desempeno_semanal(week_start)


@router.get("/pipeline-runs/latest")
def latest_pipeline_run():
    return obtener_ultima_ejecucion() or {"status": "no_runs"}


@router.post("/pipeline-runs")
def run_pipeline(week_start: Optional[date] = None):
    return {"run_id": disparar_corrida_semanal(week_start), "status": "completed"}
