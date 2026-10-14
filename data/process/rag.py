"""data/process/rag.py — Ingestión, chunking y vectorización de la base de conocimiento de TrackFlow.

Este módulo implementa la Fase 1 del pipeline RAG:
- `embed(text: str) -> list[float]`: genera vectores densos con el modelo de embeddings
  dedicado de 4Geeks (nunca el de generación).
- `setup(...)`: lee `docs/company-knowledge-base/`, divide en chunks semánticos (≥3 por doc),
  genera vectores y crea/recrea la colección `trackflow_knowledge` en Qdrant de forma idempotente.
"""

from __future__ import annotations

import os
import re
import uuid
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from dotenv import load_dotenv
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

# Cargar variables de entorno
load_dotenv()

REPO_ROOT = Path(__file__).resolve().parents[2]
DOCS_KNOWLEDGE_DIR = REPO_ROOT / "docs" / "company-knowledge-base"

# Configuración por defecto
COMPANY_NAME = "trackflow"
LANGUAGE = "es"
DEFAULT_COLLECTION_NAME = "trackflow_knowledge"
DEFAULT_QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
DEFAULT_BASE_URL = os.getenv("LLM_BASE_URL", os.getenv("OPENAI_BASE_URL", "https://llm.4geeks.ai/v1"))
DEFAULT_API_KEY = os.getenv("LLM_API_KEY", os.getenv("OPENAI_API_KEY", ""))

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    os.getenv("LLM_EMBEDDING_MODEL", "madrid-spain/openrouter/perplexity/pplx-embed-v1-0.6b"),
)
GENERATION_MODEL = os.getenv(
    "GENERATION_MODEL",
    os.getenv("LLM_GENERATION_MODEL", "madrid-spain/openrouter/deepseek/deepseek-v4-flash"),
)

# Namespace UUID determinista para idempotencia (DNS o un namespace fijo del dominio)
RAG_NAMESPACE = uuid.UUID("3d2c1b0a-4e5f-6a7b-8c9d-0e1f2a3b4c5d")

# Mapeo de nombres de archivo a identificadores de documento según CONTEXT
DOC_SOURCE_MAP = {
    "trackflow-sla-delivery.es.md": "sla-delivery",
    "trackflow-returns-policy.es.md": "returns-policy",
    "trackflow-carrier-coverage.es.md": "carrier-coverage",
    "trackflow-storage-pricing.es.md": "storage-pricing",
}


class RagConfigurationError(ValueError):
    """Error al configurar modelos o parámetros del RAG."""
    pass


def validate_model_separation() -> None:
    """Verifica que el modelo de embeddings y el de generación sean distintos."""
    embed_m = EMBEDDING_MODEL.strip() if EMBEDDING_MODEL else ""
    gen_m = GENERATION_MODEL.strip() if GENERATION_MODEL else ""
    if not embed_m:
        raise RagConfigurationError("Variable EMBEDDING_MODEL no configurada.")
    if embed_m == gen_m:
        raise RagConfigurationError(
            f"El modelo de embeddings ('{embed_m}') y el de generación ('{gen_m}') "
            "deben ser modelos distintos. Nunca reutilices el modelo de generación para embeddings."
        )


def get_openai_client(
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
) -> OpenAI:
    """Crea una instancia de OpenAI apuntando al gateway configurado."""
    return OpenAI(
        api_key=api_key or DEFAULT_API_KEY,
        base_url=base_url or DEFAULT_BASE_URL,
    )


def embed(
    text: str,
    *,
    client: Optional[OpenAI] = None,
    model: Optional[str] = None,
) -> List[float]:
    """Genera el embedding vectorial de un texto usando el modelo dedicado.

    Esta función es utilizada tanto para indexar chunks en setup() como
    para vectorizar preguntas en retrieve().
    """
    validate_model_separation()
    target_model = model or EMBEDDING_MODEL
    llm_client = client or get_openai_client()

    response = llm_client.embeddings.create(
        model=target_model,
        input=text,
    )
    return response.data[0].embedding


def chunk_document(source_id: str, content: str) -> List[Dict[str, Any]]:
    blocks = re.split(r"\n\s*\n", content.strip())
    title = source_id
    sections = []
    pending = ""

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        heading = re.fullmatch(r"#{1,6}\s+(.+)", block)
        if heading:
            if pending:
                sections.append((title, pending))
                pending = ""
            title = heading.group(1).strip()
            continue

        if pending:
            block = pending + "\n\n" + block
            pending = ""

        if block.endswith(":"):
            pending = block
        else:
            sections.append((title, block))

    if pending:
        sections.append((title, pending))

    if len(sections) < 3:
        raise ValueError(f"{source_id}: se requieren al menos 3 chunks.")

    return [
        {
            "id": str(uuid.uuid5(RAG_NAMESPACE, f"{COMPANY_NAME}:{source_id}:{index}")),
            "company": COMPANY_NAME,
            "source_document": source_id,
            "section": f"{heading} / bloque {index + 1}",
            "language": LANGUAGE,
            "chunk_index": index,
            "text": f"{heading}\n\n{text}",
        }
        for index, (heading, text) in enumerate(sections)
    ]


def load_knowledge_documents(source_dir: Path) -> List[Dict[str, Any]]:
    """Lee todos los documentos Markdown de la carpeta y extrae sus chunks."""
    all_chunks: List[Dict[str, Any]] = []

    for filename, source_id in DOC_SOURCE_MAP.items():
        doc_path = source_dir / filename
        if not doc_path.exists():
            raise FileNotFoundError(f"Documento no encontrado: {doc_path}")

        content = doc_path.read_text(encoding="utf-8")
        doc_chunks = chunk_document(source_id, content)
        all_chunks.extend(doc_chunks)

    return all_chunks


def setup(
    source_dir: Optional[Path] = None,
    qdrant_url: Optional[str] = None,
    collection_name: Optional[str] = None,
    qdrant_client: Optional[QdrantClient] = None,
    embed_fn: Optional[Callable[[str], List[float]]] = None,
) -> Dict[str, Any]:
    """Carga los documentos fuente, fragmenta en chunks, calcula embeddings e indexa en Qdrant.

    Estrategia de idempotencia:
    - Uso de IDs deterministas (UUIDv5) generados a partir de company + source_document + chunk_index.
    - Se verifica si la colección existe; si existe, se recrea de forma limpia (estrategia clean-and-reload)
      para garantizar que no queden chunks obsoletos o fragmentos huérfanos.
    """
    validate_model_separation()

    docs_dir = source_dir or DOCS_KNOWLEDGE_DIR
    target_collection = collection_name or DEFAULT_COLLECTION_NAME
    url = qdrant_url or DEFAULT_QDRANT_URL
    client = qdrant_client or QdrantClient(url=url)
    embedding_func = embed_fn or embed

    # 1. Cargar y trocear documentos
    chunks = load_knowledge_documents(docs_dir)
    if not chunks:
        raise ValueError("No se encontraron fragmentos en la carpeta de documentos.")

    # 2. Calcular los vectores antes de tocar Qdrant (fail-fast si falla el endpoint de embeddings)
    points_to_upsert: List[qmodels.PointStruct] = []
    vector_dimension: Optional[int] = None

    for chunk in chunks:
        vec = embedding_func(chunk["text"])
        if vector_dimension is None:
            vector_dimension = len(vec)
        elif len(vec) != vector_dimension:
            raise ValueError(f"Inconsistencia en la dimensión del vector: esperado {vector_dimension}, obtenido {len(vec)}")

        payload = {
            "company": chunk["company"],
            "source_document": chunk["source_document"],
            "section": chunk["section"],
            "language": chunk["language"],
            "chunk_index": chunk["chunk_index"],
            "text": chunk["text"],
        }

        points_to_upsert.append(
            qmodels.PointStruct(
                id=chunk["id"],
                vector=vec,
                payload=payload,
            )
        )

    # 3. Crear o recrear la colección en Qdrant (clean-and-reload para idempotencia)
    if client.collection_exists(target_collection):
        client.delete_collection(target_collection)

    client.create_collection(
        collection_name=target_collection,
        vectors_config=qmodels.VectorParams(
            size=vector_dimension,
            distance=qmodels.Distance.COSINE,
        ),
    )

    # 4. Insertar los puntos vectoriales
    client.upsert(
        collection_name=target_collection,
        points=points_to_upsert,
    )

    return {
        "status": "ok",
        "collection": target_collection,
        "chunks_indexed": len(points_to_upsert),
        "vector_dimension": vector_dimension,
        "documents": list(DOC_SOURCE_MAP.values()),
    }


if __name__ == "__main__":
    print("Iniciando setup() de la base de conocimiento de TrackFlow...")
    result = setup()
    print("Resultado de indexación:")
    for k, v in result.items():
        print(f"  {k}: {v}")
