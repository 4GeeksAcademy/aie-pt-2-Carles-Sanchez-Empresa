"""
routes/users.py — Endpoints de gestión de usuarios (TrackFlow).

CRUD completo de usuarios con control de roles y contraseñas hasheadas.
"""

from enum import Enum
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator

from auth import get_current_user, require_admin
from services import (
    create_user,
    get_user_by_id,
    get_all_users,
    update_user,
    delete_user,
    create_profile,
)

router = APIRouter(prefix="/users", tags=["Users"])


# ───────────────────── Schemas ─────────────────────

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


class UserCreate(BaseModel):
    """Esquema para crear un nuevo usuario."""
    email: str
    password: str = ...
    role: UserRole = UserRole.USER
    # Campos opcionales de perfil (se crean junto con el usuario)
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v or "@" not in v:
            raise ValueError("Email inválido")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v


class UserUpdate(BaseModel):
    """Esquema para actualizar un usuario (solo admin o propio usuario)."""
    email: Optional[str] = None
    role: Optional[UserRole] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and "@" not in v:
            raise ValueError("Email inválido")
        return v.strip().lower() if v else v


class UserResponse(BaseModel):
    """Esquema de respuesta de usuario (nunca incluye la contraseña)."""
    id: int
    email: str
    role: str
    is_active: bool
    created_at: str
    updated_at: str


class UserWithProfileResponse(BaseModel):
    """Respuesta de usuario incluyendo perfil (para POST /users con perfil)."""
    user: UserResponse
    profile: Optional[dict] = None


# ───────────────────── Endpoints ─────────────────────

@router.post("", response_model=UserWithProfileResponse, status_code=201)
async def register_user(payload: UserCreate):
    """
    Registra un nuevo usuario.

    - Hashea la contraseña antes de guardar.
    - Si se proporcionan name, phone o address, crea el perfil vinculado.
    - El rol por defecto es 'user'.
    """
    try:
        user = create_user(
            email=payload.email,
            password=payload.password,
            role=payload.role.value if isinstance(payload.role, UserRole) else payload.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    # Crear perfil si se proporcionaron datos
    profile = None
    if payload.name or payload.phone or payload.address:
        profile = create_profile(
            user_id=user["id"],
            name=payload.name,
            phone=payload.phone,
            address=payload.address,
        )

    return UserWithProfileResponse(user=UserResponse(**user), profile=profile)


@router.get("", response_model=list[UserResponse])
async def list_users(current_user: dict = Depends(require_admin)):
    """
    Lista todos los usuarios registrados.

    Solo accesible por administradores.
    """
    return get_all_users()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, current_user: dict = Depends(get_current_user)):
    """
    Obtiene un usuario por su ID.

    Solo el propio usuario o un administrador pueden acceder.
    """
    # Control de acceso: solo el propio usuario o admin
    if current_user["id"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este usuario",
        )

    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return UserResponse(**user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Actualiza un usuario existente.

    Solo el propio usuario o un administrador pueden modificar.
    Solo los administradores pueden cambiar el rol.
    """
    # Control de acceso
    is_self = current_user["id"] == user_id
    is_admin = current_user.get("role") == "admin"

    if not is_self and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para modificar este usuario",
        )

    # Solo admin puede cambiar el rol
    if payload.role is not None and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden cambiar el rol",
        )

    # Construir datos a actualizar
    data = {}
    if payload.email is not None:
        data["email"] = payload.email
    if payload.role is not None:
        data["role"] = payload.role.value if isinstance(payload.role, UserRole) else payload.role

    if not data:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")

    user = update_user(user_id, data)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return UserResponse(**user)


@router.delete("/{user_id}", status_code=200)
async def delete_user_endpoint(
    user_id: int,
    current_user: dict = Depends(require_admin),
):
    """
    Elimina un usuario y su perfil vinculado.

    Solo accesible por administradores.
    """
    if current_user["id"] == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminarte a ti mismo",
        )

    deleted = delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"message": "Usuario y perfil eliminados correctamente", "id": user_id}