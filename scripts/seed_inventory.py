"""
seed_inventory.py — Script de carga inicial de inventario (TrackFlow) en Supabase.

Idempotente: comprueba sku_code antes de insertar para evitar duplicados.
Crea:
  - 6 SKUs de ejemplo (3 en LA, 3 en ZGZ)
  - 6 recepciones (StockEntry)
  - 4 despachos/pérdidas (StockExit)

Uso:
    cd services/api && python ../../scripts/seed_inventory.py
"""

import os
import sys
from datetime import datetime, timezone

# Asegurar que services/api es importable (para database.py, models.py)
API_PATH = os.path.join(os.path.dirname(__file__), "..", "services", "api")
if API_PATH not in sys.path:
    sys.path.insert(0, os.path.abspath(API_PATH))

from database import get_db
from models import SKU, StockEntry, StockExit
from sqlmodel import select


# ──────────────────── Datos de ejemplo ────────────────────

SKUS = [
    # Warehouse LA (Los Ángeles)
    {"name": "Classic T-Shirt", "sku_code": "TSH-LA-001", "client_name": "FashionCorp", "category": "fashion", "warehouse": "LA"},
    {"name": "Denim Jacket", "sku_code": "DNM-LA-002", "client_name": "FashionCorp", "category": "fashion", "warehouse": "LA"},
    {"name": "Wireless Earbuds", "sku_code": "WLS-LA-003", "client_name": "TechWorld", "category": "electronics", "warehouse": "LA"},
    # Warehouse ZGZ (Zaragoza)
    {"name": "Smartphone Case", "sku_code": "SPH-ZGZ-001", "client_name": "TechWorld", "category": "electronics", "warehouse": "ZGZ"},
    {"name": "Lipstick Set", "sku_code": "LPS-ZGZ-002", "client_name": "BeautyLab", "category": "cosmetics", "warehouse": "ZGZ"},
    {"name": "Moisturizer Cream", "sku_code": "MST-ZGZ-003", "client_name": "BeautyLab", "category": "cosmetics", "warehouse": "ZGZ"},
]

# Cada entrada: (sku_code, quantity, reference, warehouse)
ENTRIES = [
    ("TSH-LA-001", 200, "REF-FASHION-001", "LA"),
    ("DNM-LA-002", 80, "REF-FASHION-002", "LA"),
    ("WLS-LA-003", 300, "REF-TECH-001", "LA"),
    ("SPH-ZGZ-001", 500, "REF-TECH-002", "ZGZ"),
    ("LPS-ZGZ-002", 150, "REF-BEAUTY-001", "ZGZ"),
    ("MST-ZGZ-003", 120, "REF-BEAUTY-002", "ZGZ"),
]

# Cada salida: (sku_code, quantity, exit_type, tracking_number, warehouse)
EXITS = [
    ("TSH-LA-001", 30, "dispatch", "TRK-987654-001", "LA"),
    ("WLS-LA-003", 50, "dispatch", "TRK-987654-002", "LA"),
    ("SPH-ZGZ-001", 100, "dispatch", "TRK-987654-003", "ZGZ"),
    ("MST-ZGZ-003", 5, "loss", None, "ZGZ"),  # pérdida en ZGZ
]


def _get_sku_by_code(db, sku_code: str):
    """Busca un SKU por su código."""
    return db.exec(select(SKU).where(SKU.sku_code == sku_code)).first()


def seed():
    """
    Ejecuta la carga inicial de inventario en Supabase.

    Idempotente: si un sku_code ya existe, se salta su creación.
    Las entradas y salidas referencian SKUs por código, no por ID.
    """
    print("=" * 60)
    print("  TrackFlow — Seed de Inventario")
    print("=" * 60)

    db = next(get_db())

    # ── 1. SKUs ──
    print("\n📦 Creando SKUs...")
    skus_created = 0
    skus_skipped = 0
    sku_map = {}  # sku_code -> SKU object

    for sku_data in SKUS:
        existing = _get_sku_by_code(db, sku_data["sku_code"])
        if existing:
            skus_skipped += 1
            sku_map[sku_data["sku_code"]] = existing
            print(f"  ⏭️  {sku_data['sku_code']} — ya existe (id={existing.id})")
            continue

        sku = SKU(**sku_data)
        db.add(sku)
        db.commit()
        db.refresh(sku)
        sku_map[sku_data["sku_code"]] = sku
        skus_created += 1
        print(f"  ✅ {sku.sku_code} — creado (id={sku.id})")

    print(f"\n  SKUs creados: {skus_created}, omitidos: {skus_skipped}")

    # ── 2. Stock Entries ──
    print("\n📥 Creando recepciones (StockEntry)...")
    entries_created = 0
    entries_skipped = 0

    for sku_code, quantity, reference, warehouse in ENTRIES:
        sku = sku_map.get(sku_code)
        if not sku:
            print(f"  ❌ {sku_code} — SKU no encontrado, saltando entrada")
            continue

        # Idempotencia: comprobar por referencia (única por entrada)
        existing_entry = db.exec(
            select(StockEntry).where(StockEntry.reference == reference)
        ).first()
        if existing_entry:
            entries_skipped += 1
            print(f"  ⏭️  {reference} — ya existe (id={existing_entry.id})")
            continue

        entry = StockEntry(
            sku_id=sku.id,
            quantity=quantity,
            reference=reference,
            warehouse=warehouse,
            user_uuid="seed-script",
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        entries_created += 1
        print(f"  ✅ {reference} — {quantity} uds de {sku_code} en {warehouse}")

    print(f"\n  Entradas creadas: {entries_created}, omitidas: {entries_skipped}")

    # ── 3. Stock Exits ──
    print("\n📤 Creando despachos/pérdidas (StockExit)...")
    exits_created = 0
    exits_skipped = 0

    for sku_code, quantity, exit_type, tracking_number, warehouse in EXITS:
        sku = sku_map.get(sku_code)
        if not sku:
            print(f"  ❌ {sku_code} — SKU no encontrado, saltando salida")
            continue

        # Idempotencia: usar tracking_number como identificador único (si existe)
        if tracking_number:
            existing_exit = db.exec(
                select(StockExit).where(StockExit.tracking_number == tracking_number)
            ).first()
            if existing_exit:
                exits_skipped += 1
                print(f"  ⏭️  {tracking_number} — ya existe (id={existing_exit.id})")
                continue

        exit_order = StockExit(
            sku_id=sku.id,
            quantity=quantity,
            exit_type=exit_type,
            tracking_number=tracking_number,
            warehouse=warehouse,
            user_uuid="seed-script",
        )
        db.add(exit_order)
        db.commit()
        db.refresh(exit_order)
        exits_created += 1

        label = "despacho" if exit_type == "dispatch" else "pérdida"
        extra = f" (trk: {tracking_number})" if tracking_number else ""
        print(f"  ✅ {label} — {quantity} uds de {sku_code} en {warehouse}{extra}")

    print(f"\n  Salidas creadas: {exits_created}, omitidas: {exits_skipped}")

    # ── 4. Resumen ──
    print("\n" + "=" * 60)
    print("  📊 Resumen de inventario")
    print("=" * 60)

    for sku_code, sku in sorted(sku_map.items()):
        # Calcular stock
        entries_sum = db.exec(
            select(StockEntry.quantity)
            .where(StockEntry.sku_id == sku.id, StockEntry.warehouse == sku.warehouse)
        ).all()
        exits_sum = db.exec(
            select(StockExit.quantity)
            .where(StockExit.sku_id == sku.id, StockExit.warehouse == sku.warehouse)
        ).all()
        stock = sum(entries_sum) - sum(exits_sum)
        print(f"  {sku.sku_code:20s} | {sku.warehouse:3s} | {sku.category:12s} | stock: {stock:4d}")

    print("\n✅ Seed completado.")
    db.close()


if __name__ == "__main__":
    seed()