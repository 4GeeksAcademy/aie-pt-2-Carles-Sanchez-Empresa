"""
test_login.py — Pruebas unitarias para POST /auth/login (TrackFlow).

Cubre: camino feliz, casos límite y modos de fallo del endpoint de inicio de sesión.
"""

import json
import pytest
from unittest.mock import AsyncMock, patch

from auth import hash_password
from fastapi import HTTPException


# ───────────────────── Helpers ─────────────────────

class MockRequest:
    """Request simulado de FastAPI para pruebas unitarias."""
    def __init__(self, json_body=None, form_data=None,
                 content_type="application/json", lang="es"):
        self._json_body = json_body
        self._form_data = form_data
        self._headers = {
            "content-type": content_type,
            "X-Language": lang,
        }
        self._query_params = {}

    @property
    def headers(self):
        return self._headers

    @property
    def query_params(self):
        return self._query_params

    async def json(self):
        if self._json_body is None:
            raise ValueError("No JSON body set")
        return self._json_body

    async def form(self):
        class FormData:
            def __init__(self, data):
                self._data = data or {}
            def get(self, key, default=None):
                return self._data.get(key, default)

        return FormData(self._form_data)


async def call_login(json_body=None, form_data=None, content_type="application/json"):
    """Helper que invoca el endpoint login con argumentos dados."""
    from routes.auth import login

    request = MockRequest(
        json_body=json_body,
        form_data=form_data,
        content_type=content_type,
    )
    return await login(request)


# ───────────────────── HAPPY PATH ─────────────────────

class TestLoginHappyPath:
    """Camino feliz: credenciales correctas → token JWT."""

    @pytest.mark.asyncio
    async def test_login_credentials_ok(self, sample_user, mock_db):
        """
        L-H1: login_credentials_ok
        Email existente + contraseña correcta → 200, token JWT con sub=str(user_id)
        """
        result = await call_login(
            json_body={"email": "test@trackflow.com", "password": "SecurePass123!"}
        )

        assert result.access_token is not None
        assert result.token_type == "bearer"

        # Verificar que el token es un JWT decodificable con nuestro sub
        from jose import jwt
        from auth import SECRET_KEY
        payload = jwt.decode(result.access_token, "test-secret-key-not-secure",
                             algorithms=["HS256"])
        assert payload["sub"] == str(sample_user)
        assert "exp" in payload

    @pytest.mark.asyncio
    async def test_login_form_urlencoded(self, sample_user, mock_db):
        """
        L-E4: login_form_urlencoded
        OAuth2 form-urlencoded con username+password → 200
        """
        result = await call_login(
            form_data={"username": "test@trackflow.com", "password": "SecurePass123!"},
            content_type="application/x-www-form-urlencoded",
        )

        assert result.access_token is not None
        assert result.token_type == "bearer"

        from jose import jwt
        payload = jwt.decode(result.access_token, "test-secret-key-not-secure",
                             algorithms=["HS256"])
        assert payload["sub"] == str(sample_user)


# ───────────────────── EDGE CASES ─────────────────────

class TestLoginEdgeCases:
    """Casos límite: entradas en el borde de lo válido."""

    @pytest.mark.asyncio
    async def test_login_user_inactive(self, sample_inactive_user, mock_db):
        """
        L-E1: login_user_inactive
        Usuario inactivo → 401 con detail="account_disabled"
        """
        with pytest.raises(HTTPException) as exc:
            await call_login(
                json_body={"email": "inactive@trackflow.com",
                           "password": "InactivePass123!"}
            )

        assert exc.value.status_code == 401
        # El detail debe ser el mensaje de cuenta desactivada
        assert "account_disabled" in str(exc.value.detail) or \
               "desactivada" in str(exc.value.detail).lower()

    @pytest.mark.asyncio
    async def test_login_empty_email(self, mock_db):
        """
        L-E2: login_empty_email
        Email vacío + password válida → 422
        """
        with pytest.raises(HTTPException) as exc:
            await call_login(
                json_body={"email": "", "password": "SecurePass123!"}
            )

        assert exc.value.status_code == 422

    @pytest.mark.asyncio
    async def test_login_empty_password(self, mock_db):
        """
        L-E3: login_empty_password
        Email válido + password vacía → 422
        """
        with pytest.raises(HTTPException) as exc:
            await call_login(
                json_body={"email": "test@trackflow.com", "password": ""}
            )

        assert exc.value.status_code == 422


# ───────────────────── FAILURE MODES ─────────────────────

class TestLoginFailureModes:
    """Modos de fallo: entradas inválidas y errores conocidos."""

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, sample_user, mock_db):
        """
        L-F1: login_wrong_password
        Email correcto + contraseña incorrecta → 401
        """
        with pytest.raises(HTTPException) as exc:
            await call_login(
                json_body={"email": "test@trackflow.com", "password": "WrongPass!"}
            )

        assert exc.value.status_code == 401

    @pytest.mark.asyncio
    async def test_login_email_not_found(self, mock_db):
        """
        L-F2: login_email_not_found
        Email no registrado → 401 (mismo mensaje que L-F1, no enumeración)
        """
        with pytest.raises(HTTPException) as exc:
            await call_login(
                json_body={"email": "nonexistent@trackflow.com",
                           "password": "AnyPass123!"}
            )

        assert exc.value.status_code == 401

    @pytest.mark.asyncio
    async def test_login_malformed_json(self, mock_db):
        """
        L-F3: login_malformed_json
        Body no es JSON válido → 422
        """
        with pytest.raises(HTTPException) as exc:
            # Simular que request.json() lanza JSONDecodeError
            request = MockRequest(content_type="application/json")
            # Forzar que json() lance error
            with patch.object(request, 'json',
                              side_effect=__import__('json').JSONDecodeError(
                                  "Expecting value", "", 0)):
                from routes.auth import login
                await login(request)

        assert exc.value.status_code == 422

    @pytest.mark.asyncio
    async def test_login_wrong_content_type_empty_body(self, mock_db):
        """
        L-F: content-type extraño sin datos → error controlado
        """
        with pytest.raises(HTTPException) as exc:
            await call_login(
                content_type="text/plain",
            )

        # Sin content-type conocido, debe fallar con 422
        assert exc.value.status_code == 422