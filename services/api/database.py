"""
database.py — Inicialización de TinyDB + SQLModel (Supabase) para TrackFlow.

Gestiona dos conexiones de base de datos simultáneamente:
  - TinyDB: persistencia local JSON para usuarios, perfiles, proveedores e incidencias.
  - SQLModel (Supabase/PostgreSQL): persistencia cloud para inventario (SKUs, movimientos).

La sesión SQLModel se inyecta por petición mediante Depends() — sin variables globales.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlmodel import create_engine, Session
from tinydb import TinyDB, Query

# Cargar variables de entorno (.env raíz del proyecto)
dotenv_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path)

# ──────────── TinyDB (autenticación, proveedores, incidencias) ────────────

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "suppliers_db.json")

db = TinyDB(DB_PATH)

suppliers_table = db.table("suppliers")
users_table = db.table("users")
profiles_table = db.table("profiles")
used_tokens_table = db.table("used_tokens")
incidents_table = db.table("incidents")

SupplierQuery = Query()
UserQuery = Query()
TokenQuery = Query()
ProfileQuery = Query()
IncidentQuery = Query()

DB_FILENAME = "suppliers_db.json"


# ──────────── SQLModel / Supabase (inventario) ────────────

SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL no está configurada en .env")

engine = create_engine(SUPABASE_URL, echo=False)


def get_db() -> Session:
    """
    Dependencia de FastAPI que produce una sesión SQLModel por petición.

    Uso:
        @router.get(...)
        async def list_products(db: Session = Depends(get_db)):
            ...

    La sesión se cierra automáticamente al finalizar la petición.
    """
    with Session(engine) as session:
        yield session