from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def api_client(tmp_path, monkeypatch):
    import main

    monkeypatch.setenv("SUPPORT_AGENT_STATE_DIR", str(tmp_path))
    monkeypatch.setattr(main.SQLModel.metadata, "create_all", Mock())
    with TestClient(main.app) as client:
        yield client, main


def _bearer(user_id):
    from auth import create_access_token

    return {"Authorization": f"Bearer {create_access_token({'sub': str(user_id)})}"}


def test_reporting_pipeline_endpoints_are_admin_only(api_client, sample_user, sample_admin, monkeypatch):
    client, main = api_client
    from reporting import routes as reporting_routes

    enqueue = Mock(return_value=Mock(id="task-admin-1"))
    monkeypatch.setattr(reporting_routes, "_get_pipeline_task", lambda: Mock(delay=enqueue))
    monkeypatch.setattr(reporting_routes, "obtener_ultima_ejecucion", lambda: {"status": "success"})

    assert client.post("/reporting/pipeline-runs").status_code == 401
    user_response = client.post("/reporting/pipeline-runs", headers=_bearer(sample_user))
    assert user_response.status_code == 403
    enqueue.assert_not_called()

    admin_response = client.post("/reporting/pipeline-runs", headers=_bearer(sample_admin))
    assert admin_response.status_code == 202
    assert admin_response.json() == {"task_id": "task-admin-1"}
    enqueue.assert_called_once_with(None)

    assert client.get("/reporting/pipeline-runs/latest").status_code == 401
    user_latest = client.get("/reporting/pipeline-runs/latest", headers=_bearer(sample_user))
    assert user_latest.status_code == 403
    admin_latest = client.get("/reporting/pipeline-runs/latest", headers=_bearer(sample_admin))
    assert admin_latest.status_code == 200
    assert admin_latest.json() == {"status": "success"}


def test_task_status_is_admin_only_and_does_not_query_celery_for_user(
    api_client, sample_user, sample_admin, monkeypatch
):
    client, main = api_client
    result = Mock(status="SUCCESS", result={"report": "private"})
    result.successful.return_value = True
    result.failed.return_value = False
    async_result = Mock(return_value=result)
    monkeypatch.setattr(main.celery_app, "AsyncResult", async_result)

    assert client.get("/tasks/task-private").status_code == 401
    user_response = client.get("/tasks/task-private", headers=_bearer(sample_user))
    assert user_response.status_code == 403
    async_result.assert_not_called()

    admin_response = client.get("/tasks/task-private", headers=_bearer(sample_admin))
    assert admin_response.status_code == 200
    assert admin_response.json() == {
        "task_id": "task-private",
        "status": "success",
        "result": {"report": "private"},
    }
    async_result.assert_called_once_with("task-private")
