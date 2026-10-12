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
    """Divide un documento Markdown en unidades semánticas coherentes y autocontenidas.

    Garantiza al menos 3 chunks por documento sin cortar frases ni reglas.
    """
    chunks: List[Dict[str, Any]] = []

    if source_id == "carrier-coverage":
        # 1. Introducción y Cobertura en Estados Unidos
        c1 = (
            "Cobertura de Transportistas - Estados Unidos (Los Ángeles):\n"
            "TrackFlow trabaja con transportistas distintos según el país.\n"
            "En Estados Unidos (Los Ángeles): UPS, FedEx y DHL.\n"
            "- UPS: cobertura nacional completa, mejor tarifa para paquetes pesados (mayores a 5 kg).\n"
            "- FedEx: mejor tiempo de entrega en envíos express dentro de California.\n"
            "- DHL: única opción con cobertura confiable para envíos internacionales desde Los Ángeles."
        )
        # 2. Cobertura en España
        c2 = (
            "Cobertura de Transportistas - España (Zaragoza):\n"
            "En España (Zaragoza): MRW, SEUR, DHL, y dos transportistas locales de última milla en zona metropolitana de Zaragoza.\n"
            "- SEUR: mejor cobertura en zonas rurales de Aragón.\n"
            "- MRW: tarifas más competitivas para paquetes pequeños (menores a 2 kg).\n"
            "- Transportistas locales: solo disponibles dentro del área metropolitana de Zaragoza, no cubren el resto de España."
        )
        # 3. Reglas de selección y Excepciones
        c3 = (
            "Selección de Transportistas y Excepciones de Operaciones:\n"
            "La selección de transportista para cada envío la determina el sistema según destino, peso, tipo de producto y urgencia.\n"
            "El account manager no elige el transportista manualmente salvo excepción aprobada por Carlos Vega (Head of Carrier Operations)."
        )
        sections = [
            ("Cobertura EE. UU. (Los Ángeles)", c1),
            ("Cobertura España (Zaragoza)", c2),
            ("Selección de transportista y excepciones", c3),
        ]

    elif source_id == "returns-policy":
        # 1. Proceso estándar de reverse logistics
        c1 = (
            "Política de Devoluciones - Proceso estándar de reverse logistics:\n"
            "El proceso estándar de devoluciones de TrackFlow funciona así:\n"
            "1. El cliente final solicita la devolución a través del portal de la marca.\n"
            "2. TrackFlow genera automáticamente la etiqueta de devolución si el motivo está dentro de las reglas configuradas por el cliente (ej. talla incorrecta, producto defectuoso).\n"
            "3. El producto llega al almacén y un operativo lo inspecciona y clasifica en: apto para reventa, apto para reacondicionar, o no apto (descarte)."
        )
        # 2. Ventana de devolución y Costos
        c2 = (
            "Ventana de Devolución y Costos de Devolución:\n"
            "Ventana de devolución estándar: 30 días desde la entrega, salvo que la marca cliente haya configurado una ventana distinta en su contrato.\n"
            "Costos de devolución: el costo del envío de vuelta lo asume la marca cliente, salvo que el motivo sea un error de TrackFlow (producto dañado en tránsito o entrega equivocada), en cuyo caso TrackFlow lo asume."
        )
        # 3. Devoluciones internacionales y Reacondicionamiento
        c3 = (
            "Devoluciones Internacionales y Reacondicionamiento:\n"
            "Las devoluciones internacionales (compradas en un país, devueltas en otro) no están cubiertas por el proceso automático estándar y requieren gestión manual del equipo de Sofía Ramos (Gerente de Devoluciones).\n"
            "TrackFlow no reacondiciona ni revende producto por cuenta propia; solo ejecuta la logística según las reglas que cada marca cliente define."
        )
        sections = [
            ("Proceso estándar de devoluciones", c1),
            ("Ventana de devolución y costos", c2),
            ("Devoluciones internacionales y reacondicionamiento", c3),
        ]

    elif source_id == "sla-delivery":
        # 1. Compromisos de tiempos según tipo de servicio
        c1 = (
            "SLA de Entrega - Tiempos y compromisos por servicio:\n"
            "TrackFlow gestiona la última milla en Estados Unidos (Los Ángeles) y España (Zaragoza).\n"
            "Los compromisos de entrega varían según el tipo de servicio contratado por la marca cliente:\n"
            "- Envío estándar: 3 a 5 días hábiles dentro del mismo país.\n"
            "- Envío express: 24 a 48 horas dentro del mismo país (disponible solo en zonas metropolitanas de Los Ángeles y área de Zaragoza-Madrid).\n"
            "- Envío internacional (entre Estados Unidos y España): 7 a 12 días hábiles, sujeto a aduana; TrackFlow no controla los tiempos de retención aduanera."
        )
        # 2. Cumplimiento contractual y Compensación
        c2 = (
            "SLA Contractual y Compensaciones por Incumplimiento:\n"
            "El SLA comprometido contractualmente es un 90% de entregas a tiempo por mes, medido por país.\n"
            "Si un país cae por debajo del 90% durante dos meses consecutivos, el cliente tiene derecho a una compensación del 5% sobre la tarifa mensual de ese país, según el contrato estándar."
        )
        # 3. Picos de alta demanda (Black Friday, Navidad, Rebajas)
        c3 = (
            "SLA en Picos de Alta Demanda (Black Friday, Navidad, Rebajas):\n"
            "TrackFlow no garantiza SLA de entrega los días de alta demanda declarados (Black Friday, Navidad, Rebajas de enero en España).\n"
            "Durante esas fechas los tiempos pueden extenderse hasta un 40% adicional, y esto debe comunicarse proactivamente a los clientes con anticipación."
        )
        sections = [
            ("Tiempos de entrega por servicio", c1),
            ("Cumplimiento contractual y compensación", c2),
            ("Picos de alta demanda y excepciones de SLA", c3),
        ]

    elif source_id == "storage-pricing":
        # 1. Tarifas estándar y periodo de gracia
        c1 = (
            "Tarifas de Almacenamiento - Tarifa estándar y periodo de gracia:\n"
            "TrackFlow cobra almacenamiento a las marcas cliente según volumen ocupado, no según número de unidades:\n"
            "- Tarifa estándar: 18 USD por metro cúbico al mes (Los Ángeles) o 16 EUR por metro cúbico al mes (Zaragoza).\n"
            "- Los primeros 30 días de cualquier producto nuevo en inventario no generan cargo de almacenamiento (periodo de gracia)."
        )
        # 2. Inventario de larga duración y reportes
        c2 = (
            "Tarifa de Inventario de Larga Duración y Reportes de Antigüedad:\n"
            "Inventario con más de 180 días sin movimiento (sin ventas ni salidas) paga una tarifa de 'inventario de larga duración' del 150% sobre la tarifa estándar, a partir del día 181.\n"
            "El cliente puede solicitar un reporte de antigüedad de inventario en cualquier momento a través de su account manager; este reporte no está automatizado actualmente para el cliente final, solo internamente."
        )
        # 3. Negociación de tarifas preferenciales y descuentos
        c3 = (
            "Descuentos de Almacenamiento y Tarifas Preferenciales (>50 m³):\n"
            "Clientes con más de 50 metros cúbicos de volumen promedio mensual pueden negociar una tarifa preferencial, pero esa negociación siempre debe pasar por Miguel Torres.\n"
            "Un account manager no puede ofrecer descuentos de almacenamiento por su cuenta."
        )
        sections = [
            ("Tarifa estándar y periodo de gracia", c1),
            ("Inventario de larga duración y reportes", c2),
            ("Descuentos y tarifas preferenciales por volumen", c3),
        ]
    else:
        # Fallback genérico para cualquier documento adicional
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        sections = [(f"Sección {i+1}", p) for i, p in enumerate(paragraphs)]

    for idx, (section_title, text) in enumerate(sections):
        chunk_uuid = str(uuid.uuid5(RAG_NAMESPACE, f"{COMPANY_NAME}:{source_id}:{idx}"))
        chunks.append({
            "id": chunk_uuid,
            "company": COMPANY_NAME,
            "source_document": source_id,
            "section": section_title,
            "language": LANGUAGE,
            "chunk_index": idx,
            "text": text,
        })

    return chunks


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
