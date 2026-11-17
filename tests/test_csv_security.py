import asyncio
import io
from unittest.mock import Mock

import pytest
from fastapi import HTTPException, UploadFile
from fastapi.testclient import TestClient


CSV_RESULT = {
    "total": 1,
    "valid": 1,
    "invalid": 0,
    "rules": [],
    "metrics": {
        "category_counts": {}, "category_pcts": {},
        "status_counts": {}, "status_pcts": {},
        "country_counts": {}, "country_pcts": {},
        "avg_satisfaction": None, "closed_with_score_count": 0,
        "score_distribution": {}, "score_pcts": {},
    },
}


def _bearer(user_id):
    from auth import create_access_token

    return {"Authorization": f"Bearer {create_access_token({'sub': str(user_id)})}"}


def test_csv_upload_rejects_over_limit_and_closes_upload(sample_user):
    import main

    upload = UploadFile(
        filename="large.csv",
        file=io.BytesIO(b"x" * (10 * 1024 * 1024 + 1)),
    )
    with pytest.raises(HTTPException) as error:
        asyncio.run(main.post_analyze(upload, current_user={"id": sample_user}))

    assert error.value.status_code == 413
    assert upload.file.closed


def test_csv_upload_closes_file_after_analysis(sample_user, monkeypatch):
    import main

    monkeypatch.setattr(main, "analyze_rows", lambda rows: CSV_RESULT)
    upload = UploadFile(filename="incidents.csv", file=io.BytesIO(b"id\n1\n"))
    result = asyncio.run(main.post_analyze(upload, current_user={"id": sample_user}))

    assert result == CSV_RESULT
    assert upload.file.closed
    assert main._last_results[str(sample_user)] == CSV_RESULT


def test_csv_export_is_isolated_per_authenticated_user(sample_user, sample_admin, monkeypatch):
    import main

    monkeypatch.setattr(main, "analyze_rows", lambda rows: CSV_RESULT)
    monkeypatch.setattr(main, "build_results_csv", lambda result: "private-export\n")
    with TestClient(main.app) as client:
        response = client.post(
            "/api/incidents/analyze",
            files={"file": ("incidents.csv", b"id\n1\n", "text/csv")},
            headers=_bearer(sample_user),
        )
        assert response.status_code == 200

        owner_export = client.get("/api/incidents/results/export", headers=_bearer(sample_user))
        other_export = client.get("/api/incidents/results/export", headers=_bearer(sample_admin))

    assert owner_export.status_code == 200
    assert owner_export.text == "private-export\n"
    assert other_export.status_code == 404
