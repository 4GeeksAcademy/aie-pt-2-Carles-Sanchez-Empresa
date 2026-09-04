"""
routes/inventory.py — Endpoints de inventario (TrackFlow).

Gestiona SKUs, recepciones (StockEntry) y despachos (StockExit) en Supabase.
Todos los endpoints requieren autenticación JWT (TinyDB).
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select, func

from auth import get_current_user
from database import get_db
from i18n import get_language_from_request, get_translator
from models import SKU, StockEntry, StockExit
from schemas import (
    SKUCreate,
    SKUResponse,
    StockEntryCreate,
    StockEntryResponse,
    StockExitCreate,
    StockExitResponse,
    MovementResponse,
)

router = APIRouter(prefix="/inventory", tags=["Inventory"])


# ════════════════════════════════════════════════════════════
#  Helpers
# ════════════════════════════════════════════════════════════

def _calculate_stock(db: Session, sku_id: int, warehouse: str) -> int:
    """
    Calcula el stock actual de un SKU en un almacén específico.

    current_stock = SUM(StockEntry.quantity) - SUM(StockExit.quantity)
    Filtrado por warehouse para cumplir la regla #6 (stock por almacén).
    """
    entries_sum = db.exec(
        select(func.coalesce(func.sum(StockEntry.quantity), 0))
        .where(StockEntry.sku_id == sku_id, StockEntry.warehouse == warehouse)
    ).one()

    exits_sum = db.exec(
        select(func.coalesce(func.sum(StockExit.quantity), 0))
        .where(StockExit.sku_id == sku_id, StockExit.warehouse == warehouse)
    ).one()

    return entries_sum - exits_sum


def _sku_to_response(sku: SKU, current_stock: int) -> SKUResponse:
    """Convierte un modelo ORM SKU a SKUResponse con stock calculado."""
    return SKUResponse(
        id=sku.id,
        name=sku.name,
        sku_code=sku.sku_code,
        client_name=sku.client_name,
        category=sku.category,
        warehouse=sku.warehouse,
        current_stock=current_stock,
        created_at=sku.created_at,
    )


# ════════════════════════════════════════════════════════════
#  GET /inventory/products — Lista todos los SKUs con stock
# ════════════════════════════════════════════════════════════

@router.get("/products", response_model=list[SKUResponse])
async def list_products(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    warehouse: Annotated[Optional[str], Query(description="Filtrar por almacén (LA, ZGZ)")] = None,
    category: Annotated[Optional[str], Query(description="Filtrar por categoría (fashion, electronics, cosmetics)")] = None,
):
    """
    Lista todos los SKUs con su current_stock calculado por almacén.

    Filtros opcionales: warehouse, category.
    """
    query = select(SKU)
    if warehouse:
        query = query.where(SKU.warehouse == warehouse)
    if category:
        query = query.where(SKU.category == category)

    skus = db.exec(query).all()
    result = []
    for sku in skus:
        stock = _calculate_stock(db, sku.id, sku.warehouse)
        result.append(_sku_to_response(sku, stock))

    return result


# ════════════════════════════════════════════════════════════
#  POST /inventory/products — Crea un nuevo SKU
# ════════════════════════════════════════════════════════════

@router.post("/products", response_model=SKUResponse, status_code=201)
async def create_product(
    payload: SKUCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Registra un nuevo SKU en el inventario.

    Comienza con stock cero. Solo acumula stock mediante StockEntry.
    """
    # Verificar SKU único
    existing = db.exec(select(SKU).where(SKU.sku_code == payload.sku_code)).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"SKU '{payload.sku_code}' ya existe en el almacén {existing.warehouse}",
        )

    # Crear SKU con SQLModel
    sku = SKU(
        name=payload.name,
        sku_code=payload.sku_code,
        client_name=payload.client_name,
        category=payload.category,
        warehouse=payload.warehouse,
    )
    db.add(sku)
    db.commit()
    db.refresh(sku)

    return _sku_to_response(sku, current_stock=0)


# ════════════════════════════════════════════════════════════
#  GET /inventory/products/{id} — Detalle de SKU + stock
# ════════════════════════════════════════════════════════════

@router.get("/products/{id}", response_model=SKUResponse)
async def get_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtiene un SKU por ID con su stock actual calculado.

    Devuelve 404 si no existe.
    """
    sku = db.get(SKU, id)
    if not sku:
        raise HTTPException(status_code=404, detail=f"SKU con id {id} no encontrado")

    stock = _calculate_stock(db, sku.id, sku.warehouse)
    return _sku_to_response(sku, stock)


# ════════════════════════════════════════════════════════════
#  POST /inventory/orders/inbound — Recepción de mercancía
# ════════════════════════════════════════════════════════════

@router.post("/orders/inbound", response_model=StockEntryResponse, status_code=201)
async def create_inbound_order(
    payload: StockEntryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Registra una recepción de mercancía (StockEntry).

    Incrementa el stock del SKU en el almacén especificado.
    """
    # Verificar que el SKU existe
    sku = db.get(SKU, payload.sku_id)
    if not sku:
        raise HTTPException(status_code=404, detail=f"SKU con id {payload.sku_id} no encontrado")

    # El warehouse de la entrada debe coincidir con el del SKU
    if payload.warehouse != sku.warehouse:
        raise HTTPException(
            status_code=400,
            detail=f"El almacén de la entrada ({payload.warehouse}) no coincide con el del SKU ({sku.warehouse})",
        )

    entry = StockEntry(
        sku_id=payload.sku_id,
        quantity=payload.quantity,
        reference=payload.reference,
        warehouse=payload.warehouse,
        user_uuid=str(current_user["id"]),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return StockEntryResponse(
        id=entry.id,
        sku_id=entry.sku_id,
        quantity=entry.quantity,
        reference=entry.reference,
        warehouse=entry.warehouse,
        user_uuid=entry.user_uuid,
        created_at=entry.created_at,
    )


# ════════════════════════════════════════════════════════════
#  POST /inventory/orders/outbound — Despacho o pérdida
# ════════════════════════════════════════════════════════════

@router.post("/orders/outbound", response_model=StockExitResponse, status_code=201)
async def create_outbound_order(
    payload: StockExitCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Registra un despacho (dispatch) o pérdida (loss) de mercancía.

    Valida:
      - SKU existe
      - Stock suficiente en el almacén (HTTP 400 si no)
      - tracking_number obligatorio si dispatch, nulo si loss (HTTP 422 si no)
    """
    # Validación manual de tracking_number según exit_type
    if payload.exit_type == "dispatch" and not payload.tracking_number:
        raise HTTPException(
            status_code=422,
            detail="tracking_number es obligatorio cuando exit_type es 'dispatch'",
        )
    if payload.exit_type == "loss" and payload.tracking_number is not None:
        raise HTTPException(
            status_code=422,
            detail="tracking_number debe ser nulo cuando exit_type es 'loss'",
        )

    # Verificar SKU
    sku = db.get(SKU, payload.sku_id)
    if not sku:
        raise HTTPException(status_code=404, detail=f"SKU con id {payload.sku_id} no encontrado")

    # El warehouse de la salida debe coincidir con el del SKU
    if payload.warehouse != sku.warehouse:
        raise HTTPException(
            status_code=400,
            detail=f"El almacén de la salida ({payload.warehouse}) no coincide con el del SKU ({sku.warehouse})",
        )

    # Calcular stock disponible (regla #2: no negativo)
    available = _calculate_stock(db, sku.id, sku.warehouse)
    if payload.quantity > available:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for SKU '{sku.sku_code}'. Available: {available}, requested: {payload.quantity}.",
        )

    exit_order = StockExit(
        sku_id=payload.sku_id,
        quantity=payload.quantity,
        exit_type=payload.exit_type,
        tracking_number=payload.tracking_number,
        warehouse=payload.warehouse,
        user_uuid=str(current_user["id"]),
    )
    db.add(exit_order)
    db.commit()
    db.refresh(exit_order)

    return StockExitResponse(
        id=exit_order.id,
        sku_id=exit_order.sku_id,
        quantity=exit_order.quantity,
        exit_type=exit_order.exit_type,
        tracking_number=exit_order.tracking_number,
        warehouse=exit_order.warehouse,
        user_uuid=exit_order.user_uuid,
        created_at=exit_order.created_at,
    )


# ════════════════════════════════════════════════════════════
#  GET /inventory/orders — Lista todos los movimientos
# ════════════════════════════════════════════════════════════

@router.get("/orders", response_model=list[MovementResponse])
async def list_orders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    warehouse: Annotated[Optional[str], Query(description="Filtrar por almacén")] = None,
):
    """
    Lista todos los movimientos de stock (entradas y salidas) con datos del SKU.

    NOTA: Actualmente carga los SKUs uno por uno dentro del bucle (N+1).
    Esto es deuda técnica — ver TODO al final de la función.
    """
    movements: list[MovementResponse] = []

    # Entradas
    stmt_entries = select(StockEntry)
    if warehouse:
        stmt_entries = stmt_entries.where(StockEntry.warehouse == warehouse)
    entries = db.exec(stmt_entries).all()

    for e in entries:
        # TODO: N+1 — cargar todos los SKUs en una sola consulta con
        # select(SKU).where(SKU.id.in_([e.sku_id for e in entries]))
        # y construir un dict {sku_id: sku} para lookup O(1).
        sku = db.get(SKU, e.sku_id)
        movements.append(MovementResponse(
            id=e.id,
            type="inbound",
            sku_id=e.sku_id,
            sku_name=sku.name if sku else "Unknown",
            sku_code=sku.sku_code if sku else "Unknown",
            quantity=e.quantity,
            warehouse=e.warehouse,
            user_uuid=e.user_uuid,
            reference_or_exit=e.reference,
            created_at=e.created_at,
        ))

    # Salidas
    stmt_exits = select(StockExit)
    if warehouse:
        stmt_exits = stmt_exits.where(StockExit.warehouse == warehouse)
    exits = db.exec(stmt_exits).all()

    for ex in exits:
        # TODO: Mismo N+1 que en entradas — refactorizar cargando todos
        # los SKU relacionados en una sola consulta anticipada.
        sku = db.get(SKU, ex.sku_id)
        movements.append(MovementResponse(
            id=ex.id,
            type="outbound",
            sku_id=ex.sku_id,
            sku_name=sku.name if sku else "Unknown",
            sku_code=sku.sku_code if sku else "Unknown",
            quantity=ex.quantity,
            warehouse=ex.warehouse,
            user_uuid=ex.user_uuid,
            reference_or_exit=ex.exit_type,
            tracking_number=ex.tracking_number,
            created_at=ex.created_at,
        ))

    # Ordenar por created_at descendente
    movements.sort(key=lambda m: m.created_at, reverse=True)

    return movements