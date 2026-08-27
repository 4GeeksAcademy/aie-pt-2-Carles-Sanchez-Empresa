"""
conftest.py — Fixtures globales para los tests de autenticación (TrackFlow).

Proporciona:
  - Base de datos TinyDB temporal (aislada por test)
  - Clave secreta JWT fija para tests predecibles
  - Usuario de prueba pre-creado
  - Mocks para servicios externos (email, translator)
"""

import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Añadir services/api al path para poder importar los módulos
_SERVICES_API = Path(__file__).resolve().parent.parent / "services" / "api"
sys.path.insert(0, str(_SERVICES_API))


# ───────────────────── Fixtures de BD ─────────────────────

@pytest.fixture(autouse=True)
def fixed_secret_key():
    """Fija SECRET_KEY a un valor conocido para tokens predecibles en tests."""
    with patch("auth.SECRET_KEY", "test-secret-key-not-secure"):
        yield


@pytest.fixture(autouse=True)
def fixed_reset_token_expire():
    """Fija RESET_TOKEN_EXPIRE_MINUTES para controlar expiración en tests."""
    with patch("auth.RESET_TOKEN_EXPIRE_MINUTES", 60):
        yield


@pytest.fixture(autouse=True)
def fixed_access_token_expire():
    """Fija ACCESS_TOKEN_EXPIRE_MINUTES para controlar expiración en tests."""
    with patch("auth.ACCESS_TOKEN_EXPIRE_MINUTES", 30):
        yield


@pytest.fixture
def tmp_db_path(tmp_path):
    """Crea una ruta para base de datos TinyDB temporal."""
    db_file = tmp_path / "test_suppliers_db.json"
    return db_file


@pytest.fixture(autouse=True)
def mock_db(tmp_db_path):
    """
    Reemplaza la base de datos de TinyDB por una temporal.
    Se ejecuta automáticamente en cada test.
    """
    from tinydb import TinyDB, Query

    # Crear BD temporal
    db = TinyDB(str(tmp_db_path))

    # Tablas
    users_table = db.table("users")
    profiles_table = db.table("profiles")
    used_tokens_table = db.table("used_tokens")
    suppliers_table = db.table("suppliers")
    incidents_table = db.table("incidents")

    # Importar módulos de rutas antes de parchearlos
    import routes.incidents  # noqa: F401

    with patch("database.db", db), \
         patch("database.users_table", users_table), \
         patch("database.profiles_table", profiles_table), \
         patch("database.used_tokens_table", used_tokens_table), \
         patch("database.suppliers_table", suppliers_table), \
         patch("database.incidents_table", incidents_table), \
         patch("database.UserQuery", Query()), \
         patch("database.TokenQuery", Query()), \
         patch("database.ProfileQuery", Query()), \
         patch("database.SupplierQuery", Query()), \
         patch("database.IncidentQuery", Query()), \
         patch("auth.users_table", users_table), \
         patch("auth.used_tokens_table", used_tokens_table), \
         patch("services.users_table", users_table), \
         patch("services.profiles_table", profiles_table), \
         patch("routes.auth.users_table", users_table), \
         patch("routes.suppliers.suppliers_table", suppliers_table), \
         patch("routes.incidents.incidents_table", incidents_table):
        yield {
            "db": db,
            "users": users_table,
            "profiles": profiles_table,
            "used_tokens": used_tokens_table,
            "suppliers": suppliers_table,
            "incidents": incidents_table,
        }


@pytest.fixture
def sample_user(mock_db):
    """Crea un usuario de prueba en la BD temporal."""
    from auth import hash_password

    users = mock_db["users"]
    profiles = mock_db["profiles"]

    doc_id = users.insert({
        "email": "test@trackflow.com",
        "hashed_password": hash_password("SecurePass123!"),
        "role": "user",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    })

    # Crear perfil asociado
    profiles.insert({
        "user_id": doc_id,
        "name": "Test User",
        "phone": "+123456789",
        "address": "Test Address",
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    })

    return doc_id


@pytest.fixture
def sample_admin(mock_db):
    """Crea un usuario administrador de prueba."""
    from auth import hash_password

    users = mock_db["users"]

    doc_id = users.insert({
        "email": "admin@trackflow.com",
        "hashed_password": hash_password("AdminPass123!"),
        "role": "admin",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    })
    return doc_id


@pytest.fixture
def sample_inactive_user(mock_db):
    """Crea un usuario inactivo de prueba."""
    from auth import hash_password

    users = mock_db["users"]

    doc_id = users.insert({
        "email": "inactive@trackflow.com",
        "hashed_password": hash_password("InactivePass123!"),
        "role": "user",
        "is_active": False,
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    })
    return doc_id


@pytest.fixture
def valid_token(sample_user):
    """Genera un token JWT válido para el usuario de prueba."""
    from auth import create_access_token
    return create_access_token(data={"sub": str(sample_user)})


# ───────────────────── Mocks de servicios externos ─────────────────────

@pytest.fixture(autouse=True)
def mock_email_service():
    """Mockea el envío de email para evitar llamadas reales a Resend."""
    with patch("routes.auth.send_reset_email") as mock:
        yield mock


@pytest.fixture(autouse=True)
def mock_logger():
    """Mockea logger.exception para verificar que se llama sin silenciar."""
    with patch("routes.auth.logger.exception") as mock:
        yield mock


# ───────────────────── Helpers ─────────────────────

@pytest.fixture
def mock_request():
    """
    Crea un Request simulado de FastAPI con valores por defecto.

    La request tiene:
      - headers: {"content-type": "application/json", "X-Language": "es"}
      - query_params: {}
    """
    class MockRequest:
        def __init__(self):
            self._headers = {
                "content-type": "application/json",
                "X-Language": "es",
            }
            self._query_params = {}
            self._json_body = None
            self._form_data = None

        @property
        def headers(self):
            return self._headers

        @property
        def query_params(self):
            return self._query_params

        async def json(self):
            return self._json_body

        async def form(self):
            class FormData:
                def get(self, key, default=None):
                    if self._form_data is None:
                        return default
                    return self._form_data.get(key, default)

            form = FormData()
            form._form_data = self._form_data
            return form

    return MockRequest()