"""
services.py — Capa de servicios para usuarios y perfiles (TrackFlow).

Contiene las funciones de negocio para operar con las tablas TinyDB
de users y profiles, separadas de la lógica HTTP de los routers.
"""

from datetime import datetime, timezone
from typing import Optional

from database import users_table, profiles_table, UserQuery, ProfileQuery
from auth import hash_password
from models import generate_timestamp


# ════════════════════════════ USUARIOS ════════════════════════════

def create_user(
    email: str,
    password: str,
    role: str = "user",
) -> dict:
    """
    Crea un nuevo usuario con contraseña hasheada.

    Args:
        email: Email único del usuario (se normaliza a minúsculas).
        password: Contraseña en texto plano (se hashea antes de guardar).
        role: Rol del usuario. Por defecto "user".

    Returns:
        Diccionario con los datos del usuario creado (sin contraseña).

    Raises:
        ValueError: Si el email ya está registrado.
    """
    # Normalizar email a minúsculas para garantizar unicidad case-insensitive
    email_normalized = email.strip().lower()

    # Verificar email único (case-insensitive)
    existing = users_table.get(UserQuery.email == email_normalized)
    if existing:
        raise ValueError(f"El email '{email}' ya está registrado")

    now = generate_timestamp()

    doc = {
        "email": email_normalized,
        "hashed_password": hash_password(password),
        "role": role,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    doc_id = users_table.insert(doc)
    doc["id"] = doc_id

    # No devolver la contraseña
    return _sanitize_user(doc)


def get_user_by_id(user_id: int) -> Optional[dict]:
    """Obtiene un usuario por su ID (doc_id de TinyDB)."""
    doc = users_table.get(doc_id=user_id)
    if doc is None:
        return None
    doc["id"] = user_id
    return _sanitize_user(doc)


def get_user_by_email(email: str) -> Optional[dict]:
    """Obtiene un usuario por su email (incluye contraseña para login).

    La búsqueda es case-insensitive: normaliza el email a minúsculas.
    """
    doc = users_table.get(UserQuery.email == email.strip().lower())
    if doc is None:
        return None
    doc["id"] = doc.doc_id if hasattr(doc, "doc_id") else None
    return dict(doc)


def get_all_users() -> list[dict]:
    """Obtiene todos los usuarios (sin contraseñas)."""
    users = []
    for doc in users_table.all():
        doc_id = doc.doc_id if hasattr(doc, "doc_id") else doc.get("id")
        if doc_id is None:
            continue
        doc_dict = dict(doc)
        doc_dict["id"] = doc_id
        users.append(_sanitize_user(doc_dict))
    return users


def update_user(user_id: int, data: dict) -> Optional[dict]:
    """
    Actualiza un usuario existente.

    Normaliza el email a minúsculas si se proporciona.

    Args:
        user_id: ID del usuario a actualizar.
        data: Diccionario con los campos a actualizar.

    Returns:
        Usuario actualizado (sin contraseña), o None si no existe.
    """
    doc = users_table.get(doc_id=user_id)
    if doc is None:
        return None

    # Normalizar email si se está actualizando
    if "email" in data and data["email"] is not None:
        data["email"] = data["email"].strip().lower()

        # Verificar que el nuevo email no esté en uso por otro usuario
        existing = users_table.get(UserQuery.email == data["email"])
        if existing and existing.doc_id != user_id:
            raise ValueError(f"El email '{data['email']}' ya está registrado")

    data["updated_at"] = generate_timestamp()
    users_table.update(data, doc_ids=[user_id])

    updated = users_table.get(doc_id=user_id)
    updated["id"] = user_id
    return _sanitize_user(updated)


def delete_user(user_id: int) -> bool:
    """
    Elimina un usuario y su perfil vinculado.

    Returns:
        True si se eliminó, False si no existía.
    """
    doc = users_table.get(doc_id=user_id)
    if doc is None:
        return False

    # Eliminar perfil vinculado
    profile = profiles_table.get(ProfileQuery.user_id == user_id)
    if profile:
        profile_id = profile.doc_id if hasattr(profile, "doc_id") else None
        if profile_id is not None:
            profiles_table.remove(doc_ids=[profile_id])
        else:
            profiles_table.remove(ProfileQuery.user_id == user_id)

    # Eliminar usuario
    users_table.remove(doc_ids=[user_id])
    return True


# ════════════════════════════ PERFILES ════════════════════════════

def create_profile(
    user_id: int,
    name: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[str] = None,
) -> dict:
    """
    Crea un perfil vinculado a un usuario.

    Args:
        user_id: ID del usuario al que pertenece el perfil.
        name: Nombre visible del usuario.
        phone: Teléfono de contacto.
        address: Dirección postal.

    Returns:
        Diccionario con los datos del perfil creado.
    """
    now = generate_timestamp()

    doc = {
        "user_id": user_id,
        "name": name or "",
        "phone": phone or "",
        "address": address or "",
        "created_at": now,
        "updated_at": now,
    }

    doc_id = profiles_table.insert(doc)
    doc["id"] = doc_id
    return doc


def get_profile_by_user_id(user_id: int) -> Optional[dict]:
    """Obtiene el perfil de un usuario por su user_id."""
    doc = profiles_table.get(ProfileQuery.user_id == user_id)
    if doc is None:
        return None
    doc_dict = dict(doc)
    doc_id = doc.doc_id if hasattr(doc, "doc_id") else doc_dict.get("id")
    doc_dict["id"] = doc_id
    return doc_dict


def update_profile(user_id: int, data: dict) -> Optional[dict]:
    """
    Actualiza el perfil de un usuario.

    Args:
        user_id: ID del usuario dueño del perfil.
        data: Diccionario con campos a actualizar (name, phone, address).

    Returns:
        Perfil actualizado, o None si no existe.
    """
    profile = profiles_table.get(ProfileQuery.user_id == user_id)
    if profile is None:
        return None

    data["updated_at"] = generate_timestamp()
    profile_id = profile.doc_id if hasattr(profile, "doc_id") else None

    if profile_id is not None:
        profiles_table.update(data, doc_ids=[profile_id])
    else:
        profiles_table.update(data, ProfileQuery.user_id == user_id)

    return get_profile_by_user_id(user_id)


# ════════════════════════════ HELPERS ════════════════════════════

def _sanitize_user(user: dict) -> dict:
    """Elimina el campo hashed_password del diccionario de usuario."""
    user.pop("hashed_password", None)
    return user