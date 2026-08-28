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
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.hash import bcrypt

from database import users_table

# ───────────────────── Cargar configuración ─────────────────────

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-insecure-key")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

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

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependencia de FastAPI que extrae y valida el token JWT,
    busca el usuario en TinyDB y lo devuelve.

    Lanza HTTPException(401) si:
      - El token no es válido
      - El token ha expirado
      - El usuario no existe en la base de datos
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
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

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependencia que verifica que el usuario autenticado sea administrador.

    Lanza HTTPException(403) si el usuario no tiene rol 'admin'.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador para acceder a este recurso",
        )
    return current_user