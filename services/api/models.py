"""
models.py — Modelos ORM SQLModel para inventario (TrackFlow).

Define las tablas de Supabase: SKU, StockEntry y StockExit.
Separado de schemas.py (Pydantic puro) — nunca devolver estos objetos
directamente desde un endpoint.

Archivos relacionados:
  - schemas.py: Schemas Pydantic de request/response
  - pydantic_models.py: Modelos Pydantic de suppliers/incidents (existente, legacy TinyDB)
"""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship


# ════════════════════════════════════════════════════════════
#  SKU (Producto)
# ════════════════════════════════════════════════════════════

class SKU(SQLModel, table=True):
    """Unidad de mantenimiento de stock — producto gestionado por TrackFlow."""

    __tablename__: str = "skus"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(nullable=False)
    sku_code: str = Field(unique=True, nullable=False, index=True)
    client_name: str = Field(nullable=False)
    category: str = Field(nullable=False)
    warehouse: str = Field(nullable=False)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        nullable=False,
    )

    entries: list["StockEntry"] = Relationship(back_populates="sku")
    exits: list["StockExit"] = Relationship(back_populates="sku")


# ════════════════════════════════════════════════════════════
#  StockEntry (Recepción / Entrada)
# ════════════════════════════════════════════════════════════

class StockEntry(SQLModel, table=True):
    """Una recepción de mercancía: envío de una marca cliente a un almacén."""

    __tablename__: str = "stock_entries"

    id: Optional[int] = Field(default=None, primary_key=True)
    sku_id: int = Field(foreign_key="skus.id", ondelete="CASCADE", nullable=False)
    quantity: int = Field(nullable=False)
    reference: str = Field(nullable=False)
    warehouse: str = Field(nullable=False)
    user_uuid: str = Field(nullable=False)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        nullable=False,
    )

    sku: Optional[SKU] = Relationship(back_populates="entries")


# ════════════════════════════════════════════════════════════
#  StockExit (Despacho / Salida)
# ════════════════════════════════════════════════════════════

class StockExit(SQLModel, table=True):
    """Un despacho: unidades que salen del almacén para entrega o pérdida."""

    __tablename__: str = "stock_exits"

    id: Optional[int] = Field(default=None, primary_key=True)
    sku_id: int = Field(foreign_key="skus.id", ondelete="CASCADE", nullable=False)
    quantity: int = Field(nullable=False)
    exit_type: str = Field(nullable=False)
    tracking_number: Optional[str] = Field(default=None, nullable=True)
    warehouse: str = Field(nullable=False)
    user_uuid: str = Field(nullable=False)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        nullable=False,
    )

    sku: Optional[SKU] = Relationship(back_populates="exits")