"""
routes/profiles.py — Endpoints de perfiles de usuario (TrackFlow).

Cada usuario tiene un perfil vinculado 1:1 con nombre, teléfono y dirección.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import get_current_user
from services import get_profile_by_user_id, update_profile, create_profile

router = APIRouter(prefix="/profiles", tags=["Profiles"])


# ───────────────────── Schemas ─────────────────────

class ProfileUpdate(BaseModel):
    """Esquema para actualizar el perfil del usuario autenticado."""
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class ProfileResponse(BaseModel):
    """Esquema de respuesta del perfil."""
    id: int
    user_id: int
    name: str
    phone: str
    address: str
    created_at: str
    updated_at: str


# ───────────────────── Endpoints ─────────────────────

@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Devuelve el perfil del usuario autenticado.

    Si el perfil no existe, lo crea automáticamente con valores vacíos.
    """
    user_id = current_user["id"]
    profile = get_profile_by_user_id(user_id)

    if profile is None:
        # Auto-crear perfil si no existe
        profile = create_profile(user_id=user_id)

    return ProfileResponse(**profile)


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Actualiza el perfil del usuario autenticado.

    Solo el dueño del perfil puede modificarlo (controlado por get_current_user).
    """
    user_id = current_user["id"]

    # Verificar que existe el perfil, si no, crearlo
    existing = get_profile_by_user_id(user_id)
    if existing is None:
        profile = create_profile(user_id=user_id)
    else:
        profile = existing

    # Construir datos a actualizar (solo campos enviados)
    data = {}
    if payload.name is not None:
        data["name"] = payload.name
    if payload.phone is not None:
        data["phone"] = payload.phone
    if payload.address is not None:
        data["address"] = payload.address

    if not data:
        return ProfileResponse(**profile)

    updated = update_profile(user_id, data)
    return ProfileResponse(**updated)