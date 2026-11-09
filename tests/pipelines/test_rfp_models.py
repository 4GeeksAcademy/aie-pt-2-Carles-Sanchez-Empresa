"""Tests deterministas del contrato SQLModel para RFP Intake, sin DB remota."""

from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, select

from models import DepartmentSection, RfpMetadata, RfpTicket


@pytest.fixture

def rfp_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(
        engine,
        tables=[RfpTicket.__table__, RfpMetadata.__table__, DepartmentSection.__table__],
    )
    with Session(engine) as session:
        yield session
    engine.dispose()


def test_ticket_defaults_and_handoff_round_trip(rfp_session):
    ticket = RfpTicket(raw_pdf_path="data/raw/rfp-test.pdf")
    rfp_session.add(ticket)
    rfp_session.commit()
    rfp_session.refresh(ticket)

    assert ticket.ticket_id
    assert ticket.rfp_id
    assert ticket.status == "analizando"
    assert ticket.retry_count == 0
    assert ticket.failed_at is None

    ticket.status = "analisis_completo"
    ticket.handoff_schema_version = "1"
    ticket.handoff_payload = {
        "ticket_id": ticket.ticket_id,
        "workstreams": [{"department_id": "warehouse", "key_aspects": ["Sin volumen indicado"]}],
    }
    rfp_session.add(ticket)
    rfp_session.commit()

    stored = rfp_session.get(RfpTicket, ticket.ticket_id)
    assert stored is not None
    assert stored.handoff_payload["workstreams"][0]["department_id"] == "warehouse"


def test_metadata_keeps_missing_values_and_manual_review(rfp_session):
    ticket = RfpTicket(raw_pdf_path="data/raw/rfp-test.pdf")
    rfp_session.add(ticket)
    rfp_session.flush()
    metadata = RfpMetadata(
        ticket_id=ticket.ticket_id,
        services_requested=["warehousing"],
        departments_needed=["warehouse"],
        manual_review_required=True,
        manual_review_reason="Clasificación ambigua",
        readability_metrics={"word_count": 120},
        open_questions=["¿Cuál es el volumen mensual?"],
    )
    rfp_session.add(metadata)
    rfp_session.commit()

    stored = rfp_session.get(RfpMetadata, ticket.ticket_id)
    assert stored is not None
    assert stored.client_country is None
    assert stored.monthly_volume is None
    assert stored.currency is None
    assert stored.manual_review_required is True
    assert stored.departments_needed == ["warehouse"]


def test_department_section_persists_aspects_and_owner(rfp_session):
    ticket = RfpTicket(raw_pdf_path="data/raw/rfp-test.pdf")
    rfp_session.add(ticket)
    rfp_session.flush()
    section = DepartmentSection(
        ticket_id=ticket.ticket_id,
        department_id="reverse",
        owner="Sofía Ramos",
        relevant_extracts=["Solicitamos gestión de devoluciones"],
        key_aspects=["El volumen de devoluciones no está especificado"],
        open_questions=["¿Qué volumen de devoluciones se estima?"],
        evidence=["página 2"],
        created_at=datetime.now(timezone.utc),
    )
    rfp_session.add(section)
    rfp_session.commit()

    stored = rfp_session.exec(
        select(DepartmentSection).where(DepartmentSection.ticket_id == ticket.ticket_id)
    ).one()
    assert stored.department_id == "reverse"
    assert stored.owner == "Sofía Ramos"
    assert "no está especificado" in stored.key_aspects[0]


def test_part_one_status_constraint_accepts_part_three_approval_status(rfp_session):
    ticket = RfpTicket(raw_pdf_path="data/raw/rfp-test.pdf", status="waiting_for_approval")
    rfp_session.add(ticket)
    rfp_session.commit()
    assert ticket.status == "waiting_for_approval"
