"""
migrate_add_threshold_min.py — Migra la columna threshold_min a la tabla skus.

Ejecutar una sola vez para añadir la columna que falta en Supabase:
    python migrate_add_threshold_min.py
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

# Cargar .env
dotenv_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path)

from database import engine


def migrate():
    url = os.getenv("SUPABASE_URL")
    if not url:
        print("❌ SUPABASE_URL no configurada")
        sys.exit(1)

    with engine.connect() as conn:
        # Verificar si la columna ya existe
        result = conn.execute(
            text(
                "SELECT EXISTS ("
                "  SELECT 1 FROM information_schema.columns "
                "  WHERE table_name = 'skus' AND column_name = 'threshold_min'"
                ")"
            )
        )
        exists = result.scalar()

        if exists:
            print("✅ La columna threshold_min ya existe en la tabla skus.")
            return

        print("⚙️  Añadiendo columna threshold_min a la tabla skus...")
        conn.execute(text("ALTER TABLE skus ADD COLUMN threshold_min INTEGER DEFAULT 10"))
        conn.commit()
        print("✅ Columna threshold_min añadida correctamente.")


if __name__ == "__main__":
    migrate()
