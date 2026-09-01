"""
routes/suppliers.py — Endpoints del Directorio de Proveedores (TrackFlow).

CRUD completo con filtros por país y categoría, más operaciones específicas
para tarifa y estado con validación Pydantic.
"""

from fastapi import APIRouter, HTTPException, Query

from database import suppliers_table, SupplierQuery
from models import (
    SupplierCreate,
    SupplierResponse,
    SupplierUpdateRate,
    SupplierUpdateStatus,
    SupplierStatus,
    VALID_CATEGORIES,
    generate_timestamp,
)

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


# ──────────────────────────── Helpers internos ────────────────────────────

def _doc_to_response(doc: dict) -> SupplierResponse:
    """Convierte un documento de TinyDB a SupplierResponse.

    TinyDB guarda el doc_id internamente como 'doc_id', pero al recuperarlo
    con all() o get() lo incluye en el diccionario si usamos doc_id.
    Aseguramos que el campo 'id' esté presente.
    """
    # TinyDB guarda el ID interno en doc.doc_id, pero al iterar con all()
    # los documentos son dicts. Usamos doc.doc_id si es necesario.
    return SupplierResponse(**doc)


def _enrich_with_id(doc: dict, doc_id: int) -> dict:
    """Añade el campo 'id' al documento para la respuesta."""
    doc["id"] = doc_id
    return doc


# ──────────────────────────── Endpoints ────────────────────────────

@router.post("", response_model=SupplierResponse, status_code=201)
async def create_supplier(payload: SupplierCreate):
    """
    Crea un nuevo proveedor.

    Valida la entrada con Pydantic antes de insertar en TinyDB.
    Devuelve 201 con el objeto completo incluyendo ID y timestamp.
    """
    now = generate_timestamp()

    doc = payload.model_dump()
    doc["updated_at"] = now

    doc_id = suppliers_table.insert(doc)
    doc["id"] = doc_id

    return SupplierResponse(**doc)


@router.get("", response_model=list[SupplierResponse])
async def list_suppliers(
    country: str = Query(None, description="Filtrar por país (USA o Spain)"),
    category: str = Query(None, description="Filtrar por categoría"),
):
    """
    Lista proveedores con filtros opcionales.

    - Sin parámetros: devuelve todos los proveedores.
    - ?country=X: filtra por país.
    - ?category=Y: filtra por categoría.
    - ?country=X&category=Y: combina ambos filtros.
    """
    docs = suppliers_table.all()
    results = []

    for doc in docs:
        doc_id = doc.doc_id if hasattr(doc, "doc_id") else doc.get("id")
        if doc_id is None:
            continue

        doc_dict = dict(doc)
        doc_dict["id"] = doc_id

        # Filtro por país
        if country and doc_dict.get("country") != country:
            continue

        # Filtro por categoría
        if category and category not in doc_dict.get("categories", []):
            continue

        results.append(SupplierResponse(**doc_dict))

    return results


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int):
    """
    Obtiene un proveedor por su ID.

    Devuelve 404 si no existe.
    """
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    doc_dict = dict(doc)
    doc_dict["id"] = supplier_id
    return SupplierResponse(**doc_dict)


@router.patch("/{supplier_id}/rate", response_model=SupplierResponse)
async def update_supplier_rate(supplier_id: int, payload: SupplierUpdateRate):
    """
    Actualiza la tarifa de un proveedor.

    - Registra automáticamente el timestamp en updated_at.
    - Rechaza valores <= 0 con 422 (validación Pydantic).
    - Devuelve 404 si el proveedor no existe.
    """
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    now = generate_timestamp()
    suppliers_table.update(
        {"rate_per_shipment": payload.rate_per_shipment, "updated_at": now},
        doc_ids=[supplier_id],
    )

    updated = suppliers_table.get(doc_id=supplier_id)
    updated_dict = dict(updated)
    updated_dict["id"] = supplier_id
    return SupplierResponse(**updated_dict)


@router.patch("/{supplier_id}/status", response_model=SupplierResponse)
async def update_supplier_status(supplier_id: int, payload: SupplierUpdateStatus):
    """
    Actualiza el estado de un proveedor (active/suspended).

    - Rechaza valores no permitidos con 422 (validación Pydantic + Enum).
    - Devuelve 404 si el proveedor no existe.
    """
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    now = generate_timestamp()
    suppliers_table.update(
        {"status": payload.status.value, "updated_at": now},
        doc_ids=[supplier_id],
    )

    updated = suppliers_table.get(doc_id=supplier_id)
    updated_dict = dict(updated)
    updated_dict["id"] = supplier_id
    return SupplierResponse(**updated_dict)


@router.delete("/{supplier_id}", status_code=200)
async def delete_supplier(supplier_id: int):
    """
    Elimina un proveedor por su ID.

    Devuelve 404 si no existe.
    """
    doc = suppliers_table.get(doc_id=supplier_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    suppliers_table.remove(doc_ids=[supplier_id])
    return {"message": "Proveedor eliminado correctamente", "id": supplier_id}