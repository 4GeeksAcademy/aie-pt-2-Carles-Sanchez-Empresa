"""
schemas.py — Schemas Pydantic de request/response para inventario (TrackFlow).

Estos schemas están separados de los modelos ORM en models.py.
Ningún endpoint devuelve un objeto SQLModel directamente.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ──────────────────────── Constantes ────────────────────────

VALID_CATEGORIES = {"fashion", "electronics", "cosmetics"}
VALID_WAREHOUSES = {"LA", "ZGZ"}
VALID_EXIT_TYPES = {"dispatch", "loss"}


# ════════════════════════════════════════════════════════════
#  SKU (Product)
# ════════════════════════════════════════════════════════════

class SKUCreate(BaseModel):
    """Request: registrar un nuevo SKU en el inventario."""

    name: str = Field(..., min_length=1, description="Descripción del producto")
    sku_code: str = Field(..., min_length=1, description="Código SKU asignado por el cliente")
    client_name: str = Field(..., min_length=1, description="Marca propietaria del SKU")
    category: str = Field(..., description="Categoría: fashion, electronics, cosmetics")
    warehouse: str = Field(..., description="Almacén: LA (Los Ángeles) o ZGZ (Zaragoza)")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Categoría no válida. Debe ser una de: {', '.join(sorted(VALID_CATEGORIES))}")
        return v

    @field_validator("warehouse")
    @classmethod
    def validate_warehouse(cls, v: str) -> str:
        if v not in VALID_WAREHOUSES:
            raise ValueError(f"Almacén no válido. Debe ser LA o ZGZ")
        return v


class SKUResponse(BaseModel):
    """Response: detalle de un SKU con su stock actual calculado."""

    id: int = Field(..., description="Identificador único del SKU")
    name: str = Field(..., description="Descripción del producto")
    sku_code: str = Field(..., description="Código SKU asignado por el cliente")
    client_name: str = Field(..., description="Marca propietaria del SKU")
    category: str = Field(..., description="Categoría del producto")
    warehouse: str = Field(..., description="Almacén donde se ubica")
    current_stock: int = Field(..., description="Stock actual calculado (entradas - salidas)")
    created_at: str = Field(..., description="Timestamp ISO 8601 de creación")


# ════════════════════════════════════════════════════════════
#  StockEntry (Inbound Order)
# ════════════════════════════════════════════════════════════

class StockEntryCreate(BaseModel):
    """Request: registrar una recepción de mercancía."""

    sku_id: int = Field(..., gt=0, description="ID del SKU recibido")
    quantity: int = Field(..., gt=0, description="Unidades recibidas")
    reference: str = Field(..., min_length=1, description="Referencia de despacho del cliente")
    warehouse: str = Field(..., description="Almacén receptor: LA o ZGZ")

    @field_validator("warehouse")
    @classmethod
    def validate_warehouse(cls, v: str) -> str:
        if v not in VALID_WAREHOUSES:
            raise ValueError(f"Almacén no válido. Debe ser LA o ZGZ")
        return v


class StockEntryResponse(BaseModel):
    """Response: detalle de una recepción de mercancía."""

    id: int = Field(..., description="Identificador único de la entrada")
    sku_id: int = Field(..., description="ID del SKU recibido")
    quantity: int = Field(..., description="Unidades recibidas")
    reference: str = Field(..., description="Referencia de despacho del cliente")
    warehouse: str = Field(..., description="Almacén receptor")
    user_uuid: str = Field(..., description="UUID del operario que confirmó")
    created_at: str = Field(..., description="Timestamp ISO 8601 de creación")


# ════════════════════════════════════════════════════════════
#  StockExit (Outbound Order)
# ════════════════════════════════════════════════════════════

class StockExitCreate(BaseModel):
    """Request: registrar un despacho o pérdida de mercancía."""

    sku_id: int = Field(..., gt=0, description="ID del SKU despachado")
    quantity: int = Field(..., gt=0, description="Unidades despachadas o dadas de baja")
    exit_type: str = Field(..., description="Tipo: dispatch (envío) o loss (pérdida)")
    tracking_number: Optional[str] = Field(None, description="Nº seguimiento (obligatorio si dispatch, nulo si loss)")
    warehouse: str = Field(..., description="Almacén de salida: LA o ZGZ")

    @field_validator("exit_type")
    @classmethod
    def validate_exit_type(cls, v: str) -> str:
        if v not in VALID_EXIT_TYPES:
            raise ValueError(f"Tipo de salida no válido. Debe ser dispatch o loss")
        return v

    @field_validator("warehouse")
    @classmethod
    def validate_warehouse(cls, v: str) -> str:
        if v not in VALID_WAREHOUSES:
            raise ValueError(f"Almacén no válido. Debe ser LA o ZGZ")
        return v


class StockExitResponse(BaseModel):
    """Response: detalle de un despacho o pérdida."""

    id: int = Field(..., description="Identificador único de la salida")
    sku_id: int = Field(..., description="ID del SKU despachado")
    quantity: int = Field(..., description="Unidades despachadas o dadas de baja")
    exit_type: str = Field(..., description="Tipo: dispatch o loss")
    tracking_number: Optional[str] = Field(None, description="Nº seguimiento del transportista")
    warehouse: str = Field(..., description="Almacén de salida")
    user_uuid: str = Field(..., description="UUID del coordinador que autorizó")
    created_at: str = Field(..., description="Timestamp ISO 8601 de creación")


# ════════════════════════════════════════════════════════════
#  Órdenes combinadas (para listar movimientos)
# ════════════════════════════════════════════════════════════

class MovementResponse(BaseModel):
    """Response: un movimiento de stock (entrada o salida) con datos del SKU."""

    id: int
    type: str = Field(..., description="Tipo: inbound o outbound")
    sku_id: int
    sku_name: str = Field(..., description="Nombre del producto")
    sku_code: str = Field(..., description="Código SKU")
    quantity: int
    warehouse: str
    user_uuid: str
    reference_or_exit: Optional[str] = Field(None, description="Reference (inbound) o exit_type (outbound)")
    tracking_number: Optional[str] = None
    created_at: str