"""tests/pipelines/test_rag.py — Pruebas unitarias para retrieve() y query() del pipeline RAG.

Todas las pruebas se ejecutan de manera aislada y offline:
- Qdrant se simula mediante mocks o fakes en memoria (sin contenedor ni servicio en vivo).
- El modelo de embeddings y el LLM de generación se simulan sin llamadas de red.
- Se verifican exclusiones por min_score, retorno de menos de k resultados,
  generación con LLM y que nunca se devuelva texto crudo de chunks sin procesar.
"""

from __future__ import annotations

from contextlib import closing
from unittest.mock import MagicMock, patch
import pytest

from data.pipelines.rag import (
    DEFAULT_MIN_SCORE,
    generate_answer,
    query,
    retrieve,
)
from data.process import rag as ingestion
from qdrant_client import QdrantClient


@pytest.mark.parametrize("filename,source_id", list(ingestion.DOC_SOURCE_MAP.items()))
def test_setup_reindexes_updated_markdown_without_stale_points(tmp_path, monkeypatch, filename, source_id):
    monkeypatch.setattr(ingestion, "validate_model_separation", lambda: None)
    original = (
        "# Politica de prueba\n\nTarifas aplicables:\n\n"
        "- Precio: 18 USD.\n- Gracia: 30 dias, salvo excepcion contractual.\n\n"
        "Las devoluciones internacionales requieren gestion manual.\n\n"
        "Los descuentos requieren aprobacion.\n\nRegla obsoleta de prueba."
    )
    for document_filename in ingestion.DOC_SOURCE_MAP:
        (tmp_path / document_filename).write_text(original, encoding="utf-8")

    embedding = MagicMock(side_effect=lambda text: [1.0, 2.0] if "20 USD" in text else [2.0, 1.0])
    with closing(QdrantClient(":memory:")) as client:
        first = ingestion.setup(source_dir=tmp_path, qdrant_client=client, embed_fn=embedding)
        before, _ = client.scroll("trackflow_knowledge", limit=100, with_payload=True, with_vectors=True)
        previous = [point for point in before if point.payload["source_document"] == source_id]
        assert len(previous) == 4
        assert "18 USD" in next(point for point in previous if point.payload["chunk_index"] == 0).payload["text"]

        updated = original.replace("18 USD", "20 USD").replace("\n\nRegla obsoleta de prueba.", "")
        (tmp_path / filename).write_text(updated, encoding="utf-8")
        embedding.reset_mock()
        second = ingestion.setup(source_dir=tmp_path, qdrant_client=client, embed_fn=embedding)
        after, _ = client.scroll("trackflow_knowledge", limit=100, with_payload=True, with_vectors=True)
        current = [point for point in after if point.payload["source_document"] == source_id]

        assert len(current) == 3
        assert second["chunks_indexed"] == first["chunks_indexed"] - 1
        assert client.count("trackflow_knowledge", exact=True).count == second["chunks_indexed"]
        assert {point.id for point in current} == {
            point.id for point in previous if point.payload["chunk_index"] < 3
        }
        price_point = next(point for point in current if point.payload["chunk_index"] == 0)
        assert "20 USD" in price_point.payload["text"]
        assert "18 USD" not in price_point.payload["text"]
        assert "salvo excepcion contractual" in price_point.payload["text"]
        assert price_point.vector != next(point for point in previous if point.id == price_point.id).vector
        assert any("20 USD" in call.args[0] for call in embedding.call_args_list)
        assert all("Regla obsoleta" not in point.payload["text"] for point in current)


class MockScoredPoint:
    """Simula un punto retornado por Qdrant client.query_points."""

    def __init__(self, point_id: str, score: float, payload: dict):
        self.id = point_id
        self.score = score
        self.payload = payload


class MockQueryPointsResponse:
    """Simula la respuesta del método query_points del cliente Qdrant."""

    def __init__(self, points: list[MockScoredPoint]):
        self.points = points


# ─────────────────────────────────────────────────────────────
# 1. Pruebas unitarias de retrieve()
# ─────────────────────────────────────────────────────────────

class TestRetrieve:
    """Verifica el comportamiento de retrieve() con cliente Qdrant simulado."""

    @pytest.fixture(autouse=True)
    def mock_embed(self, monkeypatch):
        """Mockea la función embed para evitar llamadas a la API de embeddings."""
        monkeypatch.setattr("data.pipelines.rag.embed", lambda text: [0.1] * 1024)

    def test_retrieve_empty_query_returns_empty_list(self):
        """Consultas vacías o solo espacios deben devolver lista vacía sin llamar a Qdrant."""
        assert retrieve("") == []
        assert retrieve("   ") == []

    def test_retrieve_filters_results_below_min_score(self):
        """Verifica que los resultados con score estrictamente menor a min_score son excluidos."""
        mock_points = [
            MockScoredPoint(
                "p1",
                0.85,
                {
                    "source_document": "returns-policy",
                    "section": "Ventana de devolución",
                    "text": "Ventana de 30 días",
                },
            ),
            MockScoredPoint(
                "p2",
                0.50,
                {
                    "source_document": "returns-policy",
                    "section": "Costos",
                    "text": "Costos a cargo del cliente",
                },
            ),
            MockScoredPoint(
                "p3",
                0.20,  # Bajo el umbral (0.35)
                {
                    "source_document": "storage-pricing",
                    "section": "Tarifas",
                    "text": "Tarifa estándar 18 USD",
                },
            ),
        ]

        mock_client = MagicMock()
        mock_client.query_points.return_value = MockQueryPointsResponse(mock_points)

        results = retrieve(
            "¿Cuál es el plazo de devolución?",
            k=5,
            min_score=0.35,
            qdrant_client=mock_client,
        )

        # Solo p1 (0.85) y p2 (0.50) deben sobrevivir
        assert len(results) == 2
        assert results[0]["source_document"] == "returns-policy"
        assert results[0]["score"] == 0.85
        assert results[1]["score"] == 0.50
        assert not any(r["source_document"] == "storage-pricing" for r in results)

    def test_retrieve_can_return_fewer_than_k_results(self):
        """Verifica que se pueden devolver menos de k resultados si pocos superan el umbral."""
        # Se solicitan k=5, pero solo 1 supera el umbral
        mock_points = [
            MockScoredPoint("p1", 0.72, {"text": "Chunk relevante", "source_document": "sla-delivery"}),
            MockScoredPoint("p2", 0.30, {"text": "Chunk irrelevante 1", "source_document": "carrier-coverage"}),
            MockScoredPoint("p3", 0.15, {"text": "Chunk irrelevante 2", "source_document": "storage-pricing"}),
        ]

        mock_client = MagicMock()
        mock_client.query_points.return_value = MockQueryPointsResponse(mock_points)

        results = retrieve(
            "¿Cuál es el SLA de entrega?",
            k=5,
            min_score=0.50,
            qdrant_client=mock_client,
        )

        assert len(results) == 1
        assert len(results) < 5
        assert results[0]["text"] == "Chunk relevante"

    def test_retrieve_returns_empty_when_no_point_clears_threshold(self):
        """Cuando ningún punto supera min_score, retrieve debe devolver lista vacía."""
        mock_points = [
            MockScoredPoint("p1", 0.25, {"text": "Fuera de tema 1"}),
            MockScoredPoint("p2", 0.18, {"text": "Fuera de tema 2"}),
        ]

        mock_client = MagicMock()
        mock_client.query_points.return_value = MockQueryPointsResponse(mock_points)

        results = retrieve(
            "¿Cuál es el menú del restaurante?",
            k=3,
            min_score=0.35,
            qdrant_client=mock_client,
        )

        assert results == []

    def test_retrieve_returns_clean_dicts_not_qdrant_objects(self):
        """Verifica que la salida contiene diccionarios planos (payload) y no objetos de Qdrant."""
        mock_points = [
            MockScoredPoint("p1", 0.65, {"company": "trackflow", "source_document": "sla-delivery", "text": "Texto"}),
        ]
        mock_client = MagicMock()
        mock_client.query_points.return_value = MockQueryPointsResponse(mock_points)

        results = retrieve("SLA", k=1, min_score=0.1, qdrant_client=mock_client)
        assert isinstance(results, list)
        assert len(results) == 1
        assert isinstance(results[0], dict)
        assert not isinstance(results[0], MockScoredPoint)
        assert "score" in results[0]
        assert results[0]["company"] == "trackflow"


# ─────────────────────────────────────────────────────────────
# 2. Pruebas unitarias de generate_answer() y query()
# ─────────────────────────────────────────────────────────────

class TestQueryAndGeneration:
    """Verifica el comportamiento de query() y generate_answer() con LLM y retrieval simulados."""

    def test_generate_answer_returns_honest_fallback_when_context_empty(self):
        """Si context está vacío, generate_answer devuelve honestamente la falta de información sin llamar al LLM."""
        with patch("data.pipelines.rag.get_openai_client") as mock_get_client:
            answer = generate_answer("¿Cuánto cuesta la pizza?", context=[])

            # No se debe gastar cuota llamando al LLM si no hay contexto
            mock_get_client.assert_not_called()
            assert "no disponemos de información suficiente" in answer.lower()

    def test_query_returns_model_output_and_not_raw_chunk_text(self, monkeypatch):
        """Verifica que query() devuelve la síntesis generada por el LLM y nunca el texto crudo del chunk."""
        raw_chunk_text = "RAW_CHUNK_BODY: Tarifa estándar 18 USD por m3 al mes en Los Ángeles."
        generated_model_answer = (
            "Como Account Manager de TrackFlow, le informo que nuestra tarifa estándar en Los Ángeles "
            "es de 18 USD por metro cúbico al mes."
        )

        fake_chunks = [
            {
                "source_document": "storage-pricing",
                "section": "Tarifa estándar",
                "text": raw_chunk_text,
                "score": 0.78,
            }
        ]

        # 1. Simular retrieve() devolviendo fake_chunks
        monkeypatch.setattr("data.pipelines.rag.retrieve", lambda q: fake_chunks)

        # 2. Simular llamada al LLM
        mock_openai_client = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = generated_model_answer
        mock_choice.message.reasoning_content = None
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_openai_client.chat.completions.create.return_value = mock_response
        
        monkeypatch.setattr("data.pipelines.rag.get_openai_client", lambda: mock_openai_client)

        result = query("¿Cuál es la tarifa de almacenamiento en Los Ángeles?")

        # Debe devolver exactamente lo generado por el modelo
        assert result == generated_model_answer
        # No debe ser el volcado directo del chunk crudo
        assert result != raw_chunk_text
        assert not result.startswith("RAW_CHUNK_BODY:")

        # Verificar que se llamó al LLM con el modelo configurado
        mock_openai_client.chat.completions.create.assert_called_once()
        call_kwargs = mock_openai_client.chat.completions.create.call_args.kwargs
        assert len(call_kwargs["messages"]) == 2
        assert "agente de primera línea de CX de TrackFlow" in call_kwargs["messages"][0]["content"]
        assert raw_chunk_text in call_kwargs["messages"][1]["content"]

    def test_query_when_retrieve_finds_nothing(self, monkeypatch):
        """Si retrieve() no encuentra nada por encima del umbral, query() devuelve el fallback honesto."""
        monkeypatch.setattr("data.pipelines.rag.retrieve", lambda q: [])

        result = query("¿Pregunta sin respuesta?")
        assert "no disponemos de información suficiente" in result.lower()
