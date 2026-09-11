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
)


# ──────────────────────────── Pipeline completo ────────────────────────────

def analyze_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Procesa una lista de diccionarios (filas del CSV) y devuelve el resumen
    con el mismo formato que el endpoint JSON.
    """
    total = len(rows)
    rule_counter: dict[str, int] = {}
    valid_rows: list[dict[str, Any]] = []

    for row in rows:
        failures = validate_record(row)
        if failures:
            for rule in failures:
                rule_counter[rule] = rule_counter.get(rule, 0) + 1
        else:
            valid_rows.append(row)

    valid_count = len(valid_rows)
    invalid_count = total - valid_count

    metrics = compute_metrics(valid_rows)

    # Detalle de reglas con etiquetas
    total_invalid = invalid_count
    rule_details = []
    for rule_key, count in sorted(rule_counter.items(), key=lambda x: -x[1]):
        rule_details.append({
            "rule": rule_key,
            "label": RULE_LABELS.get(rule_key, rule_key),
            "count": count,
            "pct": round(count / total_invalid * 100, 2) if total_invalid > 0 else 0.0,
        })

    return {
        "total": total,
        "valid": valid_count,
        "invalid": invalid_count,
        "rules": rule_details,
        "metrics": metrics,
    }


# ──────────────────────────── Exportación CSV ────────────────────────────

def build_results_csv(result: dict[str, Any]) -> str:
    """
    Genera un CSV (como string) a partir del resultado del análisis.

    NOTA: No se exportan correos electrónicos ni datos sensibles.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["metrica", "subcategoria", "valor"])

    writer.writerow(["total_registros", "", result["total"]])
    writer.writerow(["registros_validos", "", result["valid"]])
    writer.writerow(["registros_invalidos", "", result["invalid"]])

    for rd in result["rules"]:
        writer.writerow(["registros_invalidos_por_regla", rd["label"], rd["count"]])

    metrics = result["metrics"]
    for cat, count in sorted(metrics["category_counts"].items(), key=lambda x: -x[1]):
        writer.writerow(["total_por_categoria", cat, count])

    for s in ["OPEN", "CLOSED", "DISCARDED"]:
        count = metrics["status_counts"].get(s, 0)
        writer.writerow(["total_por_estado", s, count])

    for c in ["US", "ES"]:
        count = metrics["country_counts"].get(c, 0)
        writer.writerow(["total_por_pais", c, count])

    if metrics["avg_satisfaction"] is not None:
        writer.writerow([
            "satisfaccion_media",
            "casos_cerrados_con_puntuacion",
            round(metrics["avg_satisfaction"], 2),
        ])
        writer.writerow([
            "satisfaccion_media",
            "numero_registros",
            metrics["closed_with_score_count"],
        ])
        for score in range(1, 6):
            count = metrics["score_distribution"].get(score, 0)
            writer.writerow(["desglose_puntuacion", f"puntuacion_{score}", count])
    else:
        writer.writerow(["satisfaccion_media", "", "N/A"])

    return output.getvalue()