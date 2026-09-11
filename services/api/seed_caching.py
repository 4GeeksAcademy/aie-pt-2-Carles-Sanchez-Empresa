#!/usr/bin/env python3
"""
seed_caching.py — Seeder de datos con volumen realista para pruebas de caching.

Puebla Supabase (SKUs, StockEntry, StockExit) y TinyDB (incidencias, proveedores)
con ~50 SKUs, ~200 entradas, ~150 salidas, ~100 incidencias y ~30 proveedores.

Ejecutar con:
    cd services/api && python -m seed_caching

Es idempotente: comprueba si los datos ya existen antes de insertar.
Separa los datos de prueba de los seeders normales (seed.py, seed_inventory.py).
"""

import sys
import os
import random
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select, SQLModel
from database import engine, incidents_table, suppliers_table
from models import SKU, StockEntry, StockExit
from trackflow_shared import (
    IncidentCategory, IncidentOrigin, IncidentBranch, IncidentStatus
)

random.seed(42)

# ═══════════════════════════════════════════════════════════════
#  CONFIGURACIÓN DE VOLUMEN
# ═══════════════════════════════════════════════════════════════

NUM_SKUS = 50
NUM_ENTRIES = 200
NUM_EXITS = 150
NUM_INCIDENTS = 100
NUM_SUPPLIERS = 30

USER_UUIDS = [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "c3d4e5f6-a7b8-9012-cdef-123456789012",
]

# ═══════════════════════════════════════════════════════════════
#  DATOS SEMILLA — SKUs (Productos)
# ═══════════════════════════════════════════════════════════════

FASHION_PRODUCTS = [
    ("Zapatilla blanca clásica - Talla {}", 42, "CLT-SNK-W"),
    ("Mochila urbana impermeable 25L", None, "CLT-BAG-IP"),
    ("Chaqueta vaquera slim fit - Talla {}", "M", "CLT-JKT-DN"),
    ("Camiseta básica algodón orgánico - Talla {}", "L", "CLT-TEE-OC"),
    ("Pantalón cargo beige - Talla {}", 34, "CLT-CRG-BE"),
    ("Vestido midi floral estampado - Talla {}", "S", "CLT-DRS-FL"),
    ("Bufanda de lana merina 180cm", None, "CLT-SCF-MR"),
    ("Guantes de piel con forro térmico - Talla {}", "L", "CLT-GLV-LR"),
    ("Gorra trucker ajustable", None, "CLT-CAP-TR"),
    ("Cinturón de cuero negro 3.5cm - Talla {}", 95, "CLT-BLT-LR"),
    ("Zapatilla running ultraligera - Talla {}", 43, "CLT-RNN-UL"),
    ("Sudadera con capucha básica - Talla {}", "XL", "CLT-HDY-BS"),
    ("Bolso bandolera pequeño", None, "CLT-BAG-SH"),
    ("Polo manga corta - Talla {}", "M", "CLT-PLO-SL"),
    ("Calcetines técnicos pack x3 - Talla {}", "42-45", "CLT-SOC-TP"),
    ("Chino slim fit - marino - Talla {}", "32/32", "CLT-CHN-N"),
    ("Abrigo lana mezcla - Talla {}", "L", "CLT-ABG-LN"),
    ("Pajarita artesanal seda", None, "CLT-BWT-SK"),
]

ELECTRONICS_PRODUCTS = [
    ("Auriculares inalámbricos Pro", None, "TEC-EAR-PRO"),
    ("Cargador rápido USB-C 65W", None, "TEC-CHG-65W"),
    ("Hub USB-C 7 puertos 4K", None, "TEC-HUB-7P"),
    ("Teclado mecánico RGB inalámbrico", None, "TEC-KEY-RGB"),
    ("Ratón ergonómico vertical", None, "TEC-MOU-ERG"),
    ("Monitor portátil 15.6\" FHD", None, "TEC-MON-156"),
    ("Webcam 4K con micrófono array", None, "TEC-WEB-4K"),
    ("Power bank 20000mAh PD 65W", None, "TEC-PBK-20K"),
    ("Cable USB-C a USB-C 2m trenzado", None, "TEC-CBL-2M"),
    ("Base ajustable para portátil", None, "TEC-STD-LAP"),
    ("Altavoz Bluetooth portátil IPX7", None, "TEC-SPK-BT"),
    ("SSD externo 1TB USB-C", None, "TEC-SSD-1TB"),
    ("Adaptador de viaje universal", None, "TEC-ADP-UNV"),
    ("Lámpara LED escritorio USB-C", None, "TEC-LMP-LED"),
    ("Soporte monitor brazo articulado", None, "TEC-ARM-MON"),
]

COSMETICS_PRODUCTS = [
    ("Sérum facial hidratante 30ml", None, "CSM-SRM-030"),
    ("Crema contorno de ojos 15ml", None, "CSM-EYE-015"),
    ("Protector solar SPF50+ 50ml", None, "CSM-SUN-050"),
    ("Champú sólido aromaterapia", None, "CSM-SHM-SL"),
    ("Acondicionador reparador 200ml", None, "CSM-CND-200"),
    ("Mascarilla facial arcilla verde", None, "CSM-MSK-CL"),
    ("Perfume sólido vainilla 10g", None, "CSM-PRF-010"),
    ("Exfoliante corporal azúcar 250g", None, "CSM-EXF-250"),
    ("Bálsamo labial hidratante pack x3", None, "CSM-LBM-P3"),
    ("Aceite corporal seco 100ml", None, "CSM-OIL-100"),
    ("Desodorante natural sin aluminio 50ml", None, "CSM-DEO-050"),
    ("Crema de manos reparadora 75ml", None, "CSM-HND-075"),
    ("Mascarilla capilar keratina 150ml", None, "CSM-HMK-150"),
    ("Agua micelar desmaquillante 200ml", None, "CSM-MCL-200"),
    ("Espuma limpiadora facial 150ml", None, "CSM-CLN-150"),
    ("Tónico facial revitalizante 100ml", None, "CSM-TON-100"),
    ("Set viaje miniaturas 5pz", None, "CSM-TRV-5P"),
]

CLIENT_MAP = {
    "CLT": "PureStep Footwear",
    "TEC": "SoundWave Electronics",
    "CSM": "GlowLab Cosmetics",
}

CATEGORY_MAP = {
    "CLT": "fashion",
    "TEC": "electronics",
    "CSM": "cosmetics",
}

WAREHOUSES = ["LA", "ZGZ"]

# Compañías ficticias para variar clientes
EXTRA_CLIENTS_FASHION = ["UrbanThread", "ModaExpress", "CraftWear Co"]
EXTRA_CLIENTS_ELECTRONICS = ["TechNova", "PixelGear"]
EXTRA_CLIENTS_COSMETICS = ["Belleza Pura", "Natura Labs"]


def build_sku_list() -> list[dict]:
    """Genera ~50 SKUs realistas combinando productos, tallas y almacenes."""
    skus = []
    counter = 1

    def make_sku_code(prefix: str, base: str, warehouse: str, variant: int = 0) -> str:
        wh = "L" if warehouse == "LA" else "Z"
        suffix = f"-{wh}" if variant == 0 else f"-{wh}-{variant}"
        return f"{base}{suffix}"

    # --- FASHION (con tallas) ---
    for name_tpl, size, base_code in FASHION_PRODUCTS:
        for wh in WAREHOUSES:
            client = CLIENT_MAP["CLT"]
            if counter % 4 == 0:
                client = random.choice(EXTRA_CLIENTS_FASHION)

            if size is not None:
                if isinstance(size, int):
                    talla = size + (counter % 5 - 2)
                    name = name_tpl.format(talla)
                else:
                    name = name_tpl.format(size)
            else:
                name = name_tpl

            # Algunos productos en ambos almacenes con código distinto
            if wh == "ZGZ" and counter % 3 != 0:
                continue  # no todos los productos en ZGZ

            code = make_sku_code("CLT", base_code, wh)

            skus.append({
                "name": name,
                "sku_code": code,
                "client_name": client,
                "category": "fashion",
                "warehouse": wh,
            })
            counter += 1

    # --- ELECTRONICS ---
    for name, size, base_code in ELECTRONICS_PRODUCTS:
        for wh in WAREHOUSES:
            client = CLIENT_MAP["TEC"]
            if counter % 5 == 0:
                client = random.choice(EXTRA_CLIENTS_ELECTRONICS)

            code = make_sku_code("TEC", base_code, wh)
            skus.append({
                "name": name,
                "sku_code": code,
                "client_name": client,
                "category": "electronics",
                "warehouse": wh,
            })
            counter += 1

    # --- COSMETICS ---
    for name, size, base_code in COSMETICS_PRODUCTS:
        for wh in WAREHOUSES:
            client = CLIENT_MAP["CSM"]
            if counter % 6 == 0:
                client = random.choice(EXTRA_CLIENTS_COSMETICS)

            code = make_sku_code("CSM", base_code, wh)
            skus.append({
                "name": name,
                "sku_code": code,
                "client_name": client,
                "category": "cosmetics",
                "warehouse": wh,
            })
            counter += 1

    # Limitar a NUM_SKUS y asegurar variedad
    random.shuffle(skus)
    return skus[:NUM_SKUS]


def build_entries(sku_ids: list[int]) -> list[dict]:
    """Genera ~200 entradas de stock variadas."""
    entries = []
    now = datetime.now(timezone.utc)
    ref_prefixes = ["PO-2025-", "PO-2026-", "GR-"]

    for i in range(NUM_ENTRIES):
        sku_id = random.choice(sku_ids)
        qty = random.choice([10, 25, 50, 100, 150, 200, 300, 500])
        prefix = random.choice(ref_prefixes)
        ref_num = random.randint(1000, 9999)
        reference = f"{prefix}{ref_num}"
        wh = random.choice(WAREHOUSES)
        days_ago = random.randint(0, 120)
        created = (now - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat()

        entries.append({
            "sku_id": sku_id,
            "quantity": qty,
            "reference": reference,
            "warehouse": wh,
            "user_uuid": random.choice(USER_UUIDS),
            "created_at": created,
        })

    return entries


def build_exits(sku_ids: list[int]) -> list[dict]:
    """Genera ~150 salidas de stock (80% dispatch, 20% loss)."""
    exits = []
    now = datetime.now(timezone.utc)

    for i in range(NUM_EXITS):
        sku_id = random.choice(sku_ids)
        is_dispatch = random.random() < 0.8
        exit_type = "dispatch" if is_dispatch else "loss"
        qty = random.choice([1, 2, 3, 5, 10, 15, 20, 25, 50])
        wh = random.choice(WAREHOUSES)

        tracking = None
        if is_dispatch:
            tracking = f"1Z{random.randint(100, 999)}AA{random.randint(10000000, 99999999)}"

        days_ago = random.randint(0, 90)
        created = (now - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat()

        exits.append({
            "sku_id": sku_id,
            "quantity": qty,
            "exit_type": exit_type,
            "tracking_number": tracking,
            "warehouse": wh,
            "user_uuid": random.choice(USER_UUIDS),
            "created_at": created,
        })

    return exits


def build_incidents() -> list[dict]:
    """Genera ~100 incidencias variadas en TinyDB."""
    categories = [c.value for c in IncidentCategory]
    origins = [o.value for o in IncidentOrigin]
    branches = [b.value for b in IncidentBranch]
    statuses = ["open", "in_progress", "resolved", "discarded"]
    status_weights = [0.3, 0.25, 0.35, 0.1]  # distribución de estados

    titles = [
        "Paquete no entregado en fecha estimada",
        "Producto llegó dañado al cliente",
        "Discrepancia en conteo de inventario",
        "Etiqueta de envío ilegible",
        "Retraso en recogida del carrier",
        "Devolución no registrada en sistema",
        "Stock incorrecto en ubicación",
        "Cliente reporta artículo faltante",
        "Sobrepeso en paquete emitido",
        "Carrier devolvió paquete sin aviso",
        "Error de picking en pedido",
        "Producto equivocado en envío",
        "Caja dañada durante transporte",
        "Dirección de entrega incorrecta",
        "Falta documentación de aduana",
        "Paquete marcado como entregado sin serlo",
        "Exceso de tiempo en preparación",
        "Producto en mal estado por humedad",
        "Error en asignación de warehouse",
        "Numeración de tracking duplicada",
    ]

    now = datetime.now(timezone.utc)
    incidents = []

    for i in range(NUM_INCIDENTS):
        days_ago = random.randint(0, 180)
        created = (now - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat()
        updated = (now - timedelta(days=random.randint(0, max(0, days_ago - 1)), hours=random.randint(0, 23))).isoformat()

        status = random.choices(statuses, weights=status_weights, k=1)[0]

        incident = {
            "title": random.choice(titles),
            "description": f"Incidente #{i+1} detectado en sede {random.choice(branches)}. "
                          f"Requiere revisión del equipo de operaciones. "
                          f"Prioridad asignada según impacto en SLA.",
            "category": random.choice(categories),
            "status": status,
            "origin": random.choice(origins),
            "branch": random.choice(branches),
            "created_at": created,
            "updated_at": updated,
        }
        incidents.append(incident)

    return incidents


def build_suppliers() -> list[dict]:
    """Genera ~30 proveedores variados en TinyDB."""
    countries_currencies = [("USA", "USD"), ("Spain", "EUR")]
    categories_pool = [
        "carrier_last_mile", "carrier_international", "packaging_materials",
        "cleaning_and_facilities", "warehouse_supplies", "fleet_maintenance",
        "reverse_logistics", "it_and_wms_software",
    ]
    statuses = ["active", "suspended"]

    names_usa = [
        "ParcelFast USA", "QuickShip Logistics", "TransGlobal USA",
        "PackPro Supplies", "CleanCo Facilities", "FleetCare USA",
        "ReturnLogic", "WMS Solutions Inc",
    ]
    names_spain = [
        "Mensajería Rápida España", "LogiExpress Ibérica", "TransWorld España",
        "Embalajes del Sur", "Limpiezas Profesionales SL", "Flotas Mantenimiento",
        "Logística Inversa España", "Sistemas WMS Ibérica",
    ]
    zones_usa = ["West Coast", "East Coast", "Continental USA", "Midwest", "South East"]
    zones_spain = ["Aragón", "Cataluña", "Madrid", "Levante", "Nacional"]

    suppliers = []

    for i in range(NUM_SUPPLIERS):
        country, currency = random.choice(countries_currencies)
        is_usa = country == "USA"
        name = random.choice(names_usa if is_usa else names_spain)
        n_cats = random.randint(1, 2)
        cats = random.sample(categories_pool, n_cats)
        status = random.choices(statuses, weights=[0.85, 0.15], k=1)[0]
        rate = round(random.uniform(0.30, 25.0), 2)
        zone = random.choice(zones_usa if is_usa else zones_spain)
        email_domain = name.lower().replace(" ", "").replace("í", "i").replace("ó", "o")
        email = f"contact@{email_domain}.com"

        now_iso = datetime.now(timezone.utc).isoformat()

        suppliers.append({
            "name": name,
            "country": country,
            "categories": cats,
            "rate_per_shipment": rate,
            "currency": currency,
            "status": status,
            "service_zone": zone,
            "contact_email": email,
            "notes": f"Proveedor #{i+1} para zona {zone}. Contrato vigente.",
            "updated_at": now_iso,
        })

    return suppliers


# ═══════════════════════════════════════════════════════════════
#  MAIN SEED
# ═══════════════════════════════════════════════════════════════

def seed():
    """Ejecuta el seed de datos con volumen realista para pruebas de caching."""
    print("=" * 60)
    print("  seed_caching.py — Datos para pruebas de caching")
    print("=" * 60)

    # ── A. SQLModel / Supabase: SKUs, StockEntry, StockExit ──
    SQLModel.metadata.create_all(engine)
    print("\n📦 Tablas SQLModel verificadas/creadas en Supabase\n")

    with Session(engine) as session:
        # 1. SKUs
        existing_skus = session.exec(select(SKU)).all()
        if len(existing_skus) >= NUM_SKUS:
            print(f"  ⏭  Ya existen {len(existing_skus)} SKUs. Omitiendo inserción.")
            sku_map = {s.sku_code: s.id for s in existing_skus}
            sku_ids = list(sku_map.values())
        else:
            sku_list = build_sku_list()
            inserted = 0
            for sku_data in sku_list:
                existing = session.exec(
                    select(SKU).where(SKU.sku_code == sku_data["sku_code"])
                ).first()
                if existing:
                    continue
                sku = SKU(**sku_data)
                session.add(sku)
                session.commit()
                session.refresh(sku)
                inserted += 1

            all_skus = session.exec(select(SKU)).all()
            sku_map = {s.sku_code: s.id for s in all_skus}
            sku_ids = list(sku_map.values())
            print(f"  ✅ {inserted} nuevos SKUs insertados (total: {len(sku_ids)})")

        # 2. StockEntries
        existing_entries = session.exec(select(StockEntry)).all()
        if len(existing_entries) >= NUM_ENTRIES:
            print(f"  ⏭  Ya existen {len(existing_entries)} entradas. Omitiendo.")
        else:
            entries = build_entries(sku_ids)
            inserted = 0
            for ed in entries:
                entry = StockEntry(**ed)
                session.add(entry)
                inserted += 1
            session.commit()
            print(f"  ✅ {inserted} entradas de stock insertadas")

        # 3. StockExits
        existing_exits = session.exec(select(StockExit)).all()
        if len(existing_exits) >= NUM_EXITS:
            print(f"  ⏭  Ya existen {len(existing_exits)} salidas. Omitiendo.")
        else:
            exits = build_exits(sku_ids)
            inserted = 0
            for xd in exits:
                exit_order = StockExit(**xd)
                session.add(exit_order)
                inserted += 1
            session.commit()
            print(f"  ✅ {inserted} salidas de stock insertadas")

    # ── B. TinyDB: Incidencias ──
    existing_incidents = incidents_table.all()
    if len(existing_incidents) >= NUM_INCIDENTS:
        print(f"\n  ⏭  Ya existen {len(existing_incidents)} incidencias. Omitiendo.")
    else:
        incidents = build_incidents()
        inserted = 0
        for inc in incidents:
            # Evitar duplicados por título+created_at
            dup = incidents_table.search(
                (lambda d: d.get("title") == inc["title"] and d.get("created_at") == inc["created_at"])
            )
            if dup:
                continue
            incidents_table.insert(inc)
            inserted += 1
        print(f"\n  ✅ {inserted} incidencias insertadas en TinyDB")

    # ── C. TinyDB: Proveedores ──
    existing_suppliers = suppliers_table.all()
    if len(existing_suppliers) >= NUM_SUPPLIERS:
        print(f"  ⏭  Ya existen {len(existing_suppliers)} proveedores. Omitiendo.")
    else:
        suppliers = build_suppliers()
        inserted = 0
        for sup in suppliers:
            dup = suppliers_table.search(
                (lambda d: d.get("name") == sup["name"])
            )
            if dup:
                continue
            suppliers_table.insert(sup)
            inserted += 1
        print(f"  ✅ {inserted} proveedores insertados en TinyDB")

    # ── Resumen final ──
    print("\n" + "=" * 60)
    print("  📊 RESUMEN DE DATOS")
    print("=" * 60)
    with Session(engine) as session:
        total_skus = session.exec(select(SKU)).all()
        total_entries = session.exec(select(StockEntry)).all()
        total_exits = session.exec(select(StockExit)).all()
        print(f"  SKUs:          {len(total_skus)}")
        print(f"  StockEntries:  {len(total_entries)}")
        print(f"  StockExits:    {len(total_exits)}")
    print(f"  Incidencias:   {len(incidents_table.all())}")
    print(f"  Proveedores:   {len(suppliers_table.all())}")
    print("=" * 60)


if __name__ == "__main__":
    seed()