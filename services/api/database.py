"""
database.py — Inicialización de TinyDB para el Directorio de Proveedores (TrackFlow).

La base de datos persiste en un archivo JSON dentro de services/api/.
"""

import os
from tinydb import TinyDB, Query

# Ruta del archivo de persistencia (junto a este mismo archivo)
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "suppliers_db.json")

# Instancia única de la base de datos
db = TinyDB(DB_PATH)

# Tabla de proveedores
suppliers_table = db.table("suppliers")

# Query helper para reutilizar en rutas
SupplierQuery = Query()

# Nombre del archivo de datos para TinyDB
DB_FILENAME = "suppliers_db.json"