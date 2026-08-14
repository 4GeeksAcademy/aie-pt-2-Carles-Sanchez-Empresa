#!/usr/bin/env python3
"""
analyze.py — Analizador de incidencias TrackFlow (CLI).

Uso:
    python analyze.py incidents-trackflow.csv

Dependencias:
    Utiliza la lógica compartida del módulo services/api/analyzer/.
    NO duplica constantes, validaciones ni métricas.

El campo customer_email contiene datos sensibles y NUNCA se imprime,
registra ni exporta a nivel individual.
"""

import sys
import os
import csv

# ── Ruta al módulo compartido (services/api/analyzer) ──
_SHARED_DIR = os.path.join(os.path.dirname(__file__), "..", "services", "api")
if _SHARED_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(_SHARED_DIR))

from analyzer import (                                                    # noqa: E402
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



# ──────────────────────────── Impresión por consola ────────────────────────────

def print_report(result: dict) -> None:
    """Imprime el informe formateado en consola."""
    sep = "=" * 62
    sub = "-" * 62

    total = result["total"]
    valid = result["valid"]
    invalid = result["invalid"]
    metrics = result["metrics"]
    rules = result["rules"]

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
        for rd in rules:
            print(f"  • {rd['label']:<50s} {rd['count']:>5d}")
        print()

    print(sub)
    print("  MÉTRICAS SOBRE REGISTROS VÁLIDOS")
    print(sub)
    print()

    print("  Totalización por categoría de incidencia:")
    if metrics["category_counts"]:
        for cat, count in sorted(metrics["category_counts"].items(), key=lambda x: -x[1]):
            print(f"    {cat:<30s} {count:>5d}")
    else:
        print("    (sin datos)")
    print()

    print("  Totalización por estado:")
    for s in ["OPEN", "CLOSED", "DISCARDED"]:
        count = metrics['status_counts'].get(s, 0)
        print(f"    {s:<30s} {count:>5d}")
    print()

    print("  Totalización por país:")
    for c in ["US", "ES"]:
        count = metrics['country_counts'].get(c, 0)
        print(f"    {c:<30s} {count:>5d}")
    print()

    print("  Índice de satisfacción medio (casos cerrados con puntuación):")
    if metrics["avg_satisfaction"] is not None:
        print(f"    Promedio: {metrics['avg_satisfaction']:.2f}  (sobre {metrics['closed_with_score_count']} registros)")
        print()
        print("    Desglose por puntuación:")
        for score in range(1, 6):
            count = metrics["score_distribution"].get(score, 0)
            print(f"     Score {score}: {count:>5d}")
    else:
        print("    (no hay datos disponibles)")
    print()

    print(sep)
    print()


# ──────────────────────────── Exportación CSV ────────────────────────────

def export_csv(result: dict, filename: str = "results.csv") -> None:
    """Exporta los resultados a CSV usando build_results_csv.

    NOTA: No se exportan correos electrónicos ni datos sensibles.
    """
    csv_content = build_results_csv(result)
    with open(filename, "w", encoding="utf-8") as f:
        f.write(csv_content)
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

    # ── Análisis usando la lógica compartida ──
    result = analyze_rows(rows)

    # ── Informe y exportación ──
    print_report(result)
    export_csv(result)


if __name__ == "__main__":
    main()