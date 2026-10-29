"""Contract tests for the support agent's first-party MCP client adapter."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "services"))

from support_agent.tools import (
    Incident,
    InventoryProduct,
    InventoryResult,
    MCPTrackFlowTools,
    TicketInput,
)


def _incident():
    return {
        "id": 7,
        "title": "Test incident",
        "description": "Disposable test incident",
        "category": "other",
        "status": "open",
        "origin": "internal",
        "branch": "central",
        "created_at": "2026-10-23T00:00:00Z",
        "updated_at": "2026-10-23T00:00:00Z",
    }


def _product():
    return {
        "id": 3,
        "name": "Sample product",
        "sku_code": "SKU-3",
        "client_name": "Test client",
        "category": "electronics",
        "warehouse": "LA",
        "threshold_min": 2,
        "current_stock": 8,
        "created_at": "2026-10-23T00:00:00Z",
    }


def test_mcp_adapter_sends_user_bearer_only_to_mcp_and_validates_results(monkeypatch):
    observed = {}
    adapter = MCPTrackFlowTools("https://mcp.test", token_provider=lambda: "user-access-token")

    def fake_call(name, arguments, *, token=None):
        observed["token"] = token
        observed["call"] = (name, arguments)
        return SimpleNamespace(isError=False, structuredContent=_incident())

    monkeypatch.setattr(adapter, "_call", fake_call)
    result = adapter.incident(TicketInput(ticket_id=7), token="user-access-token")

    assert result.outcome == "found"
    assert result.incident == Incident.model_validate(_incident())
    assert observed["token"] == "user-access-token"
    assert observed["call"] == ("incidents_get", {"incident_id": 7})
    assert "user-access-token" not in repr(result.model_dump())


def test_mcp_adapter_inventory_maps_structured_list(monkeypatch):
    adapter = MCPTrackFlowTools("https://mcp.test", token_provider=lambda: "user-token")
    monkeypatch.setattr(adapter, "_call", lambda name, arguments, *, token=None: SimpleNamespace(
        isError=False, structuredContent={"result": [_product()]},
    ))

    result = adapter.inventory(
        __import__("support_agent.tools", fromlist=["InventoryInput"]).InventoryInput(
            product_name="Sample product", warehouse="LA",
        ),
        token="user-token",
    )

    assert result.outcome == "found"
    assert result.products == [InventoryProduct.model_validate(_product())]


@pytest.mark.parametrize(
    ("response", "expected"),
    [
        (SimpleNamespace(isError=True, structuredContent=None), "unavailable"),
        (SimpleNamespace(isError=False, structuredContent={"unexpected": True}), "invalid_response"),
    ],
)
def test_mcp_adapter_returns_controlled_outcomes_for_errors(response, expected, monkeypatch):
    adapter = MCPTrackFlowTools("https://mcp.test", token_provider=lambda: "user-token")
    monkeypatch.setattr(adapter, "_call", lambda *_args, **_kwargs: response)
    result = adapter.incident(TicketInput(ticket_id=7), token="user-token")
    assert result.outcome == expected


def test_mcp_adapter_requires_user_bearer_without_calling_server(monkeypatch):
    adapter = MCPTrackFlowTools("https://mcp.test", token_provider=lambda: None)
    result = adapter.incident(TicketInput(ticket_id=7))
    assert result.outcome == "unauthorized"