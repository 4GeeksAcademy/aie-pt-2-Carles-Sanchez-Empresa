"""
_core.py — Lógica compartida de validación, métricas y generación de CSV.

Re-exportada públicamente desde analyzer/__init__.py.
NUNCA imprime, registra ni exporta customer_email a nivel individual.
"""

import csv
import io
import re
from collections import Counter
from typing import Any

# ──────────────────────────── Constantes ────────────────────────────

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


# ──────────────────────────── Validación ────────────────────────────

def validate_record(row: dict[str, Any]) -> list[str]:
    """
    Devuelve una lista con las reglas que incumple el registro.
    Si la lista está vacía, el registro es válido.
    """
    failures: list[str] = []

    # 1. country: vacío o distinto de US/ES
    country = (row.get("country") or "").strip()
    if country not in VALID_COUNTRIES:
        failures.append("country_invalid")

    # 2. carrier: vacío, desconocido o no opera en el país declarado
    carrier = (row.get("carrier") or "").strip()
    if not carrier:
        failures.append("carrier_invalid")
    elif country in VALID_COUNTRIES:
        valid_carriers = CARRIERS_BY_COUNTRY.get(country, set())
        if carrier not in valid_carriers:
            failures.append("carrier_invalid")
    else:
        # país ya inválido: comprobamos contra todos los carriers conocidos
        all_carriers = set.union(*CARRIERS_BY_COUNTRY.values())
        if carrier not in all_carriers:
            failures.append("carrier_invalid")

    # 3. tracking_number: vacío o menos de 8 caracteres
    tracking = (row.get("tracking_number") or "").strip()
    if len(tracking) < 8:
        failures.append("tracking_invalid")

    # 4. category: vacía o fuera de las 5 categorías válidas
    category = (row.get("category") or "").strip()
    if category not in VALID_CATEGORIES:
        failures.append("category_invalid")

    # 5. description: vacía o menos de 5 caracteres
    description = (row.get("description") or "").strip()
    if len(description) < 5:
        failures.append("description_invalid")

    # 6. customer_email: vacío o sin formato correcto
    email = (row.get("customer_email") or "").strip()
    if not email or not EMAIL_RE.match(email):
        failures.append("email_invalid")

    # 7. status / satisfaction_score
    status = (row.get("status") or "").strip()
    raw_score = (row.get("satisfaction_score") or "").strip()

    if status == "CLOSED" and (not raw_score):
        failures.append("closed_no_score")

    if raw_score:
        try:
            score = int(raw_score)
            if score < 1 or score > 5:
                failures.append("score_out_of_range")
        except ValueError:
            failures.append("score_out_of_range")

    return failures


# ──────────────────────────── Métricas ────────────────────────────

def compute_metrics(valid_rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Calcula métricas sobre los registros válidos."""
    category_counts = Counter(r.get("category", "").strip() for r in valid_rows)
    status_counts = Counter(r.get("status", "").strip() for r in valid_rows)
    country_counts = Counter(r.get("country", "").strip() for r in valid_rows)

    closed_scores = []
    for r in valid_rows:
        st = (r.get("status") or "").strip()
        sc = (r.get("satisfaction_score") or "").strip()
        if st == "CLOSED" and sc:
            try:
                closed_scores.append(int(sc))
            except ValueError:
                pass

    avg_satisfaction = sum(closed_scores) / len(closed_scores) if closed_scores else None
    score_distribution = Counter(closed_scores)

    return {
        "category_counts": dict(category_counts),
        "status_counts": dict(status_counts),
        "country_counts": dict(country_counts),
        "avg_satisfaction": avg_satisfaction,
        "closed_with_score_count": len(closed_scores),
        "score_distribution": dict(score_distribution),
    }


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
    rule_details = []
    for rule_key, count in sorted(rule_counter.items(), key=lambda x: -x[1]):
        rule_details.append({
            "rule": rule_key,
            "label": RULE_LABELS.get(rule_key, rule_key),
            "count": count,
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