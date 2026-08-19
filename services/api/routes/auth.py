"""
routes/auth.py — Endpoints de autenticación (TrackFlow).

Gestiona el login (emisión de JWT) y la información del usuario autenticado.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import create_access_token, get_current_user, verify_password
from database import users_table, UserQuery
from services import get_user_by_email, get_profile_by_user_id

router = APIRouter(prefix="/auth", tags=["Auth"])


# ───────────────────── Schemas ─────────────────────

class LoginRequest(BaseModel):
    """Credenciales de inicio de sesión."""
    email: str
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
async def login(payload: LoginRequest):
    """
    Inicio de sesión.

    Valida email y contraseña, y devuelve un token JWT firmado.

    El token debe incluirse en las peticiones protegidas como:
        Authorization: Bearer <token>
    """
    # Buscar usuario por email
    user = get_user_by_email(payload.email.strip().lower())

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar contraseña
    hashed = user.get("hashed_password", "")
    if not verify_password(payload.password, hashed):
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