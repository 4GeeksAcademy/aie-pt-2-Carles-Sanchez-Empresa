"""
routes — Paquete de routers para la API de TrackFlow.

Cada módulo contiene un router de FastAPI para un dominio de negocio.
"""

from .suppliers import router as suppliers_router

__all__ = ["suppliers_router"]