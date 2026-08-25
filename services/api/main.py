"""
main.py — FastAPI service for TrackFlow.

Módulos:
    /api/incidents/*      → Incidents manager (nuevo gestor)
    /api/incidents/analyze → Analyzer de incidencias (existente)
    /api/incidents/summary → Métricas agregadas (gestor)
    /api/suppliers/*      → Directorio de proveedores (protegido)
    /auth/*               → Autenticación JWT
    /users/*              → Gestión de usuarios
    /profiles/*           → Perfiles de usuario
    GET /                 → Backoffice frontend (HTML/CSS/JS)
"""

import csv
import io
import os
from typing import Optional

from fastapi import Depends, FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from analyzer import analyze_rows, build_results_csv
from auth import get_current_user
from routes import (
    auth_router,
    incidents_router,
    profiles_router,
    suppliers_router,
    users_router,
)

# ──────────────────────────── App ────────────────────────────

app = FastAPI(
    title="TrackFlow API",
    description="API unificada de TrackFlow. Incluye análisis de incidencias, directorio de proveedores y autenticación.",
    version="2.1.0",
)

# ── CORS: permitir peticiones desde el frontend ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Servir frontend (backoffice) como estáticos ──
BACKOFFICE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uis", "backoffice")

# Servimos JS y demás recursos bajo /js/, /public/, etc.
app.mount("/js", StaticFiles(directory=os.path.join(BACKOFFICE_DIR, "js")), name="js")

# Almacén en memoria del último resultado (para la exportación CSV)
_last_result: dict | None = None

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

@app.post("/api/incidents/analyze")
async def post_analyze(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Recibe un fichero CSV (multipart/form-data) con incidencias,
    ejecuta la validación y métricas, y devuelve el resumen en JSON.

    Requiere autenticación (token JWT).
    """
    global _last_result

    # ── Validación básica del fichero ──
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="El fichero debe tener extensión .csv",
        )

    # ── Lectura ──
    try:
        raw = await file.read()
        content = raw.decode("utf-8-sig")  # tolera BOM
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer el fichero: {e}")

    if not content.strip():
        raise HTTPException(status_code=400, detail="El fichero está vacío.")

    # ── Parseo ──
    try:
        rows = _parse_csv(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al parsear el CSV: {e}")

    # ── Análisis ──
    result = analyze_rows(rows)
    _last_result = result

    return result


@app.get("/api/incidents/results/export")
async def get_export(
    current_user: dict = Depends(get_current_user),
):
    """
    Devuelve el último análisis en formato CSV descargable.

    Requiere autenticación (token JWT).
    """
    if _last_result is None:
        raise HTTPException(
            status_code=404,
            detail="No hay ningún análisis previo. Realiza un POST /api/incidents/analyze primero.",
        )

    csv_content = build_results_csv(_last_result)

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
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(auth_router)


# ──────────────────────────── Root health-check ────────────────────────────

@app.get("/api/health")
async def root():
    return {"status": "ok", "service": "TrackFlow API"}


# ──────────────────────── Frontend Routes ────────────────────────

@app.get("/")
async def get_index():
    """Sirve la página principal del backoffice."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "index.html"))


@app.get("/incidents.html")
async def get_incidents():
    """Sirve la página de análisis de incidencias."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "incidents.html"))


@app.get("/suppliers.html")
async def get_suppliers():
    """Sirve la página del directorio de proveedores."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "suppliers.html"))


@app.get("/login.html")
async def get_login():
    """Sirve la página de inicio de sesión."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "login.html"))


@app.get("/login")
async def get_login_clean():
    """Alias limpio para la página de inicio de sesión."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "login.html"))


@app.get("/register.html")
async def get_register():
    """Sirve la página de registro."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "register.html"))


@app.get("/register")
async def get_register_clean():
    """Alias limpio para la página de registro."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "register.html"))


@app.get("/forgot-password.html")
async def get_forgot_password():
    """Sirve la página de recuperación de contraseña."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "forgot-password.html"))


@app.get("/forgot-password")
async def get_forgot_password_clean():
    """Alias limpio para la página de recuperación de contraseña."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "forgot-password.html"))


@app.get("/reset-password.html")
async def get_reset_password():
    """Sirve la página de restablecimiento de contraseña."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "reset-password.html"))


@app.get("/reset-password")
async def get_reset_password_clean():
    """Alias limpio para la página de restablecimiento de contraseña."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "reset-password.html"))


@app.get("/profile.html")
async def get_profile():
    """Sirve la página de perfil de usuario."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "profile.html"))


@app.get("/account/profile")
async def get_profile_clean():
    """Alias limpio para la página de perfil de usuario."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "profile.html"))


@app.get("/incidents-manager.html")
async def get_incidents_manager():
    """Sirve la página del gestor de incidencias (nuevo)."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "incidents-manager.html"))


# ──────────────────────────── Entry point ────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)