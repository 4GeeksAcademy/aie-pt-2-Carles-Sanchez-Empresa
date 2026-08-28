"""
analyzer — Módulo reutilizable de validación y análisis de incidencias TrackFlow.

Uso:
    from analyzer import validate_record, compute_metrics, analyze_csv, build_results_csv

Claves de reglas de validación:
    - country_invalid
    - carrier_invalid
    - tracking_invalid
    - category_invalid
    - description_invalid
    - email_invalid
    - closed_no_score
    - score_out_of_range
"""

from ._core import (
    VALID_COUNTRIES,
    CARRIERS_BY_COUNTRY,
    VALID_CATEGORIES,
    EMAIL_RE,
    RULE_LABELS,
    validate_record,
    compute_metrics,
    analyze_rows,
    build_results_csv,
)

__all__ = [
    "VALID_COUNTRIES",
    "CARRIERS_BY_COUNTRY",
    "VALID_CATEGORIES",
    "EMAIL_RE",
    "RULE_LABELS",
    "validate_record",
    "compute_metrics",
    "analyze_rows",
    "build_results_csv",
]