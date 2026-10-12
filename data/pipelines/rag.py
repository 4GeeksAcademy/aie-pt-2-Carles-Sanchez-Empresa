"""data/pipelines/rag.py — Recuperación y generación de respuestas para TrackFlow.

Este módulo implementa la Fase 2 del pipeline RAG:
- `retrieve(query: str, *, k: int = 5, min_score: float = 0.35) -> list[dict]`:
  Embebe la consulta, busca en Qdrant, filtra por similitud mínima y devuelve los payloads.
- `generate_answer(question: str, context: list[dict]) -> str`:
  Arma el prompt usando la voz y restricciones de vendedor/account manager de TrackFlow
  y llama al modelo LLM de generación dedicado.
- `query(question: str) -> str`:
  Punto de entrada para consumidores externos: orquesta `retrieve()` + `generate_answer()`.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from openai import OpenAI
from qdrant_client import QdrantClient

from data.process.rag import (
    DEFAULT_API_KEY,
    DEFAULT_BASE_URL,
    DEFAULT_COLLECTION_NAME,
    DEFAULT_QDRANT_URL,
    GENERATION_MODEL,
    embed,
    get_openai_client,
    validate_model_separation,
)

load_dotenv()

# Umbral mínimo de similitud coseno calibrado
# (consultas relevantes obtienen scores >0.60; consultas irrelevantes obtienen <0.25)
DEFAULT_MIN_SCORE = 0.35
DEFAULT_TOP_K = 5

SYSTEM_PROMPT = """Eres un Account Manager y Asistente Comercial experto de TrackFlow, una empresa de logística de última milla y gestión de almacenes con sedes en Los Ángeles (EE. UU.) y Zaragoza (España).

Tu objetivo es responder las dudas de marcas prospecto y clientes actuales en una llamada o conversación comercial, tal como lo haría un vendedor experimentado de TrackFlow: con datos exactos, profesionales, claros y sin prometer condiciones que no existan en los acuerdos estándar.

REGLAS ESTRICTAS DE NEGOCIO:
1. Basarse exclusivamente en el contexto recuperado de la base de conocimiento oficial de TrackFlow.
2. Si el contexto está vacío o no contiene información suficiente para responder con certeza, responde honestamente indicando que la base de conocimiento no dispone de esa información o que no está contemplada en los acuerdos estándar. NUNCA inventes políticas, plazos, porcentajes ni condiciones.
3. SLA en picos de alta demanda: NUNCA garantices un SLA de entrega durante fechas de alta demanda declaradas (Black Friday, Navidad, Rebajas de enero en España). Debes indicar explícitamente que durante esas fechas los tiempos pueden extenderse hasta un 40% adicional y que se comunica con anticipación.
4. Devoluciones internacionales: NUNCA las describas como "automáticas". Aclara que no están cubiertas por el proceso automático estándar y que requieren siempre gestión manual por parte del equipo de Sofía Ramos (Gerente de Devoluciones).
5. Descuentos de almacenamiento: NUNCA ofrezcas descuentos por tu cuenta. Aclara que para volúmenes mayores a 50 metros cúbicos mensuales se puede negociar una tarifa preferencial, pero dicha negociación requiere obligatoriamente la aprobación de Miguel Torres (Director Comercial).
6. Excepciones de transportista: El account manager no selecciona transportistas manualmente salvo excepción aprobada por Carlos Vega (Head of Carrier Operations).
7. Tono: Seguro, cordial, profesional, ejecutivo y fiel a los datos contractuales. Responde en español y de forma directa, sin divagar ni exponer metadatos técnicos internos de la base de datos vectorial (como scores de similitud, chunks o IDs).
"""


def get_qdrant_client(url: Optional[str] = None) -> QdrantClient:
    """Obtiene un cliente de Qdrant configurado."""
    return QdrantClient(url=url or DEFAULT_QDRANT_URL)


def retrieve(
    query: str,
    *,
    k: int = DEFAULT_TOP_K,
    min_score: float = DEFAULT_MIN_SCORE,
    collection_name: Optional[str] = None,
    qdrant_client: Optional[QdrantClient] = None,
) -> List[Dict[str, Any]]:
    """Embebe la consulta, busca en Qdrant y filtra fragmentos bajo el umbral min_score.

    Retorna una lista de diccionarios con el payload de cada chunk superviviente
    (incluyendo el campo adicional `score` para trazabilidad interna).
    """
    if not query or not query.strip():
        return []

    target_collection = collection_name or DEFAULT_COLLECTION_NAME
    client = qdrant_client or get_qdrant_client()

    # 1. Generar embedding con la función dedicada
    query_vector = embed(query.strip())

    # 2. Consultar Qdrant
    search_response = client.query_points(
        collection_name=target_collection,
        query=query_vector,
        limit=k,
        with_payload=True,
    )

    # 3. Filtrar por score mínimo y extraer payloads limpios
    filtered_payloads: List[Dict[str, Any]] = []
    for hit in search_response.points:
        score = float(hit.score)
        if score >= min_score:
            payload = dict(hit.payload or {})
            payload["score"] = round(score, 4)
            filtered_payloads.append(payload)

    return filtered_payloads


def generate_answer(
    question: str,
    context: List[Dict[str, Any]],
    *,
    client: Optional[OpenAI] = None,
    model: Optional[str] = None,
) -> str:
    """Genera una respuesta en lenguaje natural utilizando el contexto recuperado.

    Si context es vacío (ningún fragmento superó el umbral), responde con honestidad
    sin inventar información.
    """
    validate_model_separation()

    # Manejo honesto de falta de contexto sin llamar al modelo o instruyendo fallback estricto
    if not context:
        return (
            "Lo lamento, pero en los acuerdos estándar y la base de conocimiento oficial "
            "de TrackFlow no disponemos de información suficiente para responder a esta consulta. "
            "Para casos particulares o condiciones no documentadas, le sugiero consultar con "
            "el equipo correspondiente o con la dirección comercial."
        )

    # Construir bloque de contexto a partir de los chunks recuperados
    context_blocks: List[str] = []
    for i, chunk in enumerate(context, 1):
        doc = chunk.get("source_document", "documento")
        section = chunk.get("section", "sección general")
        text = chunk.get("text", "").strip()
        context_blocks.append(f"--- Documento [{i}]: {doc} (Sección: {section}) ---\n{text}")

    formatted_context = "\n\n".join(context_blocks)

    user_message = (
        f"PREGUNTA DEL CLIENTE / PROSPECTO:\n{question}\n\n"
        f"CONTEXTO DOCUMENTADO OFICIAL DE TRACKFLOW:\n{formatted_context}\n\n"
        "Por favor, responde a la pregunta del cliente usando únicamente la información del contexto anterior "
        "y respetando rigurosamente las políticas y restricciones de negocio de TrackFlow."
    )

    llm_client = client or get_openai_client()
    gen_model = model or GENERATION_MODEL

    response = llm_client.chat.completions.create(
        model=gen_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.1,
        max_tokens=600,
    )

    choice = response.choices[0]
    # Extraer contenido de la respuesta
    answer = choice.message.content
    if not answer and hasattr(choice.message, "reasoning_content") and choice.message.reasoning_content:
        # En caso de modelos de reasoning que devuelvan la respuesta en el bloque de reasoning
        answer = choice.message.reasoning_content

    return (answer or "").strip()


def query(question: str) -> str:
    """Orquesta la recuperación y la generación para responder a una consulta externa.

    Esta es la única función que deben llamar los consumidores externos (API, UI, etc.).
    """
    retrieved_chunks = retrieve(question)
    return generate_answer(question, retrieved_chunks)


if __name__ == "__main__":
    test_q = "¿Cuál es la ventana de devolución estándar y cómo se gestionan las internacionales?"
    print(f"Pregunta de prueba:\n{test_q}\n")
    print("Ejecutando query()...\n")
    resp = query(test_q)
    print("Respuesta generada:")
    print(resp)
