"""
incident_validation.py — Validación de incidencias para el gestor centralizado.

Proporciona validate_incident_record() que verifica que un diccionario
con datos de incidencia cumple las reglas del modelo TrackFlow.
"""

from typing import Any

from .incident_enums import (
    IncidentStatus,
    IncidentOrigin,
    IncidentCategory,
    IncidentBranch,
)


# ──────────────────── Transiciones válidas ────────────────────

VALID_TRANSITIONS: dict[str, set[str]] = {
    "open": {"in_progress", "discarded"},
    "in_progress": {"resolved", "discarded"},
    "resolved": set(),
    "discarded": set(),
}


def validate_incident_record(data: dict[str, Any]) -> list[dict[str, str]]:
    """
    Valida un diccionario con datos de incidencia según el modelo TrackFlow.

    Args:
        data: Diccionario con claves del modelo (title, description, category, etc.)

    Returns:
        Lista de errores. Cada error es un dict con "field" y "error".
        Si la lista está vacía, el registro es válido.
    """
    errors: list[dict[str, str]] = []

    # ── title ──
    title = (data.get("title") or "").strip()
    if not title:
        errors.append({"field": "title", "error": "El título es obligatorio."})

    # ── description ──
    description = (data.get("description") or "").strip()
    if not description:
        errors.append({"field": "description", "error": "La descripción es obligatoria."})
    elif len(description) < 5:
        errors.append({"field": "description", "error": "La descripción debe tener al menos 5 caracteres."})

    # ── category ──
    category = (data.get("category") or "").strip()
    if not category:
        errors.append({"field": "category", "error": "La categoría es obligatoria."})
    elif category not in IncidentCategory._value2member_map_:
        valid = ", ".join(sorted(IncidentCategory._value2member_map_.keys()))
        errors.append({
            "field": "category",
            "error": f"La categoría '{category}' no es válida. Debe ser una de: {valid}",
        })

    # ── origin ──
    origin = (data.get("origin") or "").strip()
    if not origin:
        errors.append({"field": "origin", "error": "El origen es obligatorio."})
    elif origin not in IncidentOrigin._value2member_map_:
        valid = ", ".join(sorted(IncidentOrigin._value2member_map_.keys()))
        errors.append({
            "field": "origin",
            "error": f"El origen '{origin}' no es válido. Debe ser uno de: {valid}",
        })

    # ── branch ──
    branch = (data.get("branch") or "").strip()
    if not branch:
        errors.append({"field": "branch", "error": "La sede es obligatoria."})
    elif branch not in IncidentBranch._value2member_map_:
        valid = ", ".join(sorted(IncidentBranch._value2member_map_.keys()))
        errors.append({
            "field": "branch",
            "error": f"La sede '{branch}' no es válida. Debe ser una de: {valid}",
        })

    # ── status ──
    status = (data.get("status") or "").strip()
    if status and status not in IncidentStatus._value2member_map_:
        valid = ", ".join(sorted(IncidentStatus._value2member_map_.keys()))
        errors.append({
            "field": "status",
            "error": f"El estado '{status}' no es válido. Debe ser uno de: {valid}",
        })

    return errors