"""
legacy — Constantes y validación del analizador CSV original.

Re-exportado desde packages/shared-py/trackflow_shared/legacy/.
Usado por scripts/analyze.py y services/api/analyzer/.
"""

from .constants import (
    VALID_COUNTRIES,
    CARRIERS_BY_COUNTRY,
    VALID_CATEGORIES,
    EMAIL_RE,
    RULE_LABELS,
)

from .validation import (
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