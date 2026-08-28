"""
routes — Paquete de routers para la API de TrackFlow.

Cada módulo contiene un router de FastAPI para un dominio de negocio.
"""

from .suppliers import router as suppliers_router
from .users import router as users_router
from .profiles import router as profiles_router
from .auth import router as auth_router

__all__ = [
    "suppliers_router",
    "users_router",
    "profiles_router",
    "auth_router",
]