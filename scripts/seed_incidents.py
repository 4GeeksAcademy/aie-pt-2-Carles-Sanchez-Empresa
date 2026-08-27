"""
seed_incidents.py — Script de carga inicial de incidencias desde CSV.

Idempotente: comprueba csv_incident_id antes de insertar.
Lee incidents-trackflow.csv, aplica transform_csv_row() y validate_record().
"""

import csv
import os
import sys

# Asegurar que el paquete shared-py es importable
SHARED_PY_PATH = os.path.join(
    os.path.dirname(__file__), "..", "packages", "shared-py"
)
if SHARED_PY_PATH not in sys.path:
    sys.path.insert(0, os.path.abspath(SHARED_PY_PATH))

# Asegurar que services/api es importable (para database.py, models.py)
API_PATH = os.path.join(
    os.path.dirname(__file__), "..", "services", "api"
)
if API_PATH not in sys.path:
    sys.path.insert(0, os.path.abspath(API_PATH))

from trackflow_shared import transform_csv_row
from trackflow_shared.legacy import validate_record
from database import incidents_table, IncidentQuery
from models import generate_timestamp, doc_to_response


CSV_PATH = os.path.join(os.path.dirname(__file__), "incidents-trackflow.csv")


def seed():
    """
    Lee el CSV, transforma cada fila, valida con validate_record()
    e inserta en TinyDB. Es idempotente: no duplica csv_incident_id.
    """
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: No se encuentra el fichero CSV: {CSV_PATH}")
        sys.exit(1)

    with open(CSV_PATH, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    total = len(rows)
    inserted = 0
    invalid = 0
    skipped = 0
    errors: list[dict] = []

    now = generate_timestamp()

    for row in rows:
        # 1. Transformar
        transformed = transform_csv_row(row)

        # 2. Validar con la lógica legacy (analizador CSV original)
        legacy_failures = validate_record(row)
        if legacy_failures:
            invalid += 1
            errors.append({
                "incident_id": row.get("incident_id", "?"),
                "failures": legacy_failures,
            })
            continue

        # 3. Idempotencia: comprobar si ya existe el csv_incident_id
        csv_id = transformed.get("csv_incident_id")
        existing = incidents_table.search(IncidentQuery.csv_incident_id == csv_id)
        if existing:
            skipped += 1
            continue

        # 4. Construir documento e insertar
        doc = {
            "title": transformed["title"],
            "description": transformed["description"],
            "category": transformed["category"],
            "status": transformed["status"],
            "origin": transformed["origin"],
            "branch": transformed["branch"],
            "csv_incident_id": csv_id,
            "created_at": now,
            "updated_at": now,
        }
        incidents_table.insert(doc)
        inserted += 1

    # ── Reporte ──
    print(f"Total filas en CSV:   {total}")
    print(f"Insertadas:           {inserted}")
    print(f"Inválidas (descart.): {invalid}")
    print(f"Duplicadas (omit.):   {skipped}")

    if errors:
        print(f"\nDetalle de registros inválidos ({len(errors)}):")
        for err in errors:
            print(f"  {err['incident_id']}: {', '.join(err['failures'])}")

    if invalid > 0:
        print(f"\n⚠️  Se encontraron {invalid} registro(s) inválido(s). El script termina con código de error.")
        sys.exit(1)


if __name__ == "__main__":
    seed()