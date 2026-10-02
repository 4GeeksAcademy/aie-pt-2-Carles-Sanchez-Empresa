"""API separada para consultar y ejecutar el pipeline de reporting."""

from datetime import date
import sys
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query, status

_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from data.pipelines import (
    consultar_desempeno_semanal,
    disparar_corrida_semanal,
    obtener_ultima_ejecucion,
)

router = APIRouter(prefix="/reporting", tags=["Reporting"])


def _get_pipeline_task():
    """Importa Celery tanto desde el árbol del repo como desde la imagen API.

    En Docker `/app/api/services.py` tiene prioridad sobre el paquete
    `/app/services`, así que un import directo de `services.celery_app` falla.
    """
    try:
        from services.celery_app import run_weekly_pipeline
        return run_weekly_pipeline
    except (ModuleNotFoundError, ImportError):
        import importlib.util

        # En la imagen API el módulo se copia junto a main.py porque
        # `services.py` puede ocultar el paquete `services/`.
        celery_path = Path("/app/api/celery_app.py")
        if not celery_path.exists():
            celery_path = _root / "services" / "celery_app.py"
        spec = importlib.util.spec_from_file_location("trackflow_reporting_celery", celery_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"No se pudo cargar Celery desde {celery_path}")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module.run_weekly_pipeline


@router.get("/weekly-warehouse-client-performance")
def weekly_performance(week_start: Optional[date] = None):
    return consultar_desempeno_semanal(week_start)


@router.get("/pipeline-runs/latest")
def latest_pipeline_run():
    return obtener_ultima_ejecucion() or {"status": "no_runs"}


@router.post("/pipeline-runs", status_code=status.HTTP_202_ACCEPTED)
def run_pipeline(week_start: Optional[date] = None):
    task = _get_pipeline_task().delay(week_start.isoformat() if week_start else None)
    return {"task_id": task.id}
