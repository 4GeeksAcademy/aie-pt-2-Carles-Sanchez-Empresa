"""
incident_enums.py — Enums del modelo de incidencias TrackFlow.

Define los valores permitidos para los campos categorizados del gestor
de incidencias centralizado.
"""

from enum import Enum


class IncidentStatus(str, Enum):
    """Estados del ciclo de vida de una incidencia."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class IncidentOrigin(str, Enum):
    """Origen del reporte de una incidencia."""
    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


class IncidentCategory(str, Enum):
    """Categorías de incidencias definidas por TrackFlow."""
    LOST_PARCEL = "lost_parcel"
    DELIVERY_FAILURE = "delivery_failure"
    INVENTORY_DISCREPANCY = "inventory_discrepancy"
    CARRIER_ISSUE = "carrier_issue"
    RETURNS_ISSUE = "returns_issue"
    WAREHOUSE_INCIDENT = "warehouse_incident"
    SYSTEM_FAILURE = "system_failure"
    CLIENT_COMPLAINT = "client_complaint"
    OTHER = "other"


class IncidentBranch(str, Enum):
    """Sedes de TrackFlow donde se reporta o gestiona una incidencia."""
    CENTRAL = "central"
    LA_WAREHOUSE = "la_warehouse"
    LA_OFFICE = "la_office"
    ZARAGOZA_WAREHOUSE = "zaragoza_warehouse"
    ZARAGOZA_OFFICE = "zaragoza_office"


# ──────────────────── Etiquetas para mostrar en UI ────────────────────

BRANCH_LABELS: dict[str, str] = {
    "central": "Central",
    "la_warehouse": "Los Ángeles — Almacén",
    "la_office": "Los Ángeles — Oficina",
    "zaragoza_warehouse": "Zaragoza — Almacén",
    "zaragoza_office": "Zaragoza — Oficina",
}

CATEGORY_LABELS: dict[str, str] = {
    "lost_parcel": "Paquete extraviado",
    "delivery_failure": "Fallo de entrega",
    "inventory_discrepancy": "Discrepancia de inventario",
    "carrier_issue": "Problema de transportista",
    "returns_issue": "Problema de devolución",
    "warehouse_incident": "Incidente en almacén",
    "system_failure": "Fallo del sistema",
    "client_complaint": "Queja de cliente",
    "other": "Otros",
}

STATUS_LABELS: dict[str, str] = {
    "open": "Abierta",
    "in_progress": "En progreso",
    "resolved": "Resuelta",
    "discarded": "Descartada",
}