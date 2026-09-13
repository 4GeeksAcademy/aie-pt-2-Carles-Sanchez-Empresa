"""
test_telemetry.py — Tests del endpoint real de telemetría (TrackFlow).

Fase 3 — Persistencia en Supabase con bulk insert.

Cubre:
  - Endpoint stub vs real (verificar que responden diferente)
  - Envío exitoso de eventos
  - Rechazo de eventos malformados
  - Deduplicación de web_vital_measured
  - Persistencia en base de datos
  - Lotes vacíos
"""

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# ── Configurar entorno para tests ──
os.environ.setdefault("SUPABASE_URL", "postgresql://fake:fake@localhost:5432/test")
os.environ.setdefault("SUPABASE_ANON_KEY", "fake-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

# Añadir services/api al path
_SERVICES_API = Path(__file__).resolve().parent.parent / "services" / "api"
sys.path.insert(0, str(_SERVICES_API))

from fastapi.testclient import TestClient
from main import app


# ── Fixture: TestClient con mock de DB ──

@pytest.fixture
def client(tmp_path):
    """
    TestClient con la DB de SQLModel mockeada.
    Captura los eventos insertados en una lista.
    """
    captured_records: list = []

    mock_session = MagicMock()

    def fake_add_all(records):
        captured_records.extend(records)

    mock_session.add_all = fake_add_all
    mock_session.commit = MagicMock()

    mock_session_cm = MagicMock()
    mock_session_cm.__enter__ = MagicMock(return_value=mock_session)
    mock_session_cm.__exit__ = MagicMock(return_value=False)

    with patch("routes.telemetry.engine", MagicMock()), \
         patch("routes.telemetry.Session", return_value=mock_session_cm):
        test_app = TestClient(app)
        test_app.captured_records = captured_records
        yield test_app


# ── Helpers ──

def _make_event(
    event_id: str = "evt-1",
    event_type: str = "page_viewed",
    session_id: str = "sess-1",
    user_id: str = "user-1",
    timestamp: str = "2025-01-15T10:00:00Z",
    properties: dict | None = None,
) -> dict:
    """Crea un evento TelemetryEvent válido."""
    return {
        "eventId": event_id,
        "event_type": event_type,
        "sessionId": session_id,
        "userId": user_id,
        "timestamp": timestamp,
        "schemaVersion": "1.0",
        "requestId": f"req-{event_id}",
        "properties": properties or {"page": "/home"},
    }


def _make_envelope(events: list[dict]) -> dict:
    """Crea un envelope con eventos."""
    return {"events": events}


# ══════════════════════════════════════════════════════════
# TESTS — Endpoint stub vs real
# ══════════════════════════════════════════════════════════

class TestEndpointSwitch:
    """Verificar que el endpoint stub fue reemplazado por el real."""

    def test_accepts_raw_json_body(self, client):
        """El endpoint real acepta JSON raw (no requiere tipos Pydantic)."""
        payload = _make_envelope([_make_event()])
        resp = client.post("/telemetry/events", json=payload)
        assert resp.status_code == 200

    def test_returns_received_stored_rejected(self, client):
        """El endpoint real devuelve received/stored/rejected."""
        payload = _make_envelope([_make_event()])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()
        assert "received" in data
        assert "stored" in data
        assert "rejected" in data


# ══════════════════════════════════════════════════════════
# TESTS — Envío exitoso
# ══════════════════════════════════════════════════════════

class TestSuccessfulIngestion:
    """Envío exitoso de eventos y persistencia."""

    def test_single_valid_event(self, client):
        """Un evento válido se persiste correctamente."""
        event = _make_event(event_id="evt-001", event_type="page_viewed")
        payload = _make_envelope([event])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert resp.status_code == 200
        assert data["received"] == 1
        assert data["stored"] == 1
        assert data["rejected"] == 0

        # Verificar que se creó un registro
        assert len(client.captured_records) == 1
        record = client.captured_records[0]
        assert record.event_id == "evt-001"
        assert record.event_type == "page_viewed"
        assert record.service == "navigation"
        assert record.tags == {"page": "/home"}

    def test_multiple_valid_events(self, client):
        """Múltiples eventos válidos se persisten en batch."""
        events = [
            _make_event(event_id=f"evt-{i}", event_type="page_viewed", properties={"page": f"/page-{i}"})
            for i in range(5)
        ]
        payload = _make_envelope(events)
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert resp.status_code == 200
        assert data["received"] == 5
        assert data["stored"] == 5
        assert data["rejected"] == 0
        assert len(client.captured_records) == 5

    def test_event_with_tags(self, client):
        """Evento con tags (propiedades adicionales) se persiste correctamente."""
        event = _make_event(
            event_id="evt-tags-1",
            event_type="api_latency_recorded",
            properties={
                "endpoint": "/api/test",
                "method": "GET",
                "latency_ms": 150,
                "status_code": 200,
            },
        )
        payload = _make_envelope([event])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert data["stored"] == 1
        record = client.captured_records[0]
        assert record.service == "performance"
        assert record.tags["endpoint"] == "/api/test"
        assert record.tags["latency_ms"] == 150

    def test_event_service_derivation(self, client):
        """Verificar que la columna service se deriva correctamente."""
        # Evento de navegación
        nav_event = _make_event(
            event_id="evt-nav-1",
            event_type="page_viewed",
            properties={"page": "/home"},
        )
        # Evento de authentication
        auth_event = _make_event(
            event_id="evt-auth-1",
            event_type="login_succeeded",
            properties={"ip_hash": "abc123"},
        )
        # Evento de inventory
        inv_event = _make_event(
            event_id="evt-inv-1",
            event_type="inbound_order_created",
            properties={"product_id": "PRD-001", "product_category": "electronics", "client_id": "CLI-001", "quantity": 10, "warehouse": "WH-01"},
        )

        payload = _make_envelope([nav_event, auth_event, inv_event])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert data["stored"] == 3
        services = [r.service for r in client.captured_records]
        assert "navigation" in services
        assert "authentication" in services
        assert "inventory" in services


# ══════════════════════════════════════════════════════════
# TESTS — Rechazo de eventos malformados
# ══════════════════════════════════════════════════════════

class TestRejection:
    """Rechazo de eventos malformados sin abortar el lote."""

    def test_invalid_event_rejected(self, client):
        """Evento sin campos requeridos se rechaza."""
        invalid_event = {
            "eventId": "evt-invalid-1",
            # Falta event_type, sessionId, userId, timestamp
        }
        valid_event = _make_event(event_id="evt-valid-1", event_type="page_viewed")
        payload = _make_envelope([invalid_event, valid_event])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert resp.status_code == 200
        assert data["received"] == 2
        assert data["stored"] == 1
        assert data["rejected"] == 1

    def test_unknown_event_type_rejected(self, client):
        """Evento con event_type desconocido se rechaza."""
        unknown_event = _make_event(
            event_id="evt-unknown-1",
            event_type="totally_unknown_event_type",
            properties={"some": "data"},
        )
        payload = _make_envelope([unknown_event])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert resp.status_code == 200
        assert data["received"] == 1
        assert data["stored"] == 0
        assert data["rejected"] == 1

    def test_missing_required_property_rejected(self, client):
        """Evento sin required properties se rechaza."""
        # page_viewed requiere "page"
        event_without_page = _make_event(
            event_id="evt-nopage-1",
            event_type="page_viewed",
            properties={"referrer": "https://google.com"},  # Falta "page"
        )
        payload = _make_envelope([event_without_page])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert data["received"] == 1
        assert data["stored"] == 0
        assert data["rejected"] == 1

    def test_mixed_valid_invalid(self, client):
        """Lote mixto: solo los válidos se persisten."""
        events = [
            _make_event(event_id="evt-good-1", event_type="page_viewed"),
            {"eventId": "bad-1"},  # Inválido (faltan campos requeridos)
            _make_event(event_id="evt-good-2", event_type="login_succeeded", properties={"ip_hash": "abc123"}),
            {"eventId": "bad-2", "event_type": "unknown_type"},  # Tipo inválido (pattern mismatch)
            _make_event(event_id="evt-good-3", event_type="flow_abandoned",
                        properties={"flow_type": "checkout", "current_step": "payment", "total_steps": 3, "time_spent_seconds": 45, "partial_data": {"cart": True}}),
        ]
        payload = _make_envelope(events)
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert data["received"] == 5
        assert data["stored"] == 3
        assert data["rejected"] == 2


# ══════════════════════════════════════════════════════════
# TESTS — Deduplicación web_vital_measured
# ══════════════════════════════════════════════════════════

class TestDeduplication:
    """Deduplicación de web_vital_measured."""

    def test_duplicate_web_vitals_deduplicated(self, client):
        """Dos web_vital_measured con mismo metric_name+metric_id+page se deduplican."""
        vital1 = _make_event(
            event_id="evt-vital-1",
            event_type="web_vital_measured",
            properties={"metric_name": "LCP", "metric_id": "lcp-abc", "metric_value": 2500, "metric_delta": 100, "page": "/home"},
        )
        vital2 = _make_event(
            event_id="evt-vital-2",
            event_type="web_vital_measured",
            properties={"metric_name": "LCP", "metric_id": "lcp-abc", "metric_value": 2600, "metric_delta": 200, "page": "/home"},
        )
        payload = _make_envelope([vital1, vital2])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert data["received"] == 2
        assert data["stored"] == 1
        assert data["rejected"] == 1

    def test_different_web_vitals_not_deduplicated(self, client):
        """web_vital_measured con diferentes propiedades NO se deduplican."""
        vital1 = _make_event(
            event_id="evt-vital-1",
            event_type="web_vital_measured",
            properties={"metric_name": "LCP", "metric_id": "lcp-abc", "metric_value": 2500, "metric_delta": 100, "page": "/home"},
        )
        vital2 = _make_event(
            event_id="evt-vital-2",
            event_type="web_vital_measured",
            properties={"metric_name": "FID", "metric_id": "fid-abc", "metric_value": 50, "metric_delta": 10, "page": "/home"},
        )
        payload = _make_envelope([vital1, vital2])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert data["received"] == 2
        assert data["stored"] == 2
        assert data["rejected"] == 0

    def test_non_vital_events_not_deduplicated(self, client):
        """Solo web_vital_measured se deduplica; otros eventos no."""
        event1 = _make_event(event_id="evt-1", event_type="page_viewed", properties={"page": "/home"})
        event2 = _make_event(event_id="evt-2", event_type="page_viewed", properties={"page": "/home"})
        payload = _make_envelope([event1, event2])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert data["received"] == 2
        assert data["stored"] == 2


# ══════════════════════════════════════════════════════════
# TESTS — Edge cases
# ══════════════════════════════════════════════════════════

class TestEdgeCases:
    """Casos extremos y validación de entrada."""

    def test_empty_events_list(self, client):
        """Lote vacío: 0 received, 0 stored, 0 rejected."""
        payload = _make_envelope([])
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert resp.status_code == 200
        assert data["received"] == 0
        assert data["stored"] == 0
        assert data["rejected"] == 0

    def test_missing_events_key(self, client):
        """Body sin key 'events' retorna 400."""
        resp = client.post("/telemetry/events", json={"data": []})
        assert resp.status_code == 400

    def test_invalid_json_body(self, client):
        """Body que no es JSON retorna 400."""
        resp = client.post(
            "/telemetry/events",
            content="not json at all",
            headers={"Content-Type": "application/json"},
        )
        assert resp.status_code == 400

    def test_events_not_array(self, client):
        """'events' que no es array retorna 400."""
        resp = client.post("/telemetry/events", json={"events": "not-array"})
        assert resp.status_code == 400

    def test_all_events_invalid(self, client):
        """Si todos los eventos son inválidos, stored=0."""
        events = [{"bad": "data"}, {"bad": "data"}, {"bad": "data"}]
        payload = _make_envelope(events)
        resp = client.post("/telemetry/events", json=payload)
        data = resp.json()

        assert data["received"] == 3
        assert data["stored"] == 0
        assert data["rejected"] == 3
