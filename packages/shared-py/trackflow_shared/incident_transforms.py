"""
incident_transforms.py — Transformaciones CSV → modelo para el seed.

Proporciona los mapas de estado, categoría y sede, y la función
transform_csv_row() que convierte una fila del CSV legacy en un
diccionario listo para insertar en TinyDB.
"""

from datetime import datetime, timezone
from typing import Any


# ──────────────────── Mapas de transformación ────────────────────

STATUS_MAP: dict[str, str] = {
    "OPEN": "open",
    "CLOSED": "resolved",
    "DISCARDED": "discarded",
}

CATEGORY_MAP: dict[str, str] = {
    "LOST_PARCEL": "lost_parcel",
    "DELAYED_DELIVERY": "carrier_issue",
    "WRONG_ADDRESS": "delivery_failure",
    "RETURN_REQUEST": "returns_issue",
    "DAMAGE": "carrier_issue",
}

BRANCH_MAP: dict[str, str] = {
    "US": "la_office",
    "ES": "zaragoza_office",
}


# ──────────────────── Función de transformación ────────────────────

def transform_csv_row(row: dict[str, Any]) -> dict[str, Any] | None:
    """
    Convierte una fila del CSV legacy en un dict para el modelo de incidencias.

    Aplica las transformaciones:
      - description → title (primeros 120 chars)
      - description → description (copia literal)
      - date → created_at (YYYY-MM-DD → ISO UTC)
      - status → mapeo OPEN/CLOSED/DISCARDED → open/resolved/discarded
      - category → mapeo a categorías TrackFlow
      - country → branch
      - origin → siempre "customer"

    Args:
        row: Fila del CSV (dict con claves del analizador legacy).

    Returns:
        Dict listo para insertar, o None si no se puede transformar.
    """
    description_raw = (row.get("description") or "").strip()

    # ── title: primeros 120 chars ──
    title = description_raw[:120].strip()
    if not title:
        return None

    # ── description: copia literal ──
    description = description_raw

    # ── category ──
    csv_category = (row.get("category") or "").strip().upper()
    category = CATEGORY_MAP.get(csv_category)
    if not category:
        return None

    # ── status ──
    csv_status = (row.get("status") or "").strip().upper()
    status = STATUS_MAP.get(csv_status)
    if not status:
        return None

    # ── branch ──
    csv_country = (row.get("country") or "").strip().upper()
    branch = BRANCH_MAP.get(csv_country)
    if not branch:
        return None

    # ── created_at: parsear YYYY-MM-DD → ISO UTC midnight ──
    date_raw = (row.get("date") or "").strip()
    try:
        dt = datetime.strptime(date_raw, "%Y-%m-%d")
        created_at = dt.replace(tzinfo=timezone.utc).isoformat()
    except (ValueError, TypeError):
        created_at = datetime.now(timezone.utc).isoformat()

    updated_at = created_at

    # ── incident_id para idempotencia ──
    incident_id = (row.get("incident_id") or "").strip()

    return {
        "csv_incident_id": incident_id,
        "title": title,
        "description": description,
        "category": category,
        "status": status,
        "origin": "customer",
        "branch": branch,
        "created_at": created_at,
        "updated_at": updated_at,
    }