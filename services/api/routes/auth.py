"""
routes/auth.py — Endpoints de autenticación (TrackFlow).

Gestiona el login (emisión de JWT) y la información del usuario autenticado.
"""

import logging
from json import JSONDecodeError

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ValidationError

from i18n import get_translator

logger = logging.getLogger(__name__)

from auth import (
    create_access_token,
    create_reset_token,
    get_current_user,
    hash_password,
    invalidate_reset_token,
    verify_password,
    verify_reset_token,
)
from database import users_table, UserQuery
from email_service import send_reset_email
from services import get_user_by_email, get_profile_by_user_id, update_user

t = get_translator("es")

router = APIRouter(prefix="/auth", tags=["Auth"])


# ───────────────────── Schemas ─────────────────────

class LoginRequest(BaseModel):
    """Credenciales de inicio de sesión."""
    email: str | None = None
    username: str | None = None
    password: str


class TokenResponse(BaseModel):
    """Respuesta del endpoint de login con el JWT."""
    access_token: str
    token_type: str = "bearer"


class AuthMeResponse(BaseModel):
    """Información del usuario autenticado + perfil."""
    id: int
    email: str
    role: str
    profile: dict | None = None


# ───────────────────── Endpoints ─────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(request: Request):
    """
    Inicio de sesión.

    Valida email y contraseña, y devuelve un token JWT firmado.

    El token debe incluirse en las peticiones protegidas como:
        Authorization: Bearer <token>
    """
    async def _extract_credentials() -> tuple[str, str]:
        """
        Extrae credenciales en ambos formatos soportados:
          - OAuth2 password flow (form-urlencoded): username + password
          - JSON tradicional: email + password (o username + password)
        """
        content_type = (request.headers.get("content-type") or "").lower()

        if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            form = await request.form()
            raw_username = str(form.get("username") or "").strip().lower()
            raw_password = str(form.get("password") or "")
            if not raw_username or not raw_password:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Faltan campos requeridos: username y password",
                )
            return raw_username, raw_password

        try:
            payload = LoginRequest.model_validate(await request.json())
        except (ValidationError, JSONDecodeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Body JSON inválido. Use email/password o username/password",
            )
        login_id = (payload.email or payload.username or "").strip().lower()
        if not login_id or not payload.password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Faltan credenciales de acceso",
            )
        return login_id, payload.password

    login_id, password = await _extract_credentials()

    # Buscar usuario por email (en OAuth2 usamos username como identificador)
    user = get_user_by_email(login_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar contraseña
    hashed = user.get("hashed_password", "")
    if not verify_password(password, hashed):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar que el usuario esté activo
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta está desactivada",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Crear token JWT
    user_id = user.get("id") or user.doc_id
    access_token = create_access_token(data={"sub": str(user_id)})

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=AuthMeResponse)
async def auth_me(current_user: dict = Depends(get_current_user)):
    """
    Devuelve la información del usuario autenticado.

    Incluye email, role y el perfil vinculado (nombre, teléfono, dirección).
    Requiere token JWT válido.
    """
    user_id = current_user["id"]
    profile = get_profile_by_user_id(user_id)

    return AuthMeResponse(
        id=user_id,
        email=current_user.get("email", ""),
        role=current_user.get("role", "user"),
        profile=profile,
    )


# ═══════════════════════════════════════════════════════════════
#  Password Reset & Change
# ═══════════════════════════════════════════════════════════════

class ForgotPasswordRequest(BaseModel):
    """Solicitud de restablecimiento de contraseña."""
    email: str


class ResetPasswordRequest(BaseModel):
    """Restablecimiento de contraseña con token."""
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    """Cambio de contraseña estando autenticado."""
    current_password: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    """
    Solicita un enlace de restablecimiento de contraseña.

    Siempre devuelve 200, independientemente de si el email existe,
    para evitar la enumeración de usuarios registrados.

    Si el usuario existe, genera un token JWT de corta duración,
    construye una URL de restablecimiento y la envía por email.
    """
    email = payload.email.strip().lower()
    user = get_user_by_email(email)

    if user:
        token = create_reset_token(user["id"])
        try:
            send_reset_email(to_email=email, token=token)
        except Exception as exc:
            logger.exception(
                "Error al enviar email de restablecimiento a %s: %s",
                email, exc,
            )
            # No se interrumpe el flujo — el usuario ve confirmación igualmente

    return {
        "message": "Si el correo está registrado, recibirás un enlace en breves",
    }


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    """
    Restablece la contraseña usando un token válido.

    Valida el token (firma, expiración, no usado), hashea la nueva
    contraseña, actualiza el registro del usuario e invalida el token
    para que no pueda reutilizarse.

    Devuelve 400 si el token es inválido, ha expirado o ya fue usado.
    """
    user_id = verify_reset_token(payload.token)

    # No permitir usar la misma contraseña que la anterior
    user = users_table.get(doc_id=user_id)
    if user and verify_password(payload.new_password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la anterior",
        )

    hashed = hash_password(payload.new_password)
    update_user(user_id, {"hashed_password": hashed})

    invalidate_reset_token(payload.token)

    return {"message": "Contraseña actualizada correctamente"}


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Cambia la contraseña del usuario autenticado.

    Requiere un token JWT válido en la cabecera Authorization.
    Verifica la contraseña actual antes de actualizar.

    Devuelve 400 si la contraseña actual es incorrecta.
    """
    user_id = current_user["id"]
    user = users_table.get(doc_id=user_id)

    if user is None:
        logger.warning("Usuario autenticado (id=%s) no encontrado en la tabla users", user_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("user_not_found"),
        )

    if not verify_password(payload.current_password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta",
        )

    # No permitir usar la misma contraseña que la anterior
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la actual",
        )

    # Doble verificación: aunque el texto sea distinto, comprobar que no es
    # funcionalmente la misma (p.ej. mismo password, distinto hash por salt)
    if verify_password(payload.new_password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la anterior",
        )

    hashed = hash_password(payload.new_password)
    update_user(user_id, {"hashed_password": hashed})

    return {"message": "Contraseña actualizada correctamente"}