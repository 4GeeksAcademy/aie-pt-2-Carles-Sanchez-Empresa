"""HTTP authorization tests for operational mutation routes."""

from unittest.mock import MagicMock, Mock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def api_client(tmp_path, monkeypatch):
    import main
    from database import get_db

    monkeypatch.setenv("SUPPORT_AGENT_STATE_DIR", str(tmp_path))
    monkeypatch.setattr(main.SQLModel.metadata, "create_all", Mock())
    db_session = MagicMock()

    def override_db():
        yield db_session

    main.app.dependency_overrides[get_db] = override_db
    with TestClient(main.app) as client:
        client.db_session = db_session
        yield client
    main.app.dependency_overrides.pop(get_db, None)


def _bearer(user_id):
    from auth import create_access_token

    return {"Authorization": f"Bearer {create_access_token({'sub': str(user_id)})}"}


def _supplier_payload():
    return {
        "name": "Audit Carrier",
        "country": "Spain",
        "categories": ["carrier_last_mile"],
        "rate_per_shipment": 4.5,
        "currency": "EUR",
        "status": "active",
    }


def _invoke_supplier_mutation(client, method, path, payload, headers):
    request = getattr(client, method)
    if payload is None:
        return request(path, headers=headers)
    return request(path, headers=headers, json=payload)


def test_supplier_mutation_is_admin_only_and_denial_does_not_persist(
    api_client, mock_db, sample_user, sample_admin
):
    client = api_client
    suppliers = mock_db["suppliers"]
    payload = _supplier_payload()

    assert client.post("/suppliers", json=payload).status_code == 401
    denied = client.post("/suppliers", headers=_bearer(sample_user), json=payload)
    assert denied.status_code == 403
    assert suppliers.all() == []

    created = client.post("/suppliers", headers=_bearer(sample_admin), json=payload)
    assert created.status_code == 201
    assert len(suppliers.all()) == 1
    assert suppliers.all()[0]["name"] == "Audit Carrier"


def test_inventory_mutation_is_admin_only_and_denial_does_not_write(
    api_client, sample_user, sample_admin
):
    client = api_client
    payload = {
        "sku_id": 13,
        "quantity": 5,
        "reference": "audit-receipt",
        "warehouse": "LA",
    }

    assert client.post("/inventory/orders/inbound", json=payload).status_code == 401
    denied = client.post(
        "/inventory/orders/inbound", headers=_bearer(sample_user), json=payload
    )
    assert denied.status_code == 403
    client.db_session.add.assert_not_called()
    client.db_session.commit.assert_not_called()

    client.db_session.get.return_value = Mock(id=13, warehouse="LA")
    client.db_session.refresh.side_effect = lambda entry: setattr(entry, "id", 29)
    allowed = client.post(
        "/inventory/orders/inbound", headers=_bearer(sample_admin), json=payload
    )
    assert allowed.status_code == 201
    client.db_session.add.assert_called_once()
    client.db_session.commit.assert_called_once()


def test_inventory_outbound_requires_admin_and_explicit_human_confirmation(
    api_client, sample_user, sample_admin
):
    client = api_client
    payload = {
        "sku_id": 13,
        "quantity": 1,
        "exit_type": "dispatch",
        "tracking_number": "TRACK-13",
        "warehouse": "LA",
    }
    endpoint = "/inventory/orders/outbound"
    assert client.post(endpoint, json=payload).status_code == 401
    assert client.post(endpoint, headers=_bearer(sample_user), json=payload).status_code == 403
    assert client.db_session.get.call_count == 0

    admin_headers = _bearer(sample_admin)
    missing_confirmation = client.post(endpoint, headers=admin_headers, json=payload)
    assert missing_confirmation.status_code == 428
    client.db_session.get.assert_not_called()
    client.db_session.add.assert_not_called()
    assert client.db_session.commit.call_count == 0

    client.db_session.get.return_value = Mock(id=13, warehouse="LA", sku_code="SKU-13")
    # Available-stock query computes inbound minus outbound quantities.
    client.db_session.exec.side_effect = [Mock(one=Mock(return_value=1)), Mock(one=Mock(return_value=0))]
    client.db_session.refresh.side_effect = lambda order: setattr(order, "id", 31)
    confirmed = client.post(
        endpoint,
        headers={**admin_headers, "X-TrackFlow-Human-Confirmation": "confirmed"},
        json=payload,
    )
    assert confirmed.status_code == 201, confirmed.text
    client.db_session.add.assert_called_once()


@pytest.mark.parametrize(("method", "path", "payload"), [
    ("put", "/suppliers/1", _supplier_payload()),
    ("patch", "/suppliers/1/rate", {"rate_per_shipment": 12.5}),
    ("patch", "/suppliers/1/status", {"status": "suspended"}),
    ("delete", "/suppliers/1", None),
])
def test_supplier_update_rate_status_and_delete_are_admin_only_without_denied_mutation(
    api_client, mock_db, sample_user, sample_admin, method, path, payload
):
    client = api_client
    suppliers = mock_db["suppliers"]

    def invoke(headers):
        return _invoke_supplier_mutation(client, method, path, payload, headers)

    assert invoke({}).status_code == 401
    assert invoke(_bearer(sample_user)).status_code == 403
    assert suppliers.all() == []

    # The admin reaches the handler; the empty fixture returns 404, while
    # unauthorized calls above must not change the TinyDB table.
    assert invoke(_bearer(sample_admin)).status_code == 404
    assert suppliers.all() == []


def test_incident_create_and_status_mutation_are_admin_only(api_client, mock_db, sample_user, sample_admin):
    client = api_client
    incidents = mock_db["incidents"]
    payload = {
        "title": "Audit delivery issue",
        "description": "The shipment has not arrived at its destination.",
        "category": "delivery_failure",
        "origin": "customer",
        "branch": "central",
    }
    endpoint = "/api/incidents"

    assert client.post(endpoint, json=payload).status_code == 401
    assert client.post(endpoint, headers=_bearer(sample_user), json=payload).status_code == 403
    assert incidents.all() == []

    created = client.post(endpoint, headers=_bearer(sample_admin), json=payload)
    assert created.status_code == 201, created.text
    incident_id = created.json()["id"]
    assert len(incidents.all()) == 1

    status_endpoint = f"{endpoint}/{incident_id}/status"
    status_payload = {"status": "in_progress"}
    assert client.patch(status_endpoint, json=status_payload).status_code == 401
    assert client.patch(status_endpoint, headers=_bearer(sample_user), json=status_payload).status_code == 403
    assert incidents.get(doc_id=incident_id)["status"] == "open"
    changed = client.patch(status_endpoint, headers=_bearer(sample_admin), json=status_payload)
    assert changed.status_code == 200, changed.text
    assert incidents.get(doc_id=incident_id)["status"] == "in_progress"
