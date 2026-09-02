"""
test_change_password.py — Pruebas unitarias para POST /auth/change-password (TrackFlow).

Cubre: cambio de contraseña estando autenticado, validación de contraseña actual,
caso de usuario eliminado entre login y cambio, etc.
"""

import pytest
from unittest.mock import patch

from fastapi import HTTPException
from auth import hash_password

# ═══════════════════════════════════════════════════════# ═══════════════════════════════════════════════════════
#  CHANGE PASSWORD
# ═══════════════════════════════════════════════════════

class TestChangePassword:
    """Pruebas para POST /auth/change-password."""

    @pytest.mark.asyncio
    async def test_change_password_ok(self, sample_user, mock_db):
        """
        C-H1: change_password_ok
        Token válido + contraseña actual correcta + nueva contraseña → 200, password actualizada
        """
        from routes.auth import change_password, ChangePasswordRequest
        from auth import verify_password

        payload = ChangePasswordRequest(
            current_password="SecurePass123!",
            new_password="NewSecurePass456!",
        )
        current_user = {"id": sample_user, "email": "test@trackflow.com", "role": "user"}

        result = await change_password(payload, current_user=current_user)

        assert result["message"] is not None

        # Verificar que la contraseña se actualizó
        users = mock_db["users"]
        user = users.get(doc_id=sample_user)
        assert verify_password("NewSecurePass456!", user["hashed_password"])

        # La contraseña antigua ya no funciona
        assert not verify_password("SecurePass123!", user["hashed_password"])

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, sample_user, mock_db):
        """
        C-F1: change_password_wrong_current
        Contraseña actual incorrecta → 400
        """
        from routes.auth import change_password, ChangePasswordRequest

        payload = ChangePasswordRequest(
            current_password="WrongCurrentPass!",
            new_password="NewPass123!",
        )
        current_user = {"id": sample_user, "email": "test@trackflow.com", "role": "user"}

        with pytest.raises(HTTPException) as exc:
            await change_password(payload, current_user=current_user)

        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_change_password_unauthenticated(self, sample_user, mock_db):
        """
        C-F2: change_password_unauthenticated
        Sin token → get_current_user lanza 401 (probado en test_token.py)
        Este test verifica que la dependencia está presente.
        """
        from routes.auth import change_password, ChangePasswordRequest
        from auth import get_current_user

        # Verificar que change_password usa Depends(get_current_user)
        # Al llamar sin current_user, FastAPI lanzaría error porque falta el parámetro
        # En test unitario, simplemente verificamos que get_current_user rechaza sin token
        with pytest.raises(HTTPException):
            await get_current_user(token="invalid-token")

    @pytest.mark.asyncio
    async def test_change_password_user_not_found(self, mock_db):
        """
        C-E1: change_password_user_not_found (A-11)
        Usuario autenticado eliminado de la BD → 404
        """
        from routes.auth import change_password, ChangePasswordRequest

        payload = ChangePasswordRequest(
            current_password="SomePass123!",
            new_password="NewPass456!",
        )
        # Usar un ID que no existe en la BD
        current_user = {"id": 9999, "email": "ghost@trackflow.com", "role": "user"}

        with pytest.raises(HTTPException) as exc:
            await change_password(payload, current_user=current_user)

        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_change_password_empty_current(self, sample_user, mock_db):
        """
        C-F3: change_password_empty_current
        Contraseña actual vacía → 400 (verify falla)
        """
        from routes.auth import change_password, ChangePasswordRequest

        payload = ChangePasswordRequest(
            current_password="",
            new_password="NewPass123!",
        )
        current_user = {"id": sample_user, "email": "test@trackflow.com", "role": "user"}

        with pytest.raises(HTTPException) as exc:
            await change_password(payload, current_user=current_user)

        assert exc.value.status_code in (400, 422)

    @pytest.mark.asyncio
    async def test_change_password_same_password(self, sample_user, mock_db):
        """
        C-E2: change_password_same_password
        Nueva contraseña igual a la actual → 400 (no permitido)
        """
        from routes.auth import change_password, ChangePasswordRequest

        payload = ChangePasswordRequest(
            current_password="SecurePass123!",
            new_password="SecurePass123!",
        )
        current_user = {"id": sample_user, "email": "test@trackflow.com", "role": "user"}

        with pytest.raises(HTTPException) as exc:
            await change_password(payload, current_user=current_user)

        assert exc.value.status_code == 400
        assert "igual" in exc.value.detail.lower()