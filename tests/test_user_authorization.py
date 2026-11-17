"""HTTP authorization tests for user data and privilege-sensitive mutations."""

from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def api_client(tmp_path, monkeypatch):
    import main

    monkeypatch.setenv("SUPPORT_AGENT_STATE_DIR", str(tmp_path))
    monkeypatch.setattr(main.SQLModel.metadata, "create_all", Mock())
    with TestClient(main.app) as client:
        yield client


def _bearer(user_id):
    from auth import create_access_token

    return {"Authorization": f"Bearer {create_access_token({'sub': str(user_id)})}"}


def test_user_cannot_read_or_change_another_users_account(api_client, mock_db, sample_user, sample_admin):
    """A normal user cannot read another account or mutate its email/role."""
    other_user = mock_db["users"].get(doc_id=sample_admin)
    original_email = other_user["email"]
    client = api_client

    assert client.get(f"/users/{sample_admin}").status_code == 401

    headers = _bearer(sample_user)
    read_response = client.get(f"/users/{sample_admin}", headers=headers)
    assert read_response.status_code == 403
    assert "email" not in read_response.text

    update_response = client.put(
        f"/users/{sample_admin}",
        headers=headers,
        json={"email": "attacker@example.test"},
    )
    assert update_response.status_code == 403
    unchanged = mock_db["users"].get(doc_id=sample_admin)
    assert unchanged["email"] == original_email
    assert unchanged["role"] == "admin"


def test_user_cannot_escalate_own_role_or_delete_accounts(api_client, mock_db, sample_user, sample_admin):
    """Role escalation and account deletion are denied before persistence changes."""
    client = api_client
    headers = _bearer(sample_user)
    own_user = mock_db["users"].get(doc_id=sample_user)
    original_email = own_user["email"]

    escalation = client.put(
        f"/users/{sample_user}",
        headers=headers,
        json={"role": "admin"},
    )
    assert escalation.status_code == 403
    persisted = mock_db["users"].get(doc_id=sample_user)
    assert persisted["role"] == "user"
    assert persisted["email"] == original_email

    assert client.delete(f"/users/{sample_admin}").status_code == 401
    deletion = client.delete(f"/users/{sample_admin}", headers=headers)
    assert deletion.status_code == 403
    assert mock_db["users"].get(doc_id=sample_admin) is not None


def test_public_registration_ignores_requested_admin_role(api_client, mock_db):
    """Public account creation always persists the default user role."""
    response = api_client.post(
        "/users",
        json={"email": "new-account@example.test", "password": "SecurePass123!", "role": "admin"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "user"
    persisted = mock_db["users"].get(doc_id=data["user"]["id"])
    assert persisted["role"] == "user"
