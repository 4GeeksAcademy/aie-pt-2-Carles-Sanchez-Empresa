"""services/api/routes/knowledge.py — Router para consultas a la base de conocimiento RAG.

Expone el endpoint POST /knowledge/query (y POST /api/knowledge/query para clientes con proxy).
Importa directamente query() desde data/pipelines/rag sin duplicar lógica.
Garantiza que solo se retorne la respuesta generada por el LLM, sin volcar chunks ni metadatos.
"""

from __future__ import annotations

import logging
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from data.pipelines.rag import query
from support_agent.rate_limit import enforce_actor_rate_limit

logger = logging.getLogger("trackflow.knowledge")

router = APIRouter(tags=["Knowledge Base"])


class KnowledgeQueryRequest(BaseModel):
    """Cuerpo de petición para consultar la base de conocimiento."""
    question: str = Field(..., min_length=1, max_length=10000, description="Pregunta en lenguaje natural")


class KnowledgeQueryResponse(BaseModel):
    """Cuerpo de respuesta conteniendo únicamente el string generado por el modelo."""
    answer: str = Field(..., description="Respuesta final generada a partir del contexto recuperado")


def enforce_knowledge_rate_limit(current_user: dict = Depends(get_current_user)) -> None:
    enforce_actor_rate_limit(current_user["id"])


@router.post(
    "/knowledge/query",
    response_model=KnowledgeQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Consultar base de conocimiento",
    description="Responde preguntas de clientes/prospectos con la voz y acuerdos estándar de TrackFlow.",
)
@router.post(
    "/api/knowledge/query",
    response_model=KnowledgeQueryResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def handle_knowledge_query(
    payload: KnowledgeQueryRequest,
    _rate_limit: None = Depends(enforce_knowledge_rate_limit),
) -> KnowledgeQueryResponse:
    """Procesa una consulta contra la base de conocimiento de TrackFlow."""
    question = payload.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La pregunta no puede estar vacía.",
        )

    try:
        answer = query(question)
        return KnowledgeQueryResponse(answer=answer)
    except Exception as exc:
        logger.exception("Error al procesar consulta en la base de conocimiento: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El servicio de consulta de conocimiento no está disponible temporalmente.",
        ) from exc
