"""
test_register.py — Pruebas unitarias para POST /users (TrackFlow).

Cubre: registro de nuevo usuario, creación de perfil, duplicados, casos límite.
"""

import pytest
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError


# ───────────────────── Helpers ─────────────────────

class MockRequest:
    """Request simulado para pruebas de registro."""
    def __init__(self, lang="es"):
        self._headers = {"X-Language": lang}
        self._query_params = {}

    @property
    def headers(self):
        return self._headers

    @property
    def query_params(self):
        return self._query_params


async def call_register(payload_data):
    """Helper que invoca el endpoint register con datos dados."""
    from routes.users import register_user, UserCreate

    # Validar y crear el payload Pydantic
    payload = UserCreate(**payload_data)
    request = MockRequest()

    return await register_user(payload, request)


# ───────────────────── HAPPY PATH ─────────────────────

class TestRegisterHappyPath:
    """Camino feliz: datos válidos → usuario creado + login automático."""

    @pytest.mark.asyncio
    async def test_register_ok(self, mock_db):
        """
        R-H1: register_ok
        Email + password válidos → usuario creado, perfil opcional, sin contraseña en respuesta
        """
        result = await call_register({
            "email": "newuser@trackflow.com",
            "password": "MyPassword123!",
        })

        # Verificar que se devuelve el usuario sin contraseña
        assert result.user is not None
        assert result.user.email == "newuser@trackflow.com"
        assert result.user.role == "user"
        assert result.user.is_active is True
        assert result.user.id > 0

        # Verificar que NO se devuelve la contraseña
        assert not hasattr(result.user, "hashed_password")

        # Verificar que el perfil es None (no se pasaron datos de perfil)
        assert result.profile is None

        # Verificar que el usuario existe en la BD
        users = mock_db["users"]
        stored = users.get(doc_id=result.user.id)
        assert stored is not None
        assert stored["email"] == "newuser@trackflow.com"
        # Verificar que la contraseña está hasheada
        assert stored["hashed_password"] != "MyPassword123!"

    @pytest.mark.asyncio
    async def test_register_with_profile(self, mock_db):
        """
        R-H2: register_with_profile
        Email + password + name + phone + address → perfil creado
        """
        result = await call_register({
            "email": "fullprofile@trackflow.com",
            "password": "Password123!",
            "name": "John Doe",
            "phone": "+34987654321",
            "address": "Calle Test 123",
        })

        assert result.user is not None
        assert result.profile is not None
        assert result.profile["name"] == "John Doe"
        assert result.profile["phone"] == "+34987654321"


# ───────────────────── EDGE CASES ─────────────────────

class TestRegisterEdgeCases:
    """Casos límite: entradas en el borde de lo válido."""

    @pytest.mark.asyncio
    async def test_register_email_strip_and_lower(self, mock_db):
        """
        R-E1: register_email_strip_and_lower
        Email con espacios y mayúsculas → se almacena normalizado
        """
        result = await call_register({
            "email": "  UPPER@TrackFlow.COM  ",
            "password": "Password123!",
        })

        assert result.user.email == "upper@trackflow.com"

    @pytest.mark.asyncio
    async def test_register_min_password(self, mock_db):
        """
        R-E2: register_min_password
        Password exactamente 6 caracteres (mínimo permitido) → OK
        """
        result = await call_register({
            "email": "minpass@trackflow.com",
            "password": "123456",
        })

        assert result.user is not None
        assert result.user.email == "minpass@trackflow.com"


# ───────────────────── FAILURE MODES ─────────────────────

class TestRegisterFailureModes:
    """Modos de fallo: entradas inválidas y conflictos."""

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, sample_user, mock_db):
        """
        R-F1: register_duplicate_email
        Email ya registrado → HTTPException 400 con error de email duplicado
        """
        from services import create_user

        with pytest.raises(ValueError) as exc:
            create_user("test@trackflow.com", "AnyPassword123!")

        assert "already registered" in str(exc.value).lower() or \
               "ya está registrado" in str(exc.value).lower() or \
               "ya registrado" in str(exc.value).lower()

    def test_register_invalid_email_no_at(self):
        """
        R-F2: register_invalid_email
        Email sin @ → ValidationError de Pydantic
        """
        from routes.users import UserCreate

        with pytest.raises(ValidationError):
            UserCreate(email="not-an-email", password="Password123!")

    def test_register_short_password(self):
        """
        R-F3: register_short_password
        Password < 6 caracteres → ValidationError de Pydantic
        """
        from routes.users import UserCreate

        with pytest.raises(ValidationError):
            UserCreate(email="test@trackflow.com", password="abc")