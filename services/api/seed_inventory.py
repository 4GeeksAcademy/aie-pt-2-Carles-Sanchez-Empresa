#!/usr/bin/env python3
"""
seed_inventory.py — Seeder de inventario inicial en Supabase (TrackFlow).

Carga los datos semilla definidos en el CONTEXT.md:
  - 6 SKUs (productos) en ambos almacenes
  - 4 StockEntries (recepciones)
  - 3 StockExits (despachos y pérdidas)

Ejecutar con:
    cd services/api && python -m seed_inventory
"""

import sys
import os

# Añadir el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
from sqlmodel import Session, select, SQLModel

from database import engine
from models import SKU, StockEntry, StockExit


# ──────────────────────────── Datos semilla ────────────────────────────

SKUS = [
    SKU(
        name="Zapatilla blanca clásica - Talla 42",
        sku_code="CLT-SNK-W-42",
        client_name="PureStep Footwear",
        category="fashion",
        warehouse="LA",
    ),
    SKU(
        name="Zapatilla blanca clásica - Talla 42",
        sku_code="CLT-SNK-W-42-Z",
        client_name="PureStep Footwear",
        category="fashion",
        warehouse="ZGZ",
    ),
    SKU(
        name="Auriculares inalámbricos Pro",
        sku_code="TEC-EAR-001",
        client_name="SoundWave Electronics",
        category="electronics",
        warehouse="LA",
    ),
    SKU(
        name="Sérum facial hidratante 30ml",
        sku_code="CSM-SRM-030",
        client_name="GlowLab Cosmetics",
        category="cosmetics",
        warehouse="ZGZ",
    ),
    SKU(
        name="Chino slim fit - marino 32/32",
        sku_code="CLT-CHN-N-32",
        client_name="UrbanThread",
        category="fashion",
        warehouse="LA",
    ),
    SKU(
        name="Cargador rápido USB-C 65W",
        sku_code="TEC-CHG-065",
        client_name="SoundWave Electronics",
        category="electronics",
        warehouse="ZGZ",
    ),
]

STOCK_ENTRIES_SEED = [
    {
        "sku_code": "CLT-SNK-W-42",
        "quantity": 100,
        "reference": "PO-2024-0098",
        "warehouse": "LA",
        "user_uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    },
    {
        "sku_code": "CLT-SNK-W-42",
        "quantity": 50,
        "reference": "PO-2024-0102",
        "warehouse": "LA",
        "user_uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    },
    {
        "sku_code": "TEC-EAR-001",
        "quantity": 200,
        "reference": "PO-2024-0105",
        "warehouse": "LA",
        "user_uuid": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    },
    {
        "sku_code": "CSM-SRM-030",
        "quantity": 80,
        "reference": "GR-ZGZ-0234",
        "warehouse": "ZGZ",
        "user_uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    },
]

STOCK_EXITS_SEED = [
    {
        "sku_code": "CLT-SNK-W-42",
        "quantity": 30,
        "exit_type": "dispatch",
        "tracking_number": "1Z999AA10123456784",
        "warehouse": "LA",
        "user_uuid": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    },
    {
        "sku_code": "CLT-SNK-W-42",
        "quantity": 5,
        "exit_type": "loss",
        "tracking_number": None,
        "warehouse": "LA",
        "user_uuid": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    },
    {
        "sku_code": "TEC-EAR-001",
        "quantity": 10,
        "exit_type": "dispatch",
        "tracking_number": "1Z999AA20123456789",
        "warehouse": "LA",
        "user_uuid": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    },
]

# Stock esperado tras semilla:
#   CLT-SNK-W-42  (LA): 100 + 50 - 30 - 5 = 115
#   CLT-SNK-W-42-Z (ZGZ): 0 (sin movimientos)
#   TEC-EAR-001   (LA): 200 - 10 = 190
#   CSM-SRM-030   (ZGZ): 80
#   CLT-CHN-N-32  (LA): 0
#   TEC-CHG-065   (ZGZ): 0


def seed():
    """Ejecuta el seed de datos en Supabase."""
    # Crear tablas si no existen
    SQLModel.metadata.create_all(engine)
    print("  ✅ Tablas SQLModel verificadas/creadas en Supabase")
    now = datetime.now(timezone.utc).isoformat()

    with Session(engine) as session:
        # ── SKUs ──
        inserted_skus = 0
        for sku in SKUS:
            existing = session.exec(
                select(SKU).where(SKU.sku_code == sku.sku_code)
            ).first()
            if existing:
                print(f"  ⏭ SKU '{sku.sku_code}' ya existe, omitiendo")
                # Reemplazar con el existente para FK
                sku.id = existing.id
            else:
                session.add(sku)
                session.commit()
                session.refresh(sku)
                inserted_skus += 1
                print(f"  ✅ SKU '{sku.sku_code}' creado (id={sku.id})")

        # Mapa sku_code → id
        sku_map = {}
        all_skus = session.exec(select(SKU)).all()
        for s in all_skus:
            sku_map[s.sku_code] = s.id

        # ── StockEntries ──
        inserted_entries = 0
        for entry_data in STOCK_ENTRIES_SEED:
            sku_id = sku_map.get(entry_data["sku_code"])
            if not sku_id:
                print(f"  ❌ SKU '{entry_data['sku_code']}' no encontrado, omitiendo entrada")
                continue

            entry = StockEntry(
                sku_id=sku_id,
                quantity=entry_data["quantity"],
                reference=entry_data["reference"],
                warehouse=entry_data["warehouse"],
                user_uuid=entry_data["user_uuid"],
            )
            session.add(entry)
            session.commit()
            inserted_entries += 1
            print(f"  ✅ StockEntry: {entry_data['quantity']}x {entry_data['sku_code']} ({entry_data['reference']})")

        # ── StockExits ──
        inserted_exits = 0
        for exit_data in STOCK_EXITS_SEED:
            sku_id = sku_map.get(exit_data["sku_code"])
            if not sku_id:
                print(f"  ❌ SKU '{exit_data['sku_code']}' no encontrado, omitiendo salida")
                continue

            exit_order = StockExit(
                sku_id=sku_id,
                quantity=exit_data["quantity"],
                exit_type=exit_data["exit_type"],
                tracking_number=exit_data["tracking_number"],
                warehouse=exit_data["warehouse"],
                user_uuid=exit_data["user_uuid"],
            )
            session.add(exit_order)
            session.commit()
            inserted_exits += 1
            print(f"  ✅ StockExit: {exit_data['quantity']}x {exit_data['sku_code']} ({exit_data['exit_type']})")

        print(f"\n📊 Resumen: {inserted_skus} SKUs, {inserted_entries} entradas, {inserted_exits} salidas")


if __name__ == "__main__":
    print("🌱 Sembrando datos de inventario en Supabase...")
    seed()
    print("✅ Seed completado.")