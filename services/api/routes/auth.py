"""
routes/auth.py — Endpoints de autenticación (TrackFlow).

Gestiona el login (emisión de JWT) y la información del usuario autenticado.
"""

from json import JSONDecodeError

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ValidationError

from auth import create_access_token, get_current_user, verify_password
from database import users_table, UserQuery
from services import get_user_by_email, get_profile_by_user_id

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