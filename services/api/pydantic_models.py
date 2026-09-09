"""
models.py — Modelos Pydantic para el Directorio de Proveedores (TrackFlow).

Define los esquemas de entrada (SupplierCreate) y salida (SupplierResponse)
con validaciones estrictas según las reglas de negocio.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ──────────────────────────── Enums y constantes ────────────────────────────

class SupplierStatus(str, Enum):
    """Estados permitidos para un proveedor."""
    ACTIVE = "active"
    SUSPENDED = "suspended"


VALID_CATEGORIES: set[str] = {
    "carrier_last_mile",
    "carrier_international",
    "warehouse_supplies",
    "packaging_materials",
    "reverse_logistics",
    "fleet_maintenance",
    "it_and_wms_software",
    "cleaning_and_facilities",
}

VALID_COUNTRIES: set[str] = {"USA", "Spain"}

CURRENCY_BY_COUNTRY: dict[str, str] = {
    "USA": "USD",
    "Spain": "EUR",
}


# ──────────────────────────── Modelo de entrada ────────────────────────────

class SupplierCreate(BaseModel):
    """Esquema para crear un nuevo proveedor. No incluye id ni updated_at."""

    name: str = Field(..., min_length=1, description="Nombre comercial del proveedor")
    country: str = Field(..., description="País del contrato: USA o Spain")
    categories: list[str] = Field(
        ..., min_length=1, description="Lista de categorías de producto/servicio"
    )
    rate_per_shipment: float = Field(
        ..., gt=0, description="Tarifa vigente por envío (> 0)"
    )
    currency: str = Field(..., description="Moneda del contrato: USD para USA, EUR para Spain")
    status: SupplierStatus = Field(..., description="Estado del proveedor: active o suspended")
    service_zone: Optional[str] = Field(None, description="Zona de cobertura (ej: West Coast, Aragón)")
    contact_email: Optional[str] = Field(None, description="Email de contacto")
    notes: Optional[str] = Field(None, description="Observaciones de operaciones")

    # ── Validadores de campo ──

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        if v not in VALID_COUNTRIES:
            raise ValueError(f"País no válido. Debe ser uno de: {', '.join(sorted(VALID_COUNTRIES))}")
        return v

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, v: list[str]) -> list[str]:
        invalid = [c for c in v if c not in VALID_CATEGORIES]
        if invalid:
            raise ValueError(
                f"Categorías no válidas: {', '.join(invalid)}. "
                f"Válidas: {', '.join(sorted(VALID_CATEGORIES))}"
            )
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        if v not in {"USD", "EUR"}:
            raise ValueError("Moneda no válida. Debe ser USD o EUR")
        return v

    @field_validator("rate_per_shipment")
    @classmethod
    def validate_rate(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("La tarifa debe ser un número positivo (> 0)")
        return v

    # ── Validador cruzado: país ↔ moneda ──

    @model_validator(mode="after")
    def validate_country_currency(self) -> "SupplierCreate":
        expected_currency = CURRENCY_BY_COUNTRY.get(self.country)
        if expected_currency and self.currency != expected_currency:
            raise ValueError(
                f"La moneda para {self.country} debe ser {expected_currency}, no {self.currency}"
            )
        return self


# ──────────────────────────── Modelos de respuesta ────────────────────────────

class SupplierResponse(BaseModel):
    """Esquema de respuesta completa de un proveedor. Incluye id y updated_at."""

    id: int = Field(..., description="Identificador único del proveedor")
    name: str = Field(..., description="Nombre comercial del proveedor")
    country: str = Field(..., description="País del contrato")
    categories: list[str] = Field(..., description="Lista de categorías")
    rate_per_shipment: float = Field(..., description="Tarifa vigente por envío")
    currency: str = Field(..., description="Moneda del contrato")
    status: SupplierStatus = Field(..., description="Estado del proveedor")
    service_zone: Optional[str] = Field(None, description="Zona de cobertura")
    contact_email: Optional[str] = Field(None, description="Email de contacto")
    notes: Optional[str] = Field(None, description="Observaciones de operaciones")
    updated_at: str = Field(..., description="Timestamp ISO 8601 de la última actualización")


class SupplierUpdateRate(BaseModel):
    """Esquema para actualizar únicamente la tarifa de un proveedor."""

    rate_per_shipment: float = Field(..., gt=0, description="Nueva tarifa (> 0)")


class SupplierUpdateStatus(BaseModel):
    """Esquema para actualizar únicamente el estado de un proveedor."""

    status: SupplierStatus = Field(..., description="Nuevo estado: active o suspended")


# ──────────────────────────── Helpers ────────────────────────────

def generate_timestamp() -> str:
    """Genera un timestamp ISO 8601 en UTC."""
    return datetime.now(timezone.utc).isoformat()


# ═══════════════════════════════════════════════════════════════════
# MODELOS DEL GESTOR DE INCIDENCIAS
# ═══════════════════════════════════════════════════════════════════

class IncidentCreate(BaseModel):
    """Esquema para crear una nueva incidencia. id, created_at y updated_at se generan automáticamente."""

    title: str = Field(..., min_length=1, description="Título breve de la incidencia")
    description: str = Field(..., min_length=5, description="Descripción detallada")
    category: str = Field(..., description="Categoría de la incidencia")
    status: str = Field(default="open", description="Estado del ciclo de vida")
    origin: str = Field(..., description="Origen del reporte")
    branch: str = Field(..., description="Sede que gestiona o reporta la incidencia")

    @field_validator("description")
    @classmethod
    def validate_description_length(cls, v: str) -> str:
        if len(v.strip()) < 5:
            raise ValueError("La descripción debe tener al menos 5 caracteres")
        return v.strip()

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        from trackflow_shared import IncidentCategory
        valid = set(IncidentCategory._value2member_map_.keys())
        if v not in valid:
            raise ValueError(
                f"Categoría no válida. Debe ser una de: {', '.join(sorted(valid))}"
            )
        return v

    @field_validator("origin")
    @classmethod
    def validate_origin(cls, v: str) -> str:
        from trackflow_shared import IncidentOrigin
        valid = set(IncidentOrigin._value2member_map_.keys())
        if v not in valid:
            raise ValueError(
                f"Origen no válido. Debe ser uno de: {', '.join(sorted(valid))}"
            )
        return v

    @field_validator("branch")
    @classmethod
    def validate_branch(cls, v: str) -> str:
        from trackflow_shared import IncidentBranch
        valid = set(IncidentBranch._value2member_map_.keys())
        if v not in valid:
            raise ValueError(
                f"Sede no válida. Debe ser una de: {', '.join(sorted(valid))}"
            )
        return v


class IncidentResponse(BaseModel):
    """Esquema de respuesta completa de una incidencia."""

    id: int = Field(..., description="Identificador único de la incidencia")
    title: str = Field(..., description="Título breve de la incidencia")
    description: str = Field(..., description="Descripción detallada")
    category: str = Field(..., description="Categoría de la incidencia")
    status: str = Field(..., description="Estado del ciclo de vida")
    origin: str = Field(..., description="Origen del reporte")
    branch: str = Field(..., description="Sede que gestiona o reporta la incidencia")
    created_at: str = Field(..., description="Fecha y hora de creación (ISO 8601)")
    updated_at: str = Field(..., description="Fecha y hora de última modificación (ISO 8601)")


class IncidentListItem(BaseModel):
    """Esquema ligero para listado de incidencias — sin description ni updated_at."""

    id: int = Field(..., description="Identificador único de la incidencia")
    title: str = Field(..., description="Título breve de la incidencia")
    category: str = Field(..., description="Categoría de la incidencia")
    status: str = Field(..., description="Estado del ciclo de vida")
    origin: str = Field(..., description="Origen del reporte")
    branch: str = Field(..., description="Sede que gestiona o reporta la incidencia")
    created_at: str = Field(..., description="Fecha y hora de creación (ISO 8601)")


class IncidentStatusUpdate(BaseModel):
    """Esquema para actualizar únicamente el estado de una incidencia."""

    status: str = Field(..., description="Nuevo estado de la incidencia")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        from trackflow_shared import IncidentStatus
        valid = set(IncidentStatus._value2member_map_.keys())
        if v not in valid:
            raise ValueError(
                f"Estado no válido. Debe ser uno de: {', '.join(sorted(valid))}"
            )
        return v


# ═══════════════════════════════════════════════════════════════════
# MODELOS COMPARTIDOS DE RESPUESTA (multi-dominio)
# ═══════════════════════════════════════════════════════════════════

class ProfileResponse(BaseModel):
    """Esquema de respuesta del perfil de usuario."""

    id: int = Field(..., description="Identificador único del perfil")
    user_id: int = Field(..., description="ID del usuario al que pertenece")
    name: str = Field(..., description="Nombre visible del usuario")
    phone: str = Field(..., description="Teléfono de contacto")
    address: str = Field(..., description="Dirección postal")
    created_at: str = Field(..., description="Timestamp ISO 8601 de creación")
    updated_at: str = Field(..., description="Timestamp ISO 8601 de última modificación")


class MessageResponse(BaseModel):
    """Respuesta genérica con un mensaje informativo."""

    message: str = Field(..., description="Mensaje informativo para el cliente")


class DeleteResponse(BaseModel):
    """Respuesta para operaciones de eliminación."""

    message: str = Field(..., description="Mensaje informativo")
    id: int = Field(..., description="Identificador del recurso eliminado")


# ═══════════════════════════════════════════════════════════════════
# MODELOS DEL ANALIZADOR DE INCIDENCIAS (CSV)
# ═══════════════════════════════════════════════════════════════════

class RuleDetail(BaseModel):
    """Detalle de una regla de validación incumplida."""

    rule: str = Field(..., description="Identificador interno de la regla")
    label: str = Field(..., description="Etiqueta legible de la regla")
    count: int = Field(..., description="Número de registros que incumplen esta regla")
    pct: float = Field(..., description="Porcentaje sobre el total de inválidos")


class MetricsData(BaseModel):
    """Métricas calculadas sobre los registros válidos del CSV."""

    category_counts: dict[str, int] = Field(..., description="Conteo por categoría")
    category_pcts: dict[str, float] = Field(..., description="Porcentaje por categoría")
    status_counts: dict[str, int] = Field(..., description="Conteo por estado")
    status_pcts: dict[str, float] = Field(..., description="Porcentaje por estado")
    country_counts: dict[str, int] = Field(..., description="Conteo por país")
    country_pcts: dict[str, float] = Field(..., description="Porcentaje por país")
    avg_satisfaction: float | None = Field(None, description="Satisfacción media (casos cerrados con puntuación)")
    closed_with_score_count: int = Field(..., description="Nº de casos cerrados con puntuación")
    score_distribution: dict[str, int] = Field(..., description="Distribución de puntuaciones (1-5)")
    score_pcts: dict[str, float] = Field(..., description="Porcentaje por puntuación")


class AnalyzeResponse(BaseModel):
    """Respuesta completa del análisis de incidencias CSV."""

    total: int = Field(..., description="Total de registros procesados")
    valid: int = Field(..., description="Registros válidos (sin errores)")
    invalid: int = Field(..., description="Registros inválidos (con al menos un error)")
    rules: list[RuleDetail] = Field(..., description="Desglose de reglas incumplidas")
    metrics: MetricsData = Field(..., description="Métricas calculadas")


# ═══════════════════════════════════════════════════════════════════
# MODELOS DEL GESTOR DE INCIDENCIAS — Summary
# ═══════════════════════════════════════════════════════════════════

class IncidentSummaryResponse(BaseModel):
    """Métricas agregadas de todas las incidencias."""

    total: int = Field(..., description="Total de incidencias registradas")
    by_status: dict[str, int] = Field(..., description="Agrupación por estado")
    by_category: dict[str, int] = Field(..., description="Agrupación por categoría")
    by_origin: dict[str, int] = Field(..., description="Agrupación por origen")
    by_branch: dict[str, int] = Field(..., description="Agrupación por sede")


# ═══════════════════════════════════════════════════════════════════
# HELPER — Conversión de documentos TinyDB
# ═══════════════════════════════════════════════════════════════════

def doc_to_response(doc: dict, doc_id: int) -> dict:
    """Convierte un documento TinyDB al formato esperado por IncidentResponse."""
    return {
        "id": doc_id,
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "category": doc.get("category", ""),
        "status": doc.get("status", "open"),
        "origin": doc.get("origin", ""),
        "branch": doc.get("branch", ""),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }