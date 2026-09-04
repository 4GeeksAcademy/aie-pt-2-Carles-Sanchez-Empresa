"""
test_token.py — Pruebas unitarias para tokens JWT y GET /auth/me (TrackFlow).

Cubre:
  - Creación y verificación de tokens JWT de acceso
  - Creación y verificación de tokens de restablecimiento
  - Validación de expiración, firma y tipo
  - GET /auth/me (información del usuario autenticado)
"""

import time
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from jose import JWTError, jwt


# ───────────────────── CONSTANTES ─────────────────────

SECRET_KEY = "test-secret-key-not-secure"
ALGORITHM = "HS256"
FAKE_SECRET = "fake-secret-different"


# ───────────────────── HELPER: crear tokens para tests ─────────────────────

def make_token(payload: dict, secret: str = SECRET_KEY) -> str:
    """Crea un token JWT firmado con la clave de test."""
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


# ═══════════════════════════════════════════════════════
#  CREATE_ACCESS_TOKEN
# ═══════════════════════════════════════════════════════

class TestCreateAccessToken:
    """Pruebas para create_access_token()."""

    def test_create_access_token_ok(self):
        """
        T-H1: create_access_token_ok
        Genera token JWT decodificable con sub y exp futuro
        """
        from auth import create_access_token

        token = create_access_token(data={"sub": "42"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        assert payload["sub"] == "42"
        assert "exp" in payload
        # exp debe ser futuro (dentro de ~30 min)
        expiry = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        diff = expiry - now
        assert timedelta(minutes=25) < diff < timedelta(minutes=35)

    def test_create_access_token_custom_expiry(self):
        """
        T-E1: create_access_token_custom_expiry
        Con expires_delta=timedelta(0) → token expira inmediatamente
        """
        from auth import create_access_token

        token = create_access_token(
            data={"sub": "42"},
            expires_delta=timedelta(milliseconds=1),
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        expiry = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        # Debe expirar casi inmediatamente (tolerancia de 1 segundo)
        assert expiry - now < timedelta(seconds=1)

    def test_create_access_token_multiple_fields(self):
        """
        T-H2: create_access_token_multiple_fields
        payload con campos adicionales se conservan en el token
        """
        from auth import create_access_token

        token = create_access_token(data={
            "sub": "99",
            "role": "admin",
            "custom": "value",
        })
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        assert payload["sub"] == "99"
        assert payload["role"] == "admin"
        assert payload["custom"] == "value"


# ═══════════════════════════════════════════════════════
#  CREATE_RESET_TOKEN
# ═══════════════════════════════════════════════════════

class TestCreateResetToken:
    """Pruebas para create_reset_token()."""

    def test_create_reset_token_ok(self):
        """
        T-H3: create_reset_token_ok
        Genera token JWT con sub, type="reset", jti y exp futuro
        """
        from auth import create_reset_token

        token = create_reset_token(user_id=42)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        assert payload["sub"] == "42"
        assert payload["type"] == "reset"
        assert "jti" in payload
        assert len(payload["jti"]) == 16  # 16 caracteres hex

        # exp debe ser futuro (~60 min)
        expiry = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        diff = expiry - now
        assert timedelta(minutes=55) < diff < timedelta(minutes=65)

    def test_create_reset_token_unique_jti(self):
        """
        T-H4: create_reset_token_unique_jti
        Dos tokens para el mismo usuario tienen jti distintos
        """
        from auth import create_reset_token

        token1 = create_reset_token(user_id=42)
        token2 = create_reset_token(user_id=42)

        payload1 = jwt.decode(token1, SECRET_KEY, algorithms=[ALGORITHM])
        payload2 = jwt.decode(token2, SECRET_KEY, algorithms=[ALGORITHM])

        assert payload1["jti"] != payload2["jti"]


# ═══════════════════════════════════════════════════════
#  VERIFY_RESET_TOKEN
# ═══════════════════════════════════════════════════════

class TestVerifyResetToken:
    """Pruebas para verify_reset_token()."""

    def test_verify_reset_token_ok(self, mock_db):
        """
        T-H5: verify_reset_token_ok
        Token válido + no usado → devuelve user_id
        """
        from auth import create_reset_token, verify_reset_token

        token = create_reset_token(user_id=42)
        user_id = verify_reset_token(token)

        assert user_id == 42

    def test_verify_reset_token_expired(self):
        """
        T-F1: verify_reset_token_expired
        Token con exp en el pasado → HTTPException 400
        """
        from auth import verify_reset_token

        # Crear token que ya expiró (exp hace 1 hora)
        expired_payload = {
            "sub": "42",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "type": "reset",
            "jti": "abcdef1234567890",
        }
        token = make_token(expired_payload)

        with pytest.raises(HTTPException) as exc:
            verify_reset_token(token)

        assert exc.value.status_code == 400

    def test_verify_reset_token_wrong_signature(self):
        """
        T-F2: verify_reset_token_wrong_signature
        Token firmado con otra key → HTTPException 400
        """
        from auth import verify_reset_token

        # Firmar con otra clave
        payload = {
            "sub": "42",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "type": "reset",
            "jti": "abcdef1234567890",
        }
        token = make_token(payload, secret=FAKE_SECRET)

        with pytest.raises(HTTPException) as exc:
            verify_reset_token(token)

        assert exc.value.status_code == 400

    def test_verify_reset_token_wrong_type(self):
        """
        T-F3: verify_reset_token_wrong_type
        Token de tipo "access" (no "reset") → HTTPException 400
        """
        from auth import verify_reset_token

        payload = {
            "sub": "42",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "type": "access",  # ← incorrecto
            "jti": "abcdef1234567890",
        }
        token = make_token(payload)

        with pytest.raises(HTTPException) as exc:
            verify_reset_token(token)

        assert exc.value.status_code == 400

    def test_verify_reset_token_already_used(self, mock_db):
        """
        T-F4: verify_reset_token_already_used
        Token en used_tokens → HTTPException 400
        """
        from auth import create_reset_token, verify_reset_token, invalidate_reset_token

        token = create_reset_token(user_id=42)
        invalidate_reset_token(token)

        with pytest.raises(HTTPException) as exc:
            verify_reset_token(token)

        assert exc.value.status_code == 400
        # Verificar que el mensaje es de "ya usado"
        assert "already been used" in str(exc.value.detail).lower() or \
               "ya ha sido utilizado" in str(exc.value.detail).lower()

    def test_verify_reset_token_malformed(self):
        """
        T-F5: verify_reset_token_malformed
        String "not-a-token" → HTTPException 400
        """
        from auth import verify_reset_token

        with pytest.raises(HTTPException) as exc:
            verify_reset_token("not-a-token")

        assert exc.value.status_code == 400


# ═══════════════════════════════════════════════════════
#  GET /auth/me
# ═══════════════════════════════════════════════════════

class TestAuthMe:
    """Pruebas para GET /auth/me."""

    @pytest.mark.asyncio
    async def test_auth_me_ok(self, sample_user, mock_db):
        """
        M-H1: auth_me_ok
        Usuario autenticado + perfil existente → email, role, profile
        """
        from routes.auth import auth_me

        # Simular el current_user que devolvería get_current_user
        current_user = {
            "id": sample_user,
            "email": "test@trackflow.com",
            "role": "user",
        }

        result = await auth_me(current_user=current_user)

        assert result.id == sample_user
        assert result.email == "test@trackflow.com"
        assert result.role == "user"
        assert result.profile is not None
        assert result.profile["name"] == "Test User"

    @pytest.mark.asyncio
    async def test_auth_me_no_profile(self, mock_db):
        """
        M-E1: auth_me_no_profile
        Usuario autenticado sin perfil → profile: None
        """
        from routes.auth import auth_me

        # Crear usuario sin perfil
        users = mock_db["users"]
        doc_id = users.insert({
            "email": "noprofile@trackflow.com",
            "hashed_password": "hash",
            "role": "user",
            "is_active": True,
        })

        current_user = {
            "id": doc_id,
            "email": "noprofile@trackflow.com",
            "role": "user",
        }

        result = await auth_me(current_user=current_user)

        assert result.id == doc_id
        assert result.email == "noprofile@trackflow.com"
        assert result.profile is None

    @pytest.mark.asyncio
    async def test_auth_me_returns_profile_with_all_fields(self, sample_user, mock_db):
        """
        M-H2: auth_me_returns_all_fields
        El perfil contiene name, phone, address, created_at, updated_at
        """
        from routes.auth import auth_me

        current_user = {
            "id": sample_user,
            "email": "test@trackflow.com",
            "role": "user",
        }

        result = await auth_me(current_user=current_user)

        assert result.profile is not None
        assert "name" in result.profile
        assert "phone" in result.profile
        assert "address" in result.profile
        assert "created_at" in result.profile
        assert "updated_at" in result.profile


# ═══════════════════════════════════════════════════════
#  INVALIDATE_RESET_TOKEN
# ═══════════════════════════════════════════════════════

class TestInvalidateResetToken:
    """Pruebas para invalidate_reset_token()."""

    def test_invalidate_reset_token_stores(self, mock_db):
        """
        T-H6: invalidate_reset_token_stores
        Token se guarda hasheado en used_tokens
        """
        from auth import create_reset_token, invalidate_reset_token, _hash_token

        token = create_reset_token(user_id=42)
        invalidate_reset_token(token)

        token_hash = _hash_token(token)
        used = mock_db["used_tokens"]
        assert used.contains(__import__('tinydb').Query().token_hash == token_hash)

    def test_invalidate_reset_token_idempotent(self, mock_db):
        """
        T-H7: invalidate_reset_token_idempotent
        Invalidar mismo token dos veces no lanza error
        """
        from auth import create_reset_token, invalidate_reset_token

        token = create_reset_token(user_id=42)
        invalidate_reset_token(token)
        invalidate_reset_token(token)  # Segunda vez → no debe fallar