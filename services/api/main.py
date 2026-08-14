"""
main.py — FastAPI service for incident analysis (TrackFlow).

Endpoints:
    POST /api/incidents/analyze        → Upload CSV, get JSON analysis
    GET  /api/incidents/results/export  → Download last analysis as CSV
    GET  /                             → Backoffice frontend (HTML/CSS/JS)
"""

import csv
import io
import os
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from analyzer import analyze_rows, build_results_csv

# ──────────────────────────── App ────────────────────────────

app = FastAPI(
    title="TrackFlow Incident Analyzer API",
    description="API para analizar incidencias de envíos a partir de ficheros CSV.",
    version="1.0.0",
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
async def post_analyze(file: UploadFile = File(...)):
    """
    Recibe un fichero CSV (multipart/form-data) con incidencias,
    ejecuta la validación y métricas, y devuelve el resumen en JSON.
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
async def get_export():
    """
    Devuelve el último análisis en formato CSV descargable.
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


# ──────────────────────────── Root health-check ────────────────────────────

@app.get("/api/health")
async def root():
    return {"status": "ok", "service": "TrackFlow Incident Analyzer API"}


# ──────────────────────── Frontend Routes ────────────────────────

@app.get("/")
async def get_index():
    """Sirve la página principal del backoffice."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "index.html"))


@app.get("/incidents.html")
async def get_incidents():
    """Sirve la página de análisis de incidencias."""
    return FileResponse(os.path.join(BACKOFFICE_DIR, "incidents.html"))


# ──────────────────────────── Entry point ────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)