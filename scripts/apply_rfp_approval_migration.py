"""Aplica la migración 004 (Parte 3 aprobación RFP) contra SUPABASE_URL.

Uso:  python -m scripts.apply_rfp_approval_migration
      (también ejecutable:  python scripts/apply_rfp_approval_migration.py)
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(_ROOT / ".env")

MIGRATION = _ROOT / "services" / "migrations" / "004_rfp_approval.sql"


def main() -> int:
    url = os.getenv("SUPABASE_URL")
    if not url:
        print("❌ SUPABASE_URL no está configurada en .env", file=sys.stderr)
        return 1

    if not MIGRATION.exists():
        print(f"❌ No se encontró la migración: {MIGRATION}", file=sys.stderr)
        return 1

    sql = MIGRATION.read_text(encoding="utf-8")
    # Desglosar por sentencias (separamos por ; respetando que no hay PL/pgSQL con ; interno)
    statements = [s.strip() for s in sql.split(";") if s.strip()]

    engine = create_engine(url)
    try:
        with engine.begin() as conn:
            for stmt in statements:
                print(f"▶ {stmt.splitlines()[0][:80]}...")
                conn.execute(text(stmt))
        print("✅ Migración 004 aplicada correctamente.")
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"❌ Error aplicando la migración: {exc}", file=sys.stderr)
        return 1
    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
