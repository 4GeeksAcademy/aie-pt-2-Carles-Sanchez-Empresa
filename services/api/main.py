"""
main.py — FastAPI service for TrackFlow.

Módulos:
    /inventory/*          → Gestión de inventario con ORM + Supabase (nuevo)
    /api/incidents/*      → Incidents manager
    /api/incidents/analyze → Analyzer de incidencias
    /api/incidents/summary → Métricas agregadas
    /api/suppliers/*      → Directorio de proveedores (protegido)
    /auth/*               → Autenticación JWT
    /users/*              → Gestión de usuarios
    /profiles/*           → Perfiles de usuario
    La interfaz del backoffice se sirve desde Next.js.
"""

import csv
import asyncio
import os
import io
import logging
import sys
import time
from pathlib import Path
from typing import Optional

# Permite conservar los imports históricos (`telemetry.analysis`) cuando la API
# se ejecuta desde tests, uvicorn o el contenedor.
_services_dir = Path(__file__).resolve().parent.parent
if str(_services_dir) not in sys.path:
    sys.path.insert(0, str(_services_dir))

logger = logging.getLogger(__name__)
timing_logger = logging.getLogger("api.timing")

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, UploadFile, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from analyzer import analyze_rows, build_results_csv
from auth import get_current_user, require_admin
from database import engine
from i18n import get_translator, get_language_from_request
from models import SQLModel
from pydantic_models import AnalyzeResponse
from support_agent.api import agent_lifespan, router as agent_router
from support_agent.chat_api import router as chat_router
try:
    from services.celery_app import app as celery_app
except ModuleNotFoundError:  # Ejecución directa con PYTHONPATH apuntando a api/
    # En la imagen Docker `/app/api/services.py` sombrea al paquete `/app/services`,
    # por lo que no se puede importar `services.celery_app` de forma normal.
    # Cargar el módulo por ruta mantiene compatibles Docker, uvicorn y los tests.
    import importlib.util

    _celery_path = Path(__file__).resolve().parent.parent / "celery_app.py"
    if not _celery_path.exists():
        _celery_path = Path(__file__).resolve().parent / "celery_app.py"
    _celery_spec = importlib.util.spec_from_file_location("trackflow_celery_app", _celery_path)
    if _celery_spec is None or _celery_spec.loader is None:
        raise ImportError(f"No se pudo cargar Celery desde {_celery_path}")
    _celery_module = importlib.util.module_from_spec(_celery_spec)
    _celery_spec.loader.exec_module(_celery_module)
    celery_app = _celery_module.app
from models import TaskFailure
from routes import (
    auth_router,
    incidents_router,
    inventory_router,
    knowledge_router,
    profiles_router,
    reporting_router,
    rfp_intake_router,
    suppliers_router,
    telemetry_router,
    users_router,
)
from oauth_issuer import router as oauth_issuer_router

# ──────────────────────────── Lifespan: init SQLModel tables ────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa las tablas de SQLModel en Supabase al arrancar la aplicación."""
    # Configurar logging para visibilidad del timing middleware
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # No bloquear el arranque HTTP si Supabase está caído o no es accesible
    # desde Docker. Antes Uvicorn abría el socket, pero la aplicación quedaba
    # atrapada en create_all y el puerto 8000 cerraba las conexiones.
    try:
        await asyncio.wait_for(asyncio.to_thread(SQLModel.metadata.create_all, engine), timeout=10)
        logger.info("Tablas SQLModel creadas/verificadas en Supabase")
    except asyncio.TimeoutError:
        logger.warning("Supabase no respondió en 10s; la API arranca sin ejecutar create_all")
    except Exception:
        logger.exception("No se pudieron verificar las tablas SQLModel; la API continúa disponible")
    async with agent_lifespan(app):
        yield


# ──────────────────────────── App ────────────────────────────

app = FastAPI(
    title="TrackFlow API",
    description="API unificada de TrackFlow. Incluye análisis de incidencias, directorio de proveedores, autenticación y gestión de inventario.",
    version="3.0.0",
    lifespan=lifespan,
)
async def authenticate_support_agent(request: Request, current_user: dict = Depends(get_current_user)):
    request.state.current_user = current_user


app.include_router(agent_router, dependencies=[Depends(authenticate_support_agent)])
app.include_router(chat_router)
app.include_router(oauth_issuer_router)


@app.get("/tasks/{task_id}", tags=["Tasks"])
async def get_task_status(task_id: str, request: Request, current_user: dict = Depends(require_admin)):
    """Devuelve el estado y resultado de una tarea Celery."""
    result = celery_app.AsyncResult(task_id)
    payload = {"task_id": task_id, "status": result.status.lower(), "result": None}
    if result.successful():
        payload["result"] = result.result
    elif result.failed():
        payload["result"] = {"error": str(result.result)}
    return payload

# ── CORS: permitir peticiones desde el frontend ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip().rstrip("/")
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:3000,http://localhost:3001",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin"],
)

# ── Security Headers Middleware ──
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Añade cabeceras de seguridad a todas las respuestas."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# ── Timing Middleware (medición de latencia) ──
@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    """
    Mide la duración de cada petición HTTP y la registra en api.timing.

    Formato:  METHOD /path → STATUS | XXXX.Xms
    Usar para identificar candidatos a caching: latencia alta + alta frecuencia.
    """
    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000  # ms

    timing_logger.info(
        "%s %s → %d | %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


# Almacén en memoria del último resultado (para la exportación CSV)
# CSV analysis results may contain customer incident data. Keep the export
# scoped to the authenticated principal instead of sharing the latest result
# process-wide between users.
_last_results: dict[str, dict] = {}

# ──────────────────── Global Error Handler ────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Captura cualquier excepción no controlada y devuelve un JSON
    genérico sin exponer stack traces al cliente.

    HTTPException se maneja normalmente (no se traga).
    """
    from fastapi.exceptions import HTTPException as FastAPIHTTPException

    if isinstance(exc, FastAPIHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    logger.exception("Excepción no controlada")

    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Contacte al administrador."},
    )

# ──────────────────────────── Helpers ────────────────────────────

def _parse_csv(content: str) -> list[dict]:
    """Convierte el contenido CSV a lista de diccionarios."""
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="El archivo CSV está vacío o solo tiene encabezados.")
    return rows


# ──────────────────────────── Endpoints ────────────────────────────
@app.post("/api/incidents/analyze", response_model=AnalyzeResponse)
async def post_analyze(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Recibe un fichero CSV (multipart/form-data) con incidencias,
    ejecuta la validación y métricas, y devuelve el resumen en JSON.

    Requiere autenticación (token JWT).
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="El fichero debe tener extensión .csv",
        )
    try:
        # ── Lectura acotada: no cargar archivos arbitrariamente grandes en memoria ──
        try:
            max_csv_bytes = 10 * 1024 * 1024
            raw = await file.read(max_csv_bytes + 1)
            if len(raw) > max_csv_bytes:
                raise HTTPException(status_code=413, detail="El fichero CSV supera el límite de 10 MB.")
            content = raw.decode("utf-8-sig")  # tolera BOM
        except HTTPException:
            raise
        except Exception:
            logger.exception("Error al leer fichero CSV")
            raise HTTPException(status_code=400, detail="Error al leer el fichero.")

        if not content.strip():
            raise HTTPException(status_code=400, detail="El fichero está vacío.")

        # ── Parseo ──
        try:
            rows = _parse_csv(content)
        except HTTPException:
            raise
        except Exception:
            logger.exception("Error al parsear CSV")
            raise HTTPException(status_code=400, detail="Error al parsear el archivo CSV.")

        # ── Análisis ──
        result = analyze_rows(rows)
        user_id = current_user.get("id") or current_user.get("user_id") or current_user.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="No se pudo determinar el usuario autenticado.")
        _last_results[str(user_id)] = result
        return result
    finally:
        await file.close()


@app.get("/api/incidents/results/export")
async def get_export(
    current_user: dict = Depends(get_current_user),
):
    """
    Devuelve el último análisis en formato CSV descargable.

    Requiere autenticación (token JWT).
    """
    user_id = current_user.get("id") or current_user.get("user_id") or current_user.get("sub")
    result = _last_results.get(str(user_id)) if user_id is not None else None
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No hay resultados disponibles para exportar.",
        )

    csv_content = build_results_csv(result)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=incident-analysis-results.csv",
        },
    )


# ──────────────────────────── Routers ────────────────────────────

app.include_router(suppliers_router, dependencies=[Depends(get_current_user)])
app.include_router(incidents_router, dependencies=[Depends(get_current_user)])
app.include_router(inventory_router, dependencies=[Depends(get_current_user)])
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(auth_router)
app.include_router(knowledge_router, dependencies=[Depends(get_current_user)])
app.include_router(telemetry_router)  # La vista de reportes aplica autenticación en su endpoint.
app.include_router(reporting_router, dependencies=[Depends(get_current_user)])
app.include_router(rfp_intake_router)


# ──────────────────────────── Root health-check ────────────────────────────

@app.get("/api/health")
async def root():
    return {"status": "ok", "service": "TrackFlow API"}


# ──────────────────────────── Entry point ────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)