"""Pipeline dedicado de intake RFP, aislado del grafo CX/RAG."""

from .pipeline import process_ticket

__all__ = ["process_ticket"]
