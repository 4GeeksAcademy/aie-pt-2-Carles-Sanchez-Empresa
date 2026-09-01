"""
routes/incidents.py — Endpoints del Gestor de Incidencias TrackFlow.

CRUD completo con filtros, transiciones de estado validadas y resumen
de métricas agregadas.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from database import incidents_table, IncidentQuery
from models import (
    IncidentCreate,
    IncidentResponse,
    IncidentStatusUpdate,
    generate_timestamp,
    doc_to_response,
)
from trackflow_shared import VALID_TRANSITIONS, validate_incident_record

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


# ──────────────────────────── POST ────────────────────────────

@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(payload: IncidentCreate):
    """
    Crea una nueva incidencia.

    Valida la entrada con Pydantic antes de insertar en TinyDB.
    Devuelve 201 con el objeto completo incluyendo ID y timestamps.
    """
    now = generate_timestamp()

    doc = payload.model_dump()
    doc["created_at"] = now
    doc["updated_at"] = now
    doc["status"] = doc.get("status", "open")

    # Validación extra con lógica compartida
    errors = validate_incident_record(doc)
    if errors:
        raise HTTPException(status_code=400, detail=errors)

    doc_id = incidents_table.insert(doc)
    response = doc_to_response(doc, doc_id)

    return IncidentResponse(**response)


# ──────────────────────────── GET list ────────────────────────────

@router.get("", response_model=list[IncidentResponse])
async def list_incidents(
    status: Optional[str] = Query(None, description="Filtrar por estado (open, in_progress, resolved, discarded)"),
    origin: Optional[str] = Query(None, description="Filtrar por origen (customer, branch, internal)"),
    branch: Optional[str] = Query(None, description="Filtrar por sede (central, la_warehouse, la_office, zaragoza_warehouse, zaragoza_office)"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
):
    """
    Lista incidencias con filtros opcionales.

    Sin parámetros: devuelve todas las incidencias.
    Vacío: devuelve lista vacía (nunca 404).
    """
    docs = incidents_table.all()
    results = []

    for doc in docs:
        doc_id = doc.doc_id if hasattr(doc, "doc_id") else doc.get("id")
        if doc_id is None:
            continue

        doc_dict = dict(doc)
        doc_dict["id"] = doc_id

        if status and doc_dict.get("status") != status:
            continue
        if origin and doc_dict.get("origin") != origin:
            continue
        if branch and doc_dict.get("branch") != branch:
            continue
        if category and doc_dict.get("category") != category:
            continue

        results.append(IncidentResponse(**doc_to_response(doc_dict, doc_id)))

    return results


# ──────────────────────────── GET summary ────────────────────────────
# NOTA: debe ir ANTES de /{incident_id} para evitar que "summary" se
#       interprete como un integer.

@router.get("/summary")
async def get_summary():
    """
    Devuelve métricas agregadas de todas las incidencias.

    Siempre devuelve 200 con las métricas, incluso si no hay datos.
    """
    docs = incidents_table.all()

    by_status: dict[str, int] = {}
    by_category: dict[str, int] = {}
    by_origin: dict[str, int] = {}
    by_branch: dict[str, int] = {}

    for doc in docs:
        s = doc.get("status", "unknown")
        by_status[s] = by_status.get(s, 0) + 1

        c = doc.get("category", "unknown")
        by_category[c] = by_category.get(c, 0) + 1

        o = doc.get("origin", "unknown")
        by_origin[o] = by_origin.get(o, 0) + 1

        b = doc.get("branch", "unknown")
        by_branch[b] = by_branch.get(b, 0) + 1

    return {
        "total": len(docs),
        "by_status": by_status,
        "by_category": by_category,
        "by_origin": by_origin,
        "by_branch": by_branch,
    }


# ──────────────────────────── GET by id ────────────────────────────

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: int):
    """
    Devuelve el detalle de una incidencia por su ID.
    Devuelve 404 si no existe.
    """
    doc = incidents_table.get(doc_id=incident_id)
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró la incidencia con id {incident_id}",
        )

    doc_dict = dict(doc)
    return IncidentResponse(**doc_to_response(doc_dict, incident_id))


# ──────────────────────────── PATCH status ────────────────────────────

@router.patch("/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(incident_id: int, payload: IncidentStatusUpdate):
    """
    Actualiza únicamente el estado de una incidencia.

    Valida que la transición sea coherente con el ciclo de vida:
      - open → in_progress, discarded
      - in_progress → resolved, discarded
      - resolved y discarded son terminales (no se puede avanzar desde ellos)
    """
    doc = incidents_table.get(doc_id=incident_id)
    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró la incidencia con id {incident_id}",
        )

    current_status = doc.get("status", "")
    new_status = payload.status

    # Validar transición
    allowed = VALID_TRANSITIONS.get(current_status)
    if allowed is None:
        raise HTTPException(
            status_code=400,
            detail=[{
                "field": "status",
                "error": f"El estado '{current_status}' no es válido.",
            }],
        )

    if new_status not in allowed:
        if current_status in ("resolved", "discarded"):
            msg = f"No se puede cambiar el estado. Los estados '{current_status}' son finales."
        else:
            msg = f"No se puede pasar de '{current_status}' a '{new_status}'. Transiciones permitidas: {', '.join(sorted(allowed))}"
        raise HTTPException(
            status_code=400,
            detail=[{"field": "status", "error": msg}],
        )

    # Actualizar
    now = generate_timestamp()
    incidents_table.update({"status": new_status, "updated_at": now}, doc_ids=[incident_id])

    doc_dict = dict(doc)
    doc_dict["status"] = new_status
    doc_dict["updated_at"] = now
    return IncidentResponse(**doc_to_response(doc_dict, incident_id))