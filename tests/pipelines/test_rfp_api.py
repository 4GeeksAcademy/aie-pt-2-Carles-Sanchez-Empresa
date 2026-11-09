"""Pruebas de intake multipart y consulta de tickets sin servicios externos."""

import pytest
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, select

from auth import get_current_user
from database import get_db
from models import DepartmentSection, RfpApprovalTrace, RfpMetadata, RfpNodeTrace, RfpTicket
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
        tables=[RfpTicket.__table__, RfpMetadata.__table__, DepartmentSection.__table__,
            RfpApprovalTrace.__table__, RfpNodeTrace.__table__],
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


def _seed_approval_ticket(client, *, warehouse_draft=None, lastmile_draft=None, extra_sections=()):
    ticket_id = str(uuid4())
    with Session(client.app.state.test_engine) as session:
        session.add(RfpTicket(
            ticket_id=ticket_id,
            status="en_evaluación",
            raw_pdf_path="/tmp/approval-test.pdf",
        ))
        session.add(RfpMetadata(ticket_id=ticket_id, client_country="US", currency="USD"))
        session.add_all([
            DepartmentSection(
                ticket_id=ticket_id,
                department_id="warehouse",
                owner="Ana Whitfield",
                draft_content=warehouse_draft or "Almacenamiento en USD; capacidad pendiente.",
                evaluation_results={"overall_pass": True},
            ),
            DepartmentSection(
                ticket_id=ticket_id,
                department_id="lastmile",
                owner="Carlos Vega",
                draft_content=lastmile_draft or "Entregas en USD; SLA pendiente.",
                evaluation_results={"overall_pass": True},
            ),
        ])
        for department_id, owner, draft_content, evaluation_results in extra_sections:
            session.add(DepartmentSection(
                ticket_id=ticket_id,
                department_id=department_id,
                owner=owner,
                draft_content=draft_content,
                evaluation_results=evaluation_results,
            ))
        session.commit()
    return ticket_id


def test_approval_api_requires_admin_and_authorized_department_approver(client):
    ticket_id = _seed_approval_ticket(client)
    endpoint = f"/rfp-intake/tickets/{ticket_id}"

    denied_start = client.post(f"{endpoint}/start-approval")
    assert denied_start.status_code == 403

    client.app.dependency_overrides[get_current_user] = lambda: {"id": "admin-user", "role": "admin"}
    started = client.post(f"{endpoint}/start-approval")
    assert started.status_code == 200
    assert started.json()["status"] == "waiting_for_approval"
    assert set(started.json()["threads"]) == {"warehouse", "lastmile"}

    wrong_approver = client.post(
        f"{endpoint}/departments/warehouse/decision",
        json={"decision": "approve", "approver_name": "Miguel Torres"},
    )
    assert wrong_approver.status_code == 403


def test_approval_api_resumes_independent_sections_and_returns_final_proposal(client):
    ticket_id = _seed_approval_ticket(client)
    client.app.dependency_overrides[get_current_user] = lambda: {"id": "admin-user", "role": "admin"}
    ticket_endpoint = f"/rfp-intake/tickets/{ticket_id}"

    started = client.post(f"{ticket_endpoint}/start-approval")
    assert started.status_code == 200

    lastmile = client.post(
        f"{ticket_endpoint}/departments/lastmile/decision",
        json={"decision": "approve", "approver_name": "Carlos Vega", "comment": "Revisado"},
    )
    assert lastmile.status_code == 200
    lastmile_payload = lastmile.json()
    assert lastmile_payload["status"] == "waiting_for_approval"
    assert lastmile_payload["final_proposal"] is None
    sections = {section["department_id"]: section for section in lastmile_payload["sections"]}
    assert sections["lastmile"]["approval_status"] == "approved"
    assert sections["warehouse"]["approval_status"] == "pending"

    warehouse = client.post(
        f"{ticket_endpoint}/departments/warehouse/decision",
        json={"decision": "approve", "approver_name": "Ana Whitfield"},
    )
    assert warehouse.status_code == 200
    payload = warehouse.json()
    assert payload["status"] == "needs_human_review"
    assert payload["final_document_available"] is False
    assert "## warehouse" in payload["final_proposal"]
    assert "## lastmile" in payload["final_proposal"]
    assert {trace["node_name"] for trace in payload["approval_trace"]} >= {
        "interrupt_before_approval",
        "resume_department",
        "publish_final_proposal",
    }


def test_approval_api_rejects_invalid_decisions_and_prevents_duplicate_resume(client):
    ticket_id = _seed_approval_ticket(client)
    client.app.dependency_overrides[get_current_user] = lambda: {"id": "admin-user", "role": "admin"}
    endpoint = f"/rfp-intake/tickets/{ticket_id}"
    assert client.post(f"{endpoint}/start-approval").status_code == 200

    invalid = client.post(
        f"{endpoint}/departments/warehouse/decision",
        json={"decision": "maybe", "approver_name": "Ana Whitfield"},
    )
    assert invalid.status_code == 409
    assert "Decisión no válida" in invalid.json()["detail"]

    first_decision = client.post(
        f"{endpoint}/departments/warehouse/decision",
        json={"decision": "reject", "approver_name": "Ana Whitfield", "comment": "Falta evidencia."},
    )
    assert first_decision.status_code == 200
    assert first_decision.json()["status"] == "needs_human_review"
    assert first_decision.json()["final_proposal"] is None

    duplicate = client.post(
        f"{endpoint}/departments/warehouse/decision",
        json={"decision": "approve", "approver_name": "Ana Whitfield"},
    )
    assert duplicate.status_code == 409


def test_human_review_edits_returns_approves_and_downloads_final_document(client):
    ticket_id = _seed_approval_ticket(client)
    client.app.dependency_overrides[get_current_user] = lambda: {"id": "reviewer-1", "role": "admin"}
    endpoint = f"/rfp-intake/tickets/{ticket_id}"
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        ticket.status = "needs_human_review"
        session.add(ticket)
        session.commit()

    returned = client.post(f"{endpoint}/human-review", json={
        "action": "edit", "return_to_client": True, "comment": "Indicar volumen mensual",
        "field_updates": {"metadata": {"monthly_volume": 1200},
                          "sections": {"warehouse": {"draft_content": "Capacidad para 1.200 unidades/mes."}}},
    })
    assert returned.status_code == 200
    assert returned.json()["status"] == "returned_to_client"


def test_human_review_approve_generates_download_and_reject_archives(client):
    ticket_id = _seed_approval_ticket(client)
    client.app.dependency_overrides[get_current_user] = lambda: {"id": "reviewer-1", "role": "admin"}
    endpoint = f"/rfp-intake/tickets/{ticket_id}"
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        ticket.status = "needs_human_review"
        session.add(ticket)
        session.commit()
    approved = client.post(f"{endpoint}/human-review", json={"action": "approve", "comment": "Aprobado por revisión final"})
    assert approved.status_code == 200
    assert approved.json()["status"] == "done"
    assert approved.json()["final_document_available"] is True
    assert "Almacenamiento" in approved.json()["final_proposal"]
    downloaded = client.get(f"{endpoint}/final-document")
    assert downloaded.status_code == 200
    assert downloaded.headers["content-type"].startswith("text/markdown")
    assert downloaded.text == approved.json()["final_proposal"]

    archived_id = _seed_approval_ticket(client)
    with Session(client.app.state.test_engine) as session:
        ticket = session.get(RfpTicket, archived_id)
        ticket.status = "needs_human_review"
        session.add(ticket)
        session.commit()
    rejected = client.post(f"/rfp-intake/tickets/{archived_id}/human-review", json={
        "action": "reject", "comment": "No cumple condiciones", "field_updates": {"disposition": "archived"},
    })
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "archived"


def test_approval_api_arbitrates_currency_conflict_and_blocks_final_proposal(client):
    ticket_id = _seed_approval_ticket(
        client,
        lastmile_draft="Entregas en EUR; SLA y cobertura pendientes.",
    )
    client.app.dependency_overrides[get_current_user] = lambda: {"id": "admin-user", "role": "admin"}
    endpoint = f"/rfp-intake/tickets/{ticket_id}"
    assert client.post(f"{endpoint}/start-approval").status_code == 200

    client.post(
        f"{endpoint}/departments/lastmile/decision",
        json={"decision": "approve", "approver_name": "Carlos Vega"},
    )
    response = client.post(
        f"{endpoint}/departments/warehouse/decision",
        json={"decision": "approve", "approver_name": "Ana Whitfield"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "waiting_for_approval"
    assert payload["final_proposal"] is None
    assert any(trace["node_name"] == "arbitration" for trace in payload["approval_trace"])
    with Session(client.app.state.test_engine) as session:
        assert session.get(RfpTicket, ticket_id).final_proposal is None


def test_approval_api_blocks_reverse_section_with_sub_48h_returns_promise(client):
    ticket_id = _seed_approval_ticket(client, extra_sections=[(
        "reverse",
        "Sofía Ramos",
        "Devoluciones procesadas en menos de 24 horas; tarifas en USD.",
        {"overall_pass": True},
    )])
    client.app.dependency_overrides[get_current_user] = lambda: {"id": "admin-user", "role": "admin"}
    endpoint = f"/rfp-intake/tickets/{ticket_id}"
    assert client.post(f"{endpoint}/start-approval").status_code == 200

    for department, approver in (("warehouse", "Ana Whitfield"), ("lastmile", "Carlos Vega")):
        response = client.post(
            f"{endpoint}/departments/{department}/decision",
            json={"decision": "approve", "approver_name": approver},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "waiting_for_approval"

    reverse = client.post(
        f"{endpoint}/departments/reverse/decision",
        json={"decision": "approve", "approver_name": "Sofía Ramos"},
    )
    assert reverse.status_code == 200
    payload = reverse.json()
    assert payload["status"] == "waiting_for_approval"
    assert payload["final_proposal"] is None
    sections = {section["department_id"]: section for section in payload["sections"]}
    assert sections["reverse"]["approval_status"] == "changes_requested"
    assert "menos de 48 horas" in sections["reverse"]["approval_comment"]
    assert any(
        trace["node_name"] == "arbitration"
        and trace["output"].get("resolved") is False
        for trace in payload["approval_trace"]
    )


def test_approval_api_regenerates_only_requested_section_then_publishes(client, monkeypatch):
    original_warehouse_draft = "Borrador Warehouse original en USD."
    original_lastmile_draft = "Borrador Last Mile original en USD."
    ticket_id = _seed_approval_ticket(
        client,
        warehouse_draft=original_warehouse_draft,
        lastmile_draft=original_lastmile_draft,
    )
    client.app.dependency_overrides[get_current_user] = lambda: {"id": "admin-user", "role": "admin"}
    ticket_endpoint = f"/rfp-intake/tickets/{ticket_id}"
    assert client.post(f"{ticket_endpoint}/start-approval").status_code == 200

    from data.pipelines import rfp_response_generation

    calls = []
    regenerated_draft = "Borrador Warehouse regenerado con capacidad confirmada en USD."

    def fake_run_section_cycle(department_id, metadata, key_aspects, open_questions, *, max_iterations,
                               generator=None, evaluator=None, initial_feedback="", **kwargs):
        calls.append({
            "department_id": department_id,
            "metadata": metadata,
            "key_aspects": key_aspects,
            "open_questions": open_questions,
            "max_iterations": max_iterations,
            "initial_feedback": initial_feedback,
        })
        return {
            "draft_content": regenerated_draft,
            "evaluation_results": {"overall_pass": True},
            "generation_iterations": 1,
            "needs_human_review": False,
        }

    monkeypatch.setattr(rfp_response_generation, "run_section_cycle", fake_run_section_cycle)
    request_changes = client.post(
        f"{ticket_endpoint}/departments/warehouse/decision",
        json={
            "decision": "request_changes",
            "approver_name": "Ana Whitfield",
            "comment": "Confirma la capacidad y conserva USD.",
        },
    )
    assert request_changes.status_code == 200
    regenerated = request_changes.json()
    assert regenerated["status"] == "waiting_for_approval"
    sections = {section["department_id"]: section for section in regenerated["sections"]}
    assert sections["warehouse"]["draft_content"] == regenerated_draft
    assert sections["warehouse"]["approval_status"] == "pending"
    assert sections["warehouse"]["approval_comment"] == "Confirma la capacidad y conserva USD."
    assert sections["warehouse"]["generation_iterations"] == 1
    assert sections["lastmile"]["draft_content"] == original_lastmile_draft
    assert sections["lastmile"]["generation_iterations"] == 0
    assert sections["lastmile"]["approval_status"] == "pending"
    assert calls == [{
        "department_id": "warehouse",
        "metadata": {"client_country": "US", "currency": "USD", "client_name": None, "monthly_volume": None},
        "key_aspects": [],
        "open_questions": [],
        "max_iterations": 3,
        "initial_feedback": "Confirma la capacidad y conserva USD.",
    }]

    lastmile = client.post(
        f"{ticket_endpoint}/departments/lastmile/decision",
        json={"decision": "approve", "approver_name": "Carlos Vega"},
    )
    assert lastmile.status_code == 200
    assert lastmile.json()["status"] == "waiting_for_approval"

    warehouse = client.post(
        f"{ticket_endpoint}/departments/warehouse/decision",
        json={"decision": "approve", "approver_name": "Ana Whitfield"},
    )
    assert warehouse.status_code == 200
    published = warehouse.json()
    assert published["status"] == "needs_human_review"
    assert f"## warehouse\n\n{regenerated_draft}" in published["final_proposal"]
    assert f"## lastmile\n\n{original_lastmile_draft}" in published["final_proposal"]
    assert sum(call["department_id"] == "warehouse" for call in calls) == 1
    assert any(
        trace["node_name"] == "regenerate_section"
        and trace["department_id"] == "warehouse"
        and trace["input"].get("feedback") == "Confirma la capacidad y conserva USD."
        for trace in published["approval_trace"]
    )
