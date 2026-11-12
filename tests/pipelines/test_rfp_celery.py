from __future__ import annotations

import importlib.util
from pathlib import Path
from types import SimpleNamespace

import pytest


_CELERY_APP_PATH = Path(__file__).resolve().parents[2] / "services" / "celery_app.py"
_SPEC = importlib.util.spec_from_file_location("trackflow_test_celery_app", _CELERY_APP_PATH)
assert _SPEC is not None and _SPEC.loader is not None
celery_app = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(celery_app)


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (SimpleNamespace(status_code=401), True),
        (SimpleNamespace(status_code=403), True),
        (SimpleNamespace(response=SimpleNamespace(status_code=401)), True),
        (SimpleNamespace(status_code=429), False),
        (RuntimeError("connection failed"), False),
    ],
)
def test_rfp_authentication_failures_are_permanent(error, expected):
    assert celery_app._is_permanent_rfp_error(error) is expected


def test_rfp_401_marks_ticket_failed_without_retry(monkeypatch):
    from data.pipelines import rfp_intake

    error = RuntimeError("provider key expired")
    error.status_code = 401
    recorded = []
    retry_calls = []

    def fail_processing(_ticket_id):
        raise error

    def record_error(ticket_id, operational_error, *, failed):
        recorded.append((ticket_id, str(operational_error), failed))

    monkeypatch.setattr(rfp_intake, "process_ticket", fail_processing)
    monkeypatch.setattr(celery_app, "_record_rfp_operational_error", record_error)
    monkeypatch.setattr(celery_app.process_rfp_ticket, "retry", lambda **kwargs: retry_calls.append(kwargs))

    with pytest.raises(RuntimeError, match="provider key expired"):
        celery_app.process_rfp_ticket.run("ticket-123")

    assert recorded == [
        (
            "ticket-123",
            "El proveedor LLM rechazó las credenciales (HTTP 401). Rota o corrige la clave del proveedor y reinicia el worker Celery.",
            True,
        )
    ]
    assert retry_calls == []