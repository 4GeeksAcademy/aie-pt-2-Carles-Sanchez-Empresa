#!/usr/bin/env python3
"""
analyze.py — Analizador de incidencias TrackFlow.

Uso:
    python analyze.py incidents-trackflow.csv

Analiza un CSV de incidencias, detecta registros inválidos según reglas de negocio,
calcula métricas sobre los válidos y ofrece exportar resultados a CSV.

El campo customer_email contiene datos sensibles y NUNCA se imprime,
registra ni exporta a nivel individual.
"""

import sys
import os
import csv
import re
from collections import Counter

# ──────────────────────────── Constantes ────────────────────────────

VALID_COUNTRIES = {"US", "ES"}
CARRIERS_BY_COUNTRY = {
    "US": {"UPS", "FEDEX", "DHL_US"},
    "ES": {"MRW", "SEUR", "DHL_ES", "LOCAL_ES"},
}
VALID_CATEGORIES = {"LOST_PARCEL", "DELAYED_DELIVERY", "WRONG_ADDRESS", "RETURN_REQUEST", "DAMAGE"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

RULE_LABELS = {
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

def validate_record(row: dict) -> list[str]:
    """
    Devuelve una lista con las reglas que incumple el registro.
    Si la lista está vacía, el registro es válido.
    """
    failures = []

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

    # 6. customer_email: vacío o sin formato correcto (debe contener @)
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

def compute_metrics(valid_rows: list[dict]) -> dict:
    """Calcula métricas sobre los registros válidos."""
    category_counts = Counter(r.get("category", "").strip() for r in valid_rows)
    status_counts = Counter(r.get("status", "").strip() for r in valid_rows)
    country_counts = Counter(r.get("country", "").strip() for r in valid_rows)

    # Índice de satisfacción medio (solo CLOSED con puntuación registrada)
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


# ──────────────────────────── Impresión por consola ────────────────────────────

def print_report(total: int, valid: int, invalid: int, rule_counter: dict, metrics: dict) -> None:
    """Imprime el informe formateado en consola con separadores, etiquetas y alineación."""
    sep = "=" * 62
    sub = "-" * 62

    print()
    print(sep)
    print("  INFORME DE ANÁLISIS DE INCIDENCIAS — TRACKFLOW")
    print(sep)
    print()
    print(f"  Total registros procesados:       {total}")
    print(f"  Registros válidos:                {valid}")
    print(f"  Registros inválidos:              {invalid}")
    print()

    if invalid > 0:
        print(sub)
        print("  DETALLE DE REGISTROS INVÁLIDOS")
        print(sub)
        print()
        for rule_key, count in sorted(rule_counter.items(), key=lambda x: -x[1]):
            label = RULE_LABELS.get(rule_key, rule_key)
            print(f"  • {label:<50s} {count:>5d}")
        print()

    print(sub)
    print("  MÉTRICAS SOBRE REGISTROS VÁLIDOS")
    print(sub)
    print()

    print("  Totalización por categoría de incidencia:")
    if metrics["category_counts"]:
        for cat, count in sorted(metrics["category_counts"].items(), key=lambda x: -x[1]):
            print(f"    {cat:<30s} {count:>5d}  ({_pct(count, valid):>5.2f}%)")
    else:
        print("    (sin datos)")
    print()

    print("  Totalización por estado:")
    for s in ["OPEN", "CLOSED", "DISCARDED"]:
        count = metrics['status_counts'].get(s, 0)
        print(f"    {s:<30s} {count:>5d}  ({_pct(count, valid):>5.2f}%)")
    print()

    print("  Totalización por país:")
    for c in ["US", "ES"]:
        count = metrics['country_counts'].get(c, 0)
        print(f"    {c:<30s} {count:>5d}  ({_pct(count, valid):>5.2f}%)")
    print()

    print("  Índice de satisfacción medio (casos cerrados con puntuación):")
    if metrics["avg_satisfaction"] is not None:
        print(f"    Promedio: {metrics['avg_satisfaction']:.2f}  (sobre {metrics['closed_with_score_count']} registros)")
        print()
        print("    Desglose por puntuación:")
        for score in range(1, 6):
            count = metrics["score_distribution"].get(score, 0)
            print(f"     Score {score}: {count:>5d}  ({_pct(count, metrics['closed_with_score_count']):>5.2f}%)")
    else:
        print("    (no hay datos disponibles)")
    print()

    print(sep)
    print()


def _pct(part: int, total: int) -> float:
    """Calcula el porcentaje de 'part' sobre 'total', evitando división entre cero."""
    return (part / total * 100) if total > 0 else 0.0


# ──────────────────────────── Exportación CSV ────────────────────────────

def export_csv(total: int, valid: int, invalid: int, rule_counter: dict, metrics: dict,
               filename: str = "results.csv") -> None:
    """Exporta los resultados a CSV. Una fila por métrica.

    NOTA: No se exportan correos electrónicos ni datos sensibles.
    """
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["metrica", "subcategoria", "valor"])

        writer.writerow(["total_registros", "", total])
        writer.writerow(["registros_validos", "", valid])
        writer.writerow(["registros_invalidos", "", invalid])

        for rule_key, count in sorted(rule_counter.items(), key=lambda x: -x[1]):
            label = RULE_LABELS.get(rule_key, rule_key)
            writer.writerow(["registros_invalidos_por_regla", label, count])

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
                writer.writerow([
                    "desglose_puntuacion",
                    f"puntuacion_{score}",
                    count,
                ])
        else:
            writer.writerow(["satisfaccion_media", "", "N/A"])

    print(f"  → Resultados exportados a: {filename}")


# ──────────────────────────── Main ────────────────────────────

def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python analyze.py <archivo.csv>", file=sys.stderr)
        sys.exit(1)

    filepath = sys.argv[1]

    if not os.path.isfile(filepath):
        print(f"Error: no se encuentra el archivo '{filepath}'", file=sys.stderr)
        sys.exit(1)

    # ── Lectura del CSV ──
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
    except Exception as e:
        print(f"Error al leer el archivo CSV: {e}", file=sys.stderr)
        sys.exit(1)

    if not rows:
        print("El archivo CSV está vacío o solo tiene encabezados.")
        sys.exit(0)

    total = len(rows)
    rule_counter: dict[str, int] = {}
    valid_rows: list[dict] = []

    # ── Validación registro por registro ──
    for row in rows:
        failures = validate_record(row)
        if failures:
            for rule in failures:
                rule_counter[rule] = rule_counter.get(rule, 0) + 1
        else:
            valid_rows.append(row)

    valid_count = len(valid_rows)
    invalid_count = total - valid_count

    # ── Métricas ──
    metrics = compute_metrics(valid_rows)

    # ── Informe por consola ──
    print_report(total, valid_count, invalid_count, rule_counter, metrics)

    # ── Preguntar exportación ──
    try:
        answer = input("¿Desea exportar los resultados a CSV? [y/n]: ").strip().lower()
        if answer == "y":
            export_csv(total, valid_count, invalid_count, rule_counter, metrics)
    except (EOFError, KeyboardInterrupt):
        print()


if __name__ == "__main__":
    main()