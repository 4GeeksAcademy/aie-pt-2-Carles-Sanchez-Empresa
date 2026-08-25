"""
constants.py — Constantes del analizador CSV original (legacy).

Migradas desde services/api/analyzer/_core.py a packages/shared-py/
para su reutilización sin duplicación.
"""

import re

VALID_COUNTRIES: set[str] = {"US", "ES"}
CARRIERS_BY_COUNTRY: dict[str, set[str]] = {
    "US": {"UPS", "FEDEX", "DHL_US"},
    "ES": {"MRW", "SEUR", "DHL_ES", "LOCAL_ES"},
}
VALID_CATEGORIES: set[str] = {"LOST_PARCEL", "DELAYED_DELIVERY", "WRONG_ADDRESS", "RETURN_REQUEST", "DAMAGE"}
EMAIL_RE: re.Pattern = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

RULE_LABELS: dict[str, str] = {
    "country_invalid": "País faltante o inválido",
    "carrier_invalid": "Carrier faltante o inválido para el país",
    "tracking_invalid": "Tracking number faltante o < 8 caracteres",
    "category_invalid": "Categoría faltante o inválida",
    "description_invalid": "Descripción vacía o < 5 caracteres",
    "email_invalid": "Email faltante o inválido",
    "closed_no_score": "Status CLOSED sin satisfaction_score",
    "score_out_of_range": "satisfaction_score fuera de rango 1-5",
}