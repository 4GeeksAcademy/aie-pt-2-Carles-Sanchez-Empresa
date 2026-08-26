"""
auth.py — Autenticación JWT para TrackFlow API.

Proporciona:
  - hash_password / verify_password (usando libpass/bcrypt)
  - create_access_token (firmado con python-jose)
  - get_current_user (dependencia FastAPI reutilizable)
  - require_admin (dependencia para rutas de solo administradores)

Configuración vía variables de entorno (.env):
  - SECRET_KEY: clave de firma del JWT
  - ACCESS_TOKEN_EXPIRE_MINUTES: minutos hasta expiración del token
  - RESET_TOKEN_EXPIRE_MINUTES: minutos hasta expiración del token de restablecimiento (default 60)
"""

import hashlib
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.hash import bcrypt

from database import users_table, used_tokens_table, TokenQuery
from i18n import get_translator, get_language_from_request

# ───────────────────── Cargar configuración ─────────────────────

# Carga el .env desde la raíz del proyecto
dotenv_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path)

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-insecure-key")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "60"))

ALGORITHM = "HS256"

# ───────────────────── OAuth2 scheme ─────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ───────────────────── Password hashing ─────────────────────

def hash_password(password: str) -> str:
    """Hashea una contraseña en texto plano usando bcrypt."""
    return bcrypt.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña en texto plano contra su hash bcrypt."""
    return bcrypt.verify(plain_password, hashed_password)


# ───────────────────── JWT ─────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea y firma un token JWT.

    Args:
        data: Diccionario con los claims. Debe incluir "sub" (user_id).
        expires_delta: Tiempo hasta expiración (opcional, usa el de .env por defecto).

    Returns:
        Token JWT como string.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ───────────────────── Dependencia: get_current_user ─────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    request: Request = None,
) -> dict:
    """
    Dependencia de FastAPI que extrae y valida el token JWT,
    busca el usuario en TinyDB y lo devuelve.

    Lanza HTTPException(401) si:
      - El token no es válido
      - El token ha expirado
      - El usuario no existe en la base de datos
    """
    lang = get_language_from_request(request) if request else "es"
    t = get_translator(lang)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=t("credentials_invalid"),
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id_int = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = users_table.get(doc_id=user_id_int)
    if user is None:
        raise credentials_exception

    # Añadir el id al dict para facilitar el acceso
    user["id"] = user_id_int
    return user


# ───────────────────── Dependencia: require_admin ─────────────────────

async def require_admin(
    current_user: dict = Depends(get_current_user),
    request: Request = None,
) -> dict:
    """
    Dependencia que verifica que el usuario autenticado sea administrador.

    Lanza HTTPException(403) si el usuario no tiene rol 'admin'.
    """
    if current_user.get("role") != "admin":
        lang = get_language_from_request(request) if request else "es"
        t = get_translator(lang)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("admin_required"),
        )
    return current_user


# ───────────────────── Reset token helpers ─────────────────────

def _hash_token(token: str) -> str:
    """Hashea un token para almacenamiento seguro en la tabla used_tokens."""
    return hashlib.sha256(token.encode()).hexdigest()


def create_reset_token(user_id: int) -> str:
    """
    Crea un JWT de corta duración para restablecimiento de contraseña.

    Args:
        user_id: ID del usuario que solicita el restablecimiento.

    Returns:
        Token JWT como string.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "reset",
        # jti único para poder invalidar individualmente
        "jti": hashlib.sha256(os.urandom(32)).hexdigest()[:16],
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_reset_token(token: str, lang: str = "es") -> int:
    """
    Verifica un token de restablecimiento.

    Comprueba:
      1. Firma JWT válida
      2. Token no expirado
      3. Tipo 'reset'
      4. Token no ha sido usado ya (no está en used_tokens)

    Args:
        token: El token JWT a verificar.
        lang: Código de idioma para los mensajes de error.

    Returns:
        user_id (int) si el token es válido.

    Raises:
        HTTPException(400) si el token es inválido, expirado o ya usado.
    """
    t = get_translator(lang)
    invalid_error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=t("reset_link_invalid"),
    )

    used_error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=t("reset_link_used"),
    )

    # 1. Verificar firma y expiración
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise invalid_error

    # 2. Verificar tipo
    if payload.get("type") != "reset":
        raise invalid_error

    # 3. Verificar que no esté usado
    token_hash = _hash_token(token)
    if used_tokens_table.contains(TokenQuery.token_hash == token_hash):
        raise used_error

    return int(payload["sub"])


def invalidate_reset_token(token: str) -> None:
    """
    Invalida un token de restablecimiento guardándolo (hasheado) en used_tokens.

    Esto evita que un token pueda reutilizarse aunque no haya expirado.
    """
    token_hash = _hash_token(token)
    used_tokens_table.insert({
        "token_hash": token_hash,
        "invalidated_at": datetime.now(timezone.utc).isoformat(),
    })