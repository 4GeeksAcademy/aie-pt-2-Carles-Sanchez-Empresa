"""
_core.py — Lógica compartida de validación, métricas y generación de CSV.

Re-exportada públicamente desde analyzer/__init__.py.
NUNCA imprime, registra ni exporta customer_email a nivel individual.

Las constantes, validate_record() y compute_metrics() viven ahora en
trackflow_shared.legacy para evitar duplicación entre servicios.
"""

import csv
import io
from typing import Any

from trackflow_shared.legacy import (
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


# ──────────────────────────── Pipeline completo ────────────────────────────

# analyze_rows y build_results_csv se importan de trackflow_shared.legacy
# para evitar la duplicación que existía anteriormente (ver O-1).


# ──────────────────────────── Exportación CSV ────────────────────────────

# build_results_csv se importa de trackflow_shared.legacy