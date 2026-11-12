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
from uuid import uuid4
from typing import Optional

from sqlalchemy import CheckConstraint, Column, DateTime, Index, JSON, UniqueConstraint, Uuid
from sqlalchemy.dialects.postgresql import JSONB
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
    threshold_min: Optional[int] = Field(default=10, nullable=True)
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


# ════════════════════════════════════════════════════════════
#  TelemetryEventRegistro (Telemetry Events)
# ════════════════════════════════════════════════════════════

class TelemetryEventRecord(SQLModel, table=True):
    """
    Evento de telemetría persistido. Tabla append-only.
    
    Las columnas fijas (event_type, timestamp, service) sostienen
    las consultas analíticas. La columna tags (JSONB) guarda el
    objeto properties filtrado por allowlist.
    
    Los eventos son inmutables — nunca se actualizan ni eliminan.
    """
    __tablename__ = "telemetry_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: str = Field(unique=True, nullable=False, index=True)  # UUID v4 del envelope
    timestamp: str = Field(nullable=False)  # ISO 8601 del envelope
    event_type: str = Field(nullable=False)  # Taxonomía entity_action
    session_id: str = Field(nullable=False)  # UUID v4 de sesión
    user_id: str = Field(nullable=False)  # UUID o "anonymous"
    service: str = Field(nullable=False)  # Derivado de event_type (category)
    tags: dict = Field(sa_column=Column(JSONB, nullable=False))  # Properties filtradas por allowlist
    
    __table_args__ = (
        Index("ix_telemetry_timestamp", "timestamp"),
        Index("ix_telemetry_event_type", "event_type"),
        Index("ix_telemetry_tags_gin", "tags", postgresql_using="gin"),
    )


class TaskFailure(SQLModel, table=True):
    """Registro persistente de tareas que agotaron sus reintentos (DLQ)."""

    __tablename__ = "celery_task_failures"

    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: str = Field(index=True, nullable=False)
    task_name: str = Field(nullable=False)
    attempt: int = Field(nullable=False)
    error_message: str = Field(nullable=False)
    failed_at: str = Field(nullable=False)


# ════════════════════════════════════════════════════════════
#  TrackFlow RFP intake (Parte 1)
# ════════════════════════════════════════════════════════════

_JSONB = JSON().with_variant(JSONB, "postgresql")


class RfpTicket(SQLModel, table=True):
    """Ticket de recepción. El estado de negocio no se mezcla con Celery."""

    __tablename__ = "rfp_tickets"
    __table_args__ = (
        CheckConstraint(
            "status IN ('analizando', 'descartado', 'archived', 'returned_to_client', 'analisis_completo', 'generando_borrador', 'en_evaluación', 'needs_human_review', 'waiting_for_approval', 'done')",
            name="ck_rfp_tickets_part1_status",
        ),
        Index("ix_rfp_tickets_status_created_at", "status", "created_at"),
    )

    ticket_id: str = Field(default_factory=lambda: str(uuid4()), sa_type=Uuid(as_uuid=False), primary_key=True)
    rfp_id: str = Field(default_factory=lambda: str(uuid4()), sa_type=Uuid(as_uuid=False), unique=True, index=True, nullable=False)
    status: str = Field(default="analizando", nullable=False, index=True)
    raw_pdf_path: str = Field(nullable=False)
    markdown_path: Optional[str] = Field(default=None, nullable=True)
    created_by_user_id: Optional[str] = Field(default=None, nullable=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True), nullable=False)

    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True), nullable=False)

    # Operación/reintentos: no alteran el estado de negocio requerido en Parte 1.
    celery_task_id: Optional[str] = Field(default=None, nullable=True, unique=True)
    retry_count: int = Field(default=0, nullable=False)
    last_error: Optional[str] = Field(default=None, nullable=True)
    failed_at: Optional[datetime] = Field(default=None, sa_type=DateTime(timezone=True), nullable=True)

    # Contrato durable para Parte 2; solo se completa tras síntesis correcta.
    handoff_schema_version: Optional[str] = Field(default=None, nullable=True)
    handoff_payload: Optional[dict] = Field(default=None, sa_column=Column(_JSONB, nullable=True))
    final_proposal: Optional[str] = Field(default=None, nullable=True)
    final_proposal_created_at: Optional[datetime] = Field(default=None, sa_type=DateTime(timezone=True), nullable=True)
    final_document_path: Optional[str] = Field(default=None, nullable=True)
    human_review_comment: Optional[str] = Field(default=None, nullable=True)
    human_reviewed_by: Optional[str] = Field(default=None, nullable=True)
    human_reviewed_at: Optional[datetime] = Field(default=None, sa_type=DateTime(timezone=True), nullable=True)


class RfpNotificationEvent(SQLModel, table=True):
    """Durable outbox row for the shared RFP SSE feed."""

    __tablename__ = "rfp_notification_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: str = Field(
        foreign_key="rfp_tickets.ticket_id",
        sa_type=Uuid(as_uuid=False),
        unique=True,
        nullable=False,
        index=True,
    )
    payload: dict = Field(sa_type=_JSONB, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True), nullable=False, index=True)


class RfpMetadata(SQLModel, table=True):
    """Metadatos extraídos; valores ausentes permanecen nulos y no se inventan."""

    __tablename__ = "rfp_metadata"
    __table_args__ = (
        CheckConstraint("client_country IS NULL OR client_country IN ('US', 'Spain')", name="ck_rfp_metadata_country"),
        CheckConstraint("currency IS NULL OR currency IN ('USD', 'EUR')", name="ck_rfp_metadata_currency"),
        Index("ix_rfp_metadata_client_country", "client_country"),
    )

    ticket_id: str = Field(foreign_key="rfp_tickets.ticket_id", sa_type=Uuid(as_uuid=False), primary_key=True, ondelete="CASCADE")
    client_name: Optional[str] = Field(default=None, nullable=True)
    client_country: Optional[str] = Field(default=None, nullable=True)
    services_requested: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)
    monthly_volume: Optional[int] = Field(default=None, nullable=True, ge=0)
    deadline: Optional[str] = Field(default=None, nullable=True)
    budget_range: Optional[str] = Field(default=None, nullable=True)
    departments_needed: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)
    unassigned_scope: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)
    currency: Optional[str] = Field(default=None, nullable=True)
    readability_metrics: dict = Field(default_factory=dict, sa_type=_JSONB, nullable=False)
    is_rfp: Optional[bool] = Field(default=None, nullable=True)
    classification_reason: Optional[str] = Field(default=None, nullable=True)
    classification_evidence: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)
    manual_review_required: bool = Field(default=False, nullable=False)
    manual_review_reason: Optional[str] = Field(default=None, nullable=True)
    open_questions: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)


class DepartmentSection(SQLModel, table=True):
    """Aporte Parte 1 de un workstream activo del ticket."""

    __tablename__ = "rfp_department_sections"
    __table_args__ = (
        UniqueConstraint("ticket_id", "department_id", name="uq_rfp_department_section_ticket_department"),
        CheckConstraint(
            "department_id IN ('warehouse', 'lastmile', 'reverse')",
            name="ck_rfp_department_sections_department",
        ),
        Index("ix_rfp_department_sections_ticket", "ticket_id"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: str = Field(foreign_key="rfp_tickets.ticket_id", sa_type=Uuid(as_uuid=False), nullable=False, ondelete="CASCADE")
    department_id: str = Field(nullable=False)
    owner: str = Field(nullable=False)
    relevant_extracts: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)
    key_aspects: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)
    open_questions: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)
    evidence: list[str] = Field(default_factory=list, sa_type=_JSONB, nullable=False)
    draft_content: Optional[str] = Field(default=None, nullable=True)
    evaluation_results: dict = Field(default_factory=dict, sa_type=_JSONB, nullable=False)
    needs_human_review: bool = Field(default=False, nullable=False)
    generation_iterations: int = Field(default=0, nullable=False)
    approval_status: str = Field(default="pending", nullable=False)
    approver_name: Optional[str] = Field(default=None, nullable=True)
    approved_at: Optional[datetime] = Field(default=None, sa_type=DateTime(timezone=True), nullable=True)
    approval_comment: Optional[str] = Field(default=None, nullable=True)
    approval_iteration: int = Field(default=0, nullable=False)
    checkpoint_thread_id: Optional[str] = Field(default=None, nullable=True, unique=True)
    approval_request_id: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True), nullable=False)


class RfpApprovalTrace(SQLModel, table=True):
    """Traza durable de nodos y decisiones del flujo de aprobación Parte 3."""

    __tablename__ = "rfp_approval_traces"

    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: str = Field(foreign_key="rfp_tickets.ticket_id", sa_type=Uuid(as_uuid=False), nullable=False, ondelete="CASCADE", index=True)
    department_id: Optional[str] = Field(default=None, nullable=True)
    node_name: str = Field(nullable=False)
    agent_name: str = Field(nullable=False)
    input_payload: dict = Field(default_factory=dict, sa_type=_JSONB, nullable=False)
    output_payload: dict = Field(default_factory=dict, sa_type=_JSONB, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True), nullable=False)


class RfpNodeTrace(SQLModel, table=True):
    """Per-node execution audit for the complete RFP pipeline."""

    __tablename__ = "rfp_node_traces"

    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: str = Field(foreign_key="rfp_tickets.ticket_id", sa_type=Uuid(as_uuid=False), nullable=False, ondelete="CASCADE", index=True)
    department_id: Optional[str] = Field(default=None, nullable=True)
    node_name: str = Field(nullable=False)
    agent_name: str = Field(nullable=False)
    input_payload: dict = Field(default_factory=dict, sa_type=_JSONB, nullable=False)
    output_payload: dict = Field(default_factory=dict, sa_type=_JSONB, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_type=DateTime(timezone=True), nullable=False)