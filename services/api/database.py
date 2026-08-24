"""
database.py — Inicialización de TinyDB para TrackFlow.

La base de datos persiste en un archivo JSON dentro de services/api/.
Tablas:
  - suppliers   → Directorio de proveedores
  - users       → Credenciales de usuario (email + password hasheada)
  - profiles    → Perfiles vinculados 1:1 a usuarios
  - used_tokens → Tokens de restablecimiento invalidados
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

# Tablas de autenticación
users_table = db.table("users")
profiles_table = db.table("profiles")
used_tokens_table = db.table("used_tokens")

# Query helper para reutilizar en rutas
SupplierQuery = Query()
UserQuery = Query()
TokenQuery = Query()
ProfileQuery = Query()

# Nombre del archivo de datos para TinyDB
DB_FILENAME = "suppliers_db.json"