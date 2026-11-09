"""Deterministic integration path from PDF intake through final approval."""
from pathlib import Path
from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlmodel import Session, SQLModel, select

from data.pipelines import rfp_response_generation as generation
from data.pipelines.rfp_approval import resume_approval, start_approval
from data.pipelines.rfp_intake import pipeline as intake
from data.pipelines.rfp_intake.workstreams import DepartmentWorkerOutput, WorkerAspect
from models import DepartmentSection, RfpApprovalTrace, RfpMetadata, RfpNodeTrace, RfpTicket


class FakeConverter:
    def convert(self, _path):
        return SimpleNamespace(text_content=(
            "ModaViva solicita almacenamiento y preparación de pedidos en Estados Unidos. "
            "Necesitamos cobertura de entregas y un volumen mensual por confirmar."
        ))


def _database(path):
    engine = create_engine(
        f"sqlite:///{path}", connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine, tables=[
        RfpTicket.__table__, RfpMetadata.__table__, DepartmentSection.__table__,
        RfpApprovalTrace.__table__, RfpNodeTrace.__table__,
    ])
    return engine


def test_rfp_ticket_runs_from_intake_to_independent_final_approval(tmp_path, monkeypatch):
    engine = _database(tmp_path / "rfp-e2e.sqlite")
    import routes.rfp_intake as rfp_api
    monkeypatch.setattr(rfp_api, "RAW_DATA_DIR", tmp_path / "raw")
    pdf_path = tmp_path / "modaviva.pdf"
    pdf_path.write_bytes(b"%PDF-deterministic")
    with Session(engine) as session:
        ticket = RfpTicket(raw_pdf_path=str(pdf_path))
        session.add(ticket)
        session.commit()
        session.refresh(ticket)
        ticket_id = ticket.ticket_id

    monkeypatch.setattr(intake, "MARKDOWN_DIR_NAME", str(tmp_path / "markdown"))
    classification = intake.Classification(
        is_rfp=True,
        confidence="high",
        reason="Solicitud de servicios logísticos de cliente.",
        evidence=["solicita almacenamiento", "cobertura de entregas"],
        client_name="ModaViva",
        client_country="US",
        services_requested=["warehousing", "delivery"],
        monthly_volume=None,
        departments_needed=["warehouse", "lastmile"],
        open_questions=["¿Cuál es el volumen mensual?"],
    )

    def worker(department_id, _metadata, extracts):
        assert extracts
        aspect = "storage_capacity" if department_id == "warehouse" else "delivery_sla"
        return DepartmentWorkerOutput(
            key_aspects=[WorkerAspect(
                aspect_key=aspect,
                finding=f"Alcance de {department_id} pendiente de confirmar.",
                source_extract=extracts[0],
            )],
            open_questions=[],
            missing_data=[],
        )

    analyzed = intake.process_ticket(
        ticket_id,
        converter=FakeConverter(),
        classifier=lambda _text: classification,
        worker=worker,
        db_engine=engine,
    )
    assert analyzed["status"] == "analisis_completo"

    def draft(department_id, _metadata, _aspects, _questions, _feedback, **_kwargs):
        assert department_id in {"warehouse", "lastmile"}
        proposal = {
            "warehouse": "Almacenamiento en USD; capacidad por confirmar.",
            "lastmile": "Entregas en USD; SLA y cobertura por confirmar.",
        }
        return generation.DraftResult(content=proposal[department_id], open_questions=[])

    def evaluate(department_id, _content, _metadata, _aspects, **_kwargs):
        assert department_id in {"warehouse", "lastmile"}
        return generation.EvaluationResult(
            department_id=department_id,
            readability=generation.ReadabilityResult(passed=True, score=90, details="ok"),
            relevance=generation.RelevanceResult(passed=True, missing_aspects=[]),
            compliance=generation.ComplianceResult(passed=True, rule_ids=[], violations=[]),
            overall_pass=True,
            feedback_for_generator="ok",
        )

    generated = generation.generate_ticket_responses(
        ticket_id,
        db_engine=engine,
        generator=draft,
        evaluator=evaluate,
        max_iterations=1,
        retrieve_fn=lambda _query, _limit: [],
    )
    assert generated["status"] == "en_evaluación"
    assert {section["department_id"] for section in generated["sections"]} == {"warehouse", "lastmile"}

    gate = start_approval(ticket_id, db_engine=engine)
    assert set(gate["threads"]) == {"warehouse", "lastmile"}
    assert gate["threads"]["warehouse"] != gate["threads"]["lastmile"]

    paused = resume_approval(
        ticket_id, "lastmile", "approve", db_engine=engine, approver_name="Carlos Vega",
    )
    assert paused["status"] == "waiting_for_approval"
    with Session(engine) as session:
        sections = {row.department_id: row for row in session.exec(
            select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)
        ).all()}
        assert sections["lastmile"].approval_status == "approved"
        assert sections["warehouse"].approval_status == "pending"
        assert session.get(RfpTicket, ticket_id).final_proposal is None

    completed = resume_approval(
        ticket_id, "warehouse", "approve", db_engine=engine, approver_name="Ana Whitfield",
    )
    assert completed["status"] == "needs_human_review"
    with Session(engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        traces = session.exec(select(RfpApprovalTrace).where(
            RfpApprovalTrace.ticket_id == ticket_id,
        )).all()
        assert ticket.final_proposal is not None
        assert "## warehouse" in ticket.final_proposal
        assert "## lastmile" in ticket.final_proposal
        assert ticket.final_proposal_created_at is not None
        assert {trace.node_name for trace in traces} >= {
            "interrupt_before_approval", "resume_department", "publish_final_proposal",
        }
    from routes.rfp_intake import HumanReviewAction, review_rfp
    with Session(engine) as session:
        edited = review_rfp(
            ticket_id,
            HumanReviewAction(
                action="edit",
                comment="Volumen confirmado en revisión final.",
                field_updates={
                    "metadata": {"monthly_volume": 12000},
                    "sections": {
                        "warehouse": {
                            "draft_content": "Almacenamiento en USD; capacidad para 12.000 pedidos mensuales.",
                        },
                    },
                },
            ),
            current_user={"id": "simulated-reviewer", "role": "admin"},
            session=session,
        )
        assert edited.status == "needs_human_review"
        assert any("12.000 pedidos mensuales" in item["draft_content"] for item in edited.sections)

        reviewed = review_rfp(
            ticket_id,
            HumanReviewAction(action="approve", comment="Revisión final aprobada"),
            current_user={"id": "simulated-reviewer", "role": "admin"},
            session=session,
        )
        assert reviewed.status == "done"
        assert reviewed.final_document_available is True
        document = reviewed.final_proposal
        ticket = session.get(RfpTicket, ticket_id)
        assert document == ticket.final_proposal
        assert "- Volumen mensual: 12000" in document
        assert "Almacenamiento en USD; capacidad para 12.000 pedidos mensuales." in document
        assert "## lastmile\n\nEntregas en USD; SLA y cobertura por confirmar." in document
        assert Path(ticket.final_document_path).read_text(encoding="utf-8") == document
    engine.dispose()