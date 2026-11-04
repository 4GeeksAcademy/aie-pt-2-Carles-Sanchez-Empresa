"""Pruebas de intake multipart y consulta de tickets sin servicios externos."""

import pytest
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, select

from auth import get_current_user
from database import get_db
from models import DepartmentSection, RfpMetadata, RfpTicket
from routes import rfp_intake


@pytest.fixture

def client(tmp_path, monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(
        engine,
        tables=[RfpTicket.__table__, RfpMetadata.__table__, DepartmentSection.__table__],
    )

    def database_session():
        with Session(engine) as session:
            yield session

    app = FastAPI()
    app.include_router(rfp_intake.router)
    app.state.test_engine = engine
    app.dependency_overrides[get_current_user] = lambda: {"id": "test-user"}
    app.dependency_overrides[get_db] = database_session
    monkeypatch.setattr(rfp_intake, "RAW_DATA_DIR", tmp_path / "raw")
    monkeypatch.setattr(
        rfp_intake,
        "_dispatch_rfp_job",
        lambda ticket, session: setattr(ticket, "celery_task_id", "celery-test-id"),
    )
    with TestClient(app) as test_client:
        yield test_client
    engine.dispose()


def test_upload_creates_accepted_ticket_and_safe_runtime_pdf(client, tmp_path):
    response = client.post(
        "/rfp-intake/tickets",
        files={"file": ("../../prospect.pdf", b"%PDF-1.7\nmock bytes", "application/pdf")},
    )
    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "analizando"
    assert body["processing_failed"] is False
    assert body["ticket_id"]
    files = list((tmp_path / "raw").glob("rfp-*.pdf"))
    assert len(files) == 1
    assert files[0].read_bytes() == b"%PDF-1.7\nmock bytes"
    assert "prospect" not in files[0].name


def test_upload_rejects_wrong_extension_and_invalid_pdf_without_orphan(client, tmp_path):
    wrong_extension = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.docx", b"not pdf", "application/pdf")},
    )
    assert wrong_extension.status_code == 415

    invalid_pdf = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"not pdf", "application/pdf")},
    )
    assert invalid_pdf.status_code == 400
    assert list((tmp_path / "raw").glob("*")) == []


def test_upload_rejects_oversized_file(client, tmp_path, monkeypatch):
    monkeypatch.setattr(rfp_intake, "MAX_PDF_BYTES", 8)
    response = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7" + b"x", "application/pdf")},
    )
    assert response.status_code == 413
    assert list((tmp_path / "raw").glob("*")) == []


def test_ticket_list_and_detail_expose_persisted_data_not_internal_path(client):
    upload = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    ticket_id = upload.json()["ticket_id"]
    listings = client.get("/rfp-intake/tickets")
    assert listings.status_code == 200
    assert listings.json()[0]["ticket_id"] == ticket_id

    detail = client.get(f"/rfp-intake/tickets/{ticket_id}")
    assert detail.status_code == 200
    payload = detail.json()
    assert payload["status"] == "analizando"
    assert payload["metadata"] is None
    assert payload["sections"] == []
    assert "raw_pdf_path" not in payload
    assert client.get("/rfp-intake/tickets/not-a-ticket").status_code == 404


def test_queue_failure_compensates_ticket_and_uploaded_file(client, tmp_path, monkeypatch):
    def fail_queue(ticket, session):
        raise RuntimeError("broker unavailable")

    monkeypatch.setattr(rfp_intake, "_dispatch_rfp_job", fail_queue)
    response = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    assert response.status_code == 503
    assert list((tmp_path / "raw").glob("*")) == []


def test_delete_ticket_removes_database_rows_and_generated_files(client, tmp_path):
    upload = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    assert upload.status_code == 202
    ticket_id = upload.json()["ticket_id"]
    raw_path = next((tmp_path / "raw").glob("rfp-*.pdf"))

    # Exercise generated Markdown cleanup as well as upload cleanup.
    markdown_dir = tmp_path / "raw" / "markdown"
    markdown_dir.mkdir()
    markdown_path = markdown_dir / f"{ticket_id}.md"
    markdown_path.write_text("converted text", encoding="utf-8")
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        ticket.markdown_path = str(markdown_path)
        ticket.failed_at = datetime(2026, 11, 4, tzinfo=timezone.utc)
        session.add(RfpMetadata(ticket_id=ticket_id, is_rfp=True))
        session.add(DepartmentSection(
            ticket_id=ticket_id,
            department_id="reverse",
            owner="Responsable de Logística Inversa",
            relevant_extracts=[],
            key_aspects=[],
            open_questions=[],
            evidence=[],
        ))
        session.add(ticket)
        session.commit()

    listed = client.get("/rfp-intake/tickets")
    assert listed.json()[0]["processing_failed"] is True

    response = client.delete(f"/rfp-intake/tickets/{ticket_id}")
    assert response.status_code == 204
    assert client.get(f"/rfp-intake/tickets/{ticket_id}").status_code == 404
    assert not raw_path.exists()
    assert not markdown_path.exists()
    with Session(client.app.state.test_engine) as session:
        assert session.get(RfpMetadata, ticket_id) is None
        assert session.exec(select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)).all() == []


def test_delete_ticket_returns_404_for_missing_or_invalid_id(client):
    assert client.delete("/rfp-intake/tickets/not-a-uuid").status_code == 404
    assert client.delete("/rfp-intake/tickets/00000000-0000-0000-0000-000000000000").status_code == 404


def test_delete_ticket_refuses_to_unlink_outside_raw_directory(client, tmp_path):
    upload = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    ticket_id = upload.json()["ticket_id"]
    outside_file = tmp_path / "outside.pdf"
    outside_file.write_bytes(b"must remain")
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        ticket.raw_pdf_path = str(outside_file)
        session.add(ticket)
        session.commit()

    response = client.delete(f"/rfp-intake/tickets/{ticket_id}")
    assert response.status_code == 409
    assert outside_file.read_bytes() == b"must remain"
    assert client.get(f"/rfp-intake/tickets/{ticket_id}").status_code == 200


def test_delete_ticket_rejects_active_analysis(client, tmp_path):
    upload = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    ticket_id = upload.json()["ticket_id"]
    response = client.delete(f"/rfp-intake/tickets/{ticket_id}")
    assert response.status_code == 409
    assert client.get(f"/rfp-intake/tickets/{ticket_id}").status_code == 200


def test_delete_ticket_cancels_retrying_analysis(client, tmp_path, monkeypatch):
    upload = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    ticket_id = upload.json()["ticket_id"]
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        ticket.retry_count = 1
        ticket.last_error = "Worker validation failed"
        ticket.celery_task_id = "pending-retry-id"
        session.add(ticket)
        session.commit()

    revoked = []
    class Control:
        def revoke(self, task_id, terminate=False):
            revoked.append((task_id, terminate))

    monkeypatch.setattr("main.celery_app.control", Control())
    response = client.delete(f"/rfp-intake/tickets/{ticket_id}")

    assert response.status_code == 204
    assert revoked == [("pending-retry-id", False)]
    assert client.get(f"/rfp-intake/tickets/{ticket_id}").status_code == 404


def test_delete_ticket_allows_failed_analysis_after_retries(client, tmp_path):
    upload = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    ticket_id = upload.json()["ticket_id"]
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        ticket.failed_at = datetime(2026, 11, 4, tzinfo=timezone.utc)
        ticket.last_error = "Invalid model response"
        session.add(ticket)
        session.commit()

    response = client.delete(f"/rfp-intake/tickets/{ticket_id}")
    assert response.status_code == 204
    assert list((tmp_path / "raw").glob("rfp-*.pdf")) == []


def test_ticket_summary_reports_failed_analysis_without_changing_business_status(client):
    upload = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    ticket_id = upload.json()["ticket_id"]
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        ticket.failed_at = datetime(2026, 11, 4, tzinfo=timezone.utc)
        session.add(ticket)
        session.commit()

    summary = client.get("/rfp-intake/tickets").json()[0]
    detail = client.get(f"/rfp-intake/tickets/{ticket_id}").json()
    assert summary["status"] == "analizando"
    assert summary["processing_failed"] is True
    assert detail["status"] == "analizando"
    assert detail["processing_failed"] is True


def test_ticket_summary_marks_retrying_ticket_as_operationally_errored(client):
    upload = client.post(
        "/rfp-intake/tickets",
        files={"file": ("brief.pdf", b"%PDF-1.7\ncontent", "application/pdf")},
    )
    ticket_id = upload.json()["ticket_id"]
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        ticket.retry_count = 1
        ticket.last_error = "Classifier response was truncated"
        session.add(ticket)
        session.commit()

    summary = client.get("/rfp-intake/tickets").json()[0]
    assert summary["status"] == "analizando"
    assert summary["processing_failed"] is False
    assert summary["processing_error"] is True
