"""Pruebas de persistencia y reanudación independiente de Parte 3."""
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, select

from models import DepartmentSection, RfpApprovalTrace, RfpMetadata, RfpNodeTrace, RfpTicket
from data.pipelines.rfp_approval import resume_approval, start_approval
from data.pipelines.rfp_approval_graph import thread_config


@pytest.fixture

def approval_engine():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine, tables=[
        RfpTicket.__table__, RfpMetadata.__table__, DepartmentSection.__table__,
        RfpApprovalTrace.__table__, RfpNodeTrace.__table__,
    ])
    ticket_id = "00000000-0000-0000-0000-000000000123"
    with Session(engine) as session:
        session.add(RfpTicket(ticket_id=ticket_id, status="en_evaluación", raw_pdf_path="/tmp/rfp.pdf"))
        session.add(RfpMetadata(ticket_id=ticket_id, client_country="US", currency="USD"))
        for department, owner in (("warehouse", "Ana Whitfield"), ("lastmile", "Carlos Vega")):
            session.add(DepartmentSection(ticket_id=ticket_id, department_id=department, owner=owner,
                                          draft_content=f"Borrador {department}, SLA 90%, USD.",
                                          evaluation_results={"overall_pass": True},
                                          created_at=datetime.now(timezone.utc)))
        session.commit()
    yield engine, ticket_id
    engine.dispose()


def test_departments_have_independent_threads_and_can_resume_out_of_order(approval_engine):
    engine, ticket_id = approval_engine
    started = start_approval(ticket_id, db_engine=engine)
    assert started["status"] == "waiting_for_approval"
    assert ":warehouse:approval-1" in started["threads"]["warehouse"]
    assert ":lastmile:approval-1" in started["threads"]["lastmile"]

    lastmile = resume_approval(ticket_id, "lastmile", "approve", db_engine=engine, approver_name="Carlos Vega")
    assert lastmile["status"] == "waiting_for_approval"
    with Session(engine) as session:
        warehouse = session.exec(select(DepartmentSection).where(
            DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == "warehouse")).one()
        assert warehouse.approval_status == "pending"
        assert ":warehouse:approval-1" in warehouse.checkpoint_thread_id

    warehouse = resume_approval(ticket_id, "warehouse", "approve", db_engine=engine, approver_name="Ana Whitfield")
    assert warehouse["status"] == "needs_human_review"
    with Session(engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        assert ticket.final_proposal.startswith("## lastmile") or "## warehouse" in ticket.final_proposal
        assert session.exec(select(RfpApprovalTrace).where(RfpApprovalTrace.ticket_id == ticket_id)).all()


def test_invalid_decisions_and_wrong_approver_are_rejected(approval_engine):
    engine, ticket_id = approval_engine
    start_approval(ticket_id, db_engine=engine)
    with pytest.raises(ValueError, match="Decisión no válida"):
        resume_approval(ticket_id, "warehouse", "maybe", db_engine=engine, approver_name="Ana Whitfield")
    with pytest.raises(ValueError, match="Aprobador no autorizado"):
        resume_approval(ticket_id, "warehouse", "approve", db_engine=engine, approver_name="Miguel Torres")


def test_iteration_limit_blocks_regeneration(approval_engine):
    engine, ticket_id = approval_engine
    start_approval(ticket_id, db_engine=engine)
    with Session(engine) as session:
        section = session.exec(select(DepartmentSection).where(
            DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == "warehouse")).one()
        section.generation_iterations = 3
        session.add(section)
        session.commit()
    with pytest.raises(ValueError, match="límite de iteraciones"):
        resume_approval(ticket_id, "warehouse", "request_changes", db_engine=engine,
                        approver_name="Ana Whitfield", comment="Ajustar capacidad")
    with Session(engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        section = session.exec(select(DepartmentSection).where(
            DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == "warehouse")).one()
        assert ticket.status == "needs_human_review"
        assert section.needs_human_review is True


def test_volume_vs_capacity_is_arbitrated_and_blocks_publication(approval_engine):
    engine, ticket_id = approval_engine
    with Session(engine) as session:
        warehouse = session.exec(select(DepartmentSection).where(
            DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == "warehouse")).one()
        warehouse.evaluation_results = {"overall_pass": True, "conflict_triggers": [
            {"type": "volume-vs-capacity", "warehouse_capacity": 1000, "proposed_volume": 1500},
        ]}
        session.add(warehouse)
        session.commit()
    start_approval(ticket_id, db_engine=engine)
    resume_approval(ticket_id, "lastmile", "approve", db_engine=engine, approver_name="Carlos Vega")
    result = resume_approval(ticket_id, "warehouse", "approve", db_engine=engine, approver_name="Ana Whitfield")
    assert result["status"] == "waiting_for_approval"
    assert any(conflict["trigger"] == "volume-vs-capacity" and conflict["arbiter"] == "Miguel Torres"
               for conflict in result["conflicts"])
    with Session(engine) as session:
        assert session.get(RfpTicket, ticket_id).final_proposal is None
        warehouse = session.exec(select(DepartmentSection).where(
            DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == "warehouse")).one()
        assert warehouse.approval_status == "changes_requested"


def test_approval_request_replay_is_idempotent(approval_engine):
    engine, ticket_id = approval_engine
    start_approval(ticket_id, db_engine=engine)
    result = resume_approval(ticket_id, "warehouse", "approve", db_engine=engine,
                             approver_name="Ana Whitfield", request_id="decision-123")
    assert result["status"] == "waiting_for_approval"
    replay = resume_approval(ticket_id, "warehouse", "approve", db_engine=engine,
                             approver_name="Ana Whitfield", request_id="decision-123")
    assert replay["idempotent_replay"] is True


def test_langgraph_checkpoint_resumes_namespaced_department(tmp_path, monkeypatch):
    from data.pipelines import rfp_approval_graph as graph_module

    monkeypatch.setenv("RFP_CHECKPOINT_DB", str(tmp_path / "checkpoints.sqlite"))
    config = thread_config("ticket-a", "warehouse", 2)
    paused, values = graph_module.pause_for_approval(ticket_id="ticket-a", department_id="warehouse",
                                                     approval_iteration=2, draft="Draft", config=config)
    assert paused["interrupts"][0]["department_id"] == "warehouse"
    assert graph_module.resume_department(ticket_id="ticket-a", department_id="warehouse",
                                          approval_iteration=2, decision={"decision": "approve"},
                                          config=config)["decision"]["decision"] == "approve"
    other = thread_config("ticket-a", "lastmile", 2)
    assert other["configurable"]["thread_id"] != config["configurable"]["thread_id"]
    assert values["department_id"] == "warehouse"


def test_currency_conflict_blocks_final_proposal(approval_engine):
    engine, ticket_id = approval_engine
    with Session(engine) as session:
        section = session.exec(select(DepartmentSection).where(
            DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == "lastmile")).one()
        section.draft_content = "Borrador Last Mile, SLA 90%, EUR."
        session.add(section)
        session.commit()
    start_approval(ticket_id, db_engine=engine)
    resume_approval(ticket_id, "lastmile", "approve", db_engine=engine, approver_name="Carlos Vega")
    result = resume_approval(ticket_id, "warehouse", "approve", db_engine=engine, approver_name="Ana Whitfield")
    assert result["status"] == "waiting_for_approval"
    assert result["conflicts"][0]["trigger"] == "currency-mismatch"
    with Session(engine) as session:
        assert session.get(RfpTicket, ticket_id).final_proposal is None


def test_returns_breach_rejects_reverse_under_sofia_and_requires_changes(approval_engine):
    engine, ticket_id = approval_engine
    with Session(engine) as session:
        session.add(DepartmentSection(ticket_id=ticket_id, department_id="reverse", owner="Sofía Ramos",
                                      draft_content="Devoluciones procesadas en menos de 24 horas; SLA 90%, USD.",
                                      evaluation_results={"overall_pass": True}))
        session.commit()
    start_approval(ticket_id, db_engine=engine)
    resume_approval(ticket_id, "warehouse", "approve", db_engine=engine, approver_name="Ana Whitfield")
    resume_approval(ticket_id, "lastmile", "approve", db_engine=engine, approver_name="Carlos Vega")
    result = resume_approval(ticket_id, "reverse", "approve", db_engine=engine, approver_name="Sofía Ramos")
    assert result["status"] == "waiting_for_approval"
    assert result["conflicts"][0]["arbiter"] == "Sofía Ramos"
    with Session(engine) as session:
        reverse = session.exec(select(DepartmentSection).where(
            DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == "reverse")).one()
        assert reverse.approval_status == "changes_requested"
        assert "menos de 48 horas" in reverse.approval_comment
        assert session.get(RfpTicket, ticket_id).final_proposal is None
