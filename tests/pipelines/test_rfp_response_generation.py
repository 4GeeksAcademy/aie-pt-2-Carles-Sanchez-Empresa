"""Pruebas pequeñas y deterministas para Parte 2 de RFP."""
from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, select

from data.pipelines.rfp_response_generation import (
    DraftResult,
    EvaluationResult,
    ReadabilityResult,
    RelevanceResult,
    ComplianceResult,
    evaluate_draft,
    generate_draft,
    generate_ticket_responses,
    retrieve_company_knowledge,
    run_section_cycle,
)
from models import DepartmentSection, RfpMetadata, RfpTicket


def fake_client(content):
    response = SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])
    return SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=lambda **_kwargs: response)))


def database():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    SQLModel.metadata.create_all(engine, tables=[RfpTicket.__table__, RfpMetadata.__table__, DepartmentSection.__table__])
    return engine


def test_generator_uses_handoff_and_returns_open_questions():
    client = fake_client('{"content":"La propuesta de almacén está pendiente de confirmar.","open_questions":["¿Qué capacidad requiere?"]}')
    draft = generate_draft(
        "warehouse", {"client_country": "Spain"}, ["capacidad de almacenamiento"], [],
        knowledge_context=[{"source_document": "storage-pricing", "text": "18 USD por m³"}], client=client,
    )
    assert "pendiente" in draft.content
    assert draft.open_questions == ["¿Qué capacidad requiere?"]
    request = client.chat.completions.create
    assert request is not None


def test_rag_context_is_limited_to_approved_company_sources():
    chunks = [
        {"source_document": "sla-delivery", "section": "SLA", "text": "SLA 90%"},
        {"source_document": "carrier-coverage", "text": "carrier data"},
        {"source_document": "unknown-source", "text": "untrusted"},
    ]
    context = retrieve_company_knowledge(
        "warehouse", {"client_country": "US"}, ["capacidad"],
        retrieve_fn=lambda _query, k: chunks,
    )
    assert [item["source_document"] for item in context] == ["sla-delivery"]


def test_compliance_evaluator_fails_for_forbidden_returns_under_48_hours():
    content = (
        "Propuesta para devoluciones: TrackFlow procesará todas las devoluciones en menos de 24 horas. "
        "Se presenta una tabla de descuentos por volumen con tramos e importes pendientes. "
        "El SLA de entregas es 90% por mes. "
        "Este texto explica el alcance, los pasos operativos y los datos que todavía deben confirmar ambas partes. "
        "No se han añadido importes ni cálculos que no estén respaldados por la solicitud del cliente."
    )
    result = evaluate_draft(
        "reverse", content, {"client_country": "Spain"}, ["procesamiento de devoluciones"],
        client=fake_client('{"passed":true,"missing_aspects":[]}'),
    )
    assert result.compliance.passed is False
    assert "returns_minimum_48h" in result.compliance.rule_ids


def test_iteration_limit_keeps_last_draft_and_evaluation():
    calls = []

    def generator(department_id, _metadata, _aspects, _questions, feedback, **_kwargs):
        calls.append(feedback)
        return DraftResult(content=f"Borrador {len(calls)}", open_questions=[])

    def evaluator(department_id, content, _metadata, _aspects, **_kwargs):
        return EvaluationResult(
            department_id=department_id,
            readability=ReadabilityResult(passed=False, score=10, details="Hazlo más claro."),
            relevance=RelevanceResult(passed=True, missing_aspects=[]),
            compliance=ComplianceResult(passed=True, rule_ids=[], violations=[]),
            overall_pass=False,
            feedback_for_generator="Simplifica las frases.",
        )

    result = run_section_cycle(
        "warehouse", {}, ["almacenamiento"], [], max_iterations=2,
        generator=generator, evaluator=evaluator,
    )
    assert result["draft_content"] == "Borrador 2"
    assert result["generation_iterations"] == 2
    assert result["needs_human_review"] is True
    assert calls == ["", "Simplifica las frases."]
    assert result["evaluation_results"]["overall_pass"] is False


def test_ticket_consumes_stored_handoff_and_persists_part2_result():
    engine = database()
    with Session(engine) as session:
        ticket = RfpTicket(status="analisis_completo", raw_pdf_path="not-read-by-part2.pdf")
        session.add(ticket)
        session.flush()
        ticket.handoff_payload = {
            "ticket_id": ticket.ticket_id,
            "active_workstreams": [{
                "department_id": "warehouse",
                "key_aspects": ["storage_capacity: Volumen no especificado"],
                "open_questions": ["¿Qué capacidad se requiere?"],
            }],
        }
        session.add(RfpMetadata(ticket_id=ticket.ticket_id, client_country="US", currency="USD"))
        session.add(DepartmentSection(
            ticket_id=ticket.ticket_id, department_id="warehouse", owner="Ana Whitfield",
            key_aspects=["Volumen no especificado"], open_questions=["¿Qué capacidad se requiere?"],
        ))
        session.commit()
        ticket_id = ticket.ticket_id

    def generator(department_id, _metadata, _aspects, questions, _feedback, **_kwargs):
        return DraftResult(content="Borrador almacenado pendiente de datos de capacidad.", open_questions=questions)

    def evaluator(department_id, _content, _metadata, _aspects, **_kwargs):
        return EvaluationResult(
            department_id=department_id,
            readability=ReadabilityResult(passed=True, score=50, details="OK"),
            relevance=RelevanceResult(passed=True, missing_aspects=[]),
            compliance=ComplianceResult(passed=True, rule_ids=[], violations=[]),
            overall_pass=True, feedback_for_generator="Sin cambios.",
        )

    result = generate_ticket_responses(
        ticket_id, db_engine=engine, generator=generator, evaluator=evaluator,
        retrieve_fn=lambda _query, k: [],
    )
    assert result["status"] == "en_evaluación"
    with Session(engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        section = session.exec(select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)).one()
        assert ticket.status == "en_evaluación"
        assert section.draft_content.startswith("Borrador almacenado")
        assert section.evaluation_results["overall_pass"] is True
        assert ticket.handoff_payload["response_generation"]["ready_for_part3"] is True
    engine.dispose()
