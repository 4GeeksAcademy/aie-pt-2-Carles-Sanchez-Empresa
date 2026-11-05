"""Pruebas pequeñas y deterministas para Parte 2 de RFP."""
from types import SimpleNamespace
from threading import Barrier

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, select

from data.pipelines.rfp_response_generation import (
    DraftResult,
    EvaluationResult,
    ReadabilityResult,
    RelevanceResult,
    ComplianceResult,
    COMPLIANCE_EVALUATOR,
    DEPARTMENT_GENERATORS,
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


def test_department_generators_are_distinct_and_scoped(monkeypatch):
    from data.pipelines import rfp_response_generation as generation

    prompts = []

    def draft(department_id, _metadata, _aspects, _questions, _feedback, **kwargs):
        prompts.append((department_id, kwargs["proposal_scope"]))
        return DraftResult(content=f"Sección {department_id}")

    monkeypatch.setattr(generation, "generate_draft", draft)
    for department_id, agent in DEPARTMENT_GENERATORS.items():
        result = agent(department_id, {}, [], [], client=object())
        assert result.content == f"Sección {department_id}"
    assert len({id(agent) for agent in DEPARTMENT_GENERATORS.values()}) == 3
    assert {department for department, _scope in prompts} == {"warehouse", "lastmile", "reverse"}
    assert len({scope for _department, scope in prompts}) == 3


def test_generator_prompt_includes_department_specific_proposal_section():
    captured = {}

    def create(**kwargs):
        captured.update(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(
            content='{"content":"Sección warehouse pendiente de confirmar.","open_questions":[]}'))])

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    DEPARTMENT_GENERATORS["warehouse"](
        "warehouse", {"client_country": "Spain"}, ["500 SKU"], [], client=client,
    )
    assert "costo por pallet/SKU" in captured["messages"][0]["content"]
    assert "500 SKU" in captured["messages"][1]["content"]


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


def test_compliance_evaluator_enforces_briefing_currency_sla_and_volume_table():
    # BRIEFING §5: Spain must quote EUR, state the committed delivery SLA,
    # and include a volume discount table. Missing all three fails compliance.
    result = COMPLIANCE_EVALUATOR.evaluate(
        "warehouse", "Propuesta pendiente de confirmar.", {"client_country": "Spain"},
    )
    assert result.passed is False
    assert {"currency_by_country", "delivery_sla", "volume_discount_table"} <= set(result.rule_ids)


def test_compliance_evaluator_rejects_any_sub_48h_returns_promise():
    from data.pipelines.rfp_response_generation import _compliance_violations

    violations = _compliance_violations(
        "Se procesarán las devoluciones en menos de 36 horas.", "Spain", "reverse",
    )
    assert "returns_minimum_48h" in {rule_id for rule_id, _message in violations}


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


def test_generic_evaluator_failure_is_converted_to_human_review():
    result = run_section_cycle(
        "warehouse", {}, ["capacidad"], [], max_iterations=3,
        generator=lambda department_id, _metadata, _aspects, _questions, _feedback, **_kwargs: DraftResult(
            content="Borrador preservado para revisión manual."
        ),
        evaluator=lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("evaluator unavailable")),
    )
    assert result["needs_human_review"] is True
    assert result["draft_content"] == "Borrador preservado para revisión manual."
    assert result["evaluation_results"]["compliance"]["rule_ids"] == ["evaluation_error"]


def test_ticket_runs_department_workstreams_in_parallel_and_isolates_failure(tmp_path):
    # File-based SQLite: real multi-connection concurrency between workstreams
    # (the in-memory StaticPool engine shares a single connection across threads).
    engine = create_engine(
        f"sqlite:///{tmp_path / 'part2-parallel.sqlite'}",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(
        engine, tables=[RfpTicket.__table__, RfpMetadata.__table__, DepartmentSection.__table__]
    )
    with Session(engine) as session:
        ticket = RfpTicket(status="analisis_completo", raw_pdf_path="not-read-by-part2.pdf")
        session.add(ticket)
        session.flush()
        ticket.handoff_payload = {
            "ticket_id": ticket.ticket_id,
            "metadata": {"client_country": "US"},
            "key_aspects": ["cobertura"],
            "active_workstreams": [
                {"department_id": "warehouse", "key_aspects": ["storage_capacity"], "open_questions": []},
                {"department_id": "lastmile", "key_aspects": ["delivery_sla"], "open_questions": []},
            ],
        }
        session.add(RfpMetadata(ticket_id=ticket.ticket_id, client_country="US", currency="USD"))
        session.add(DepartmentSection(
            ticket_id=ticket.ticket_id, department_id="warehouse", owner="Ana Whitfield",
            key_aspects=["storage_capacity"], open_questions=[],
        ))
        session.add(DepartmentSection(
            ticket_id=ticket.ticket_id, department_id="lastmile", owner="Carlos Vega",
            key_aspects=["delivery_sla"], open_questions=[],
        ))
        session.commit()
        ticket_id = ticket.ticket_id

    rendezvous = Barrier(2)

    def generator(department_id, *_args, **_kwargs):
        rendezvous.wait(timeout=5)
        if department_id == "warehouse":
            raise RuntimeError("generator unavailable")
        return DraftResult(content="Borrador lastmile para revisión.")

    def evaluator(department_id, *_args, **_kwargs):
        return EvaluationResult(
            department_id=department_id,
            readability=ReadabilityResult(passed=True, score=60, details="ok"),
            relevance=RelevanceResult(passed=True, missing_aspects=[]),
            compliance=ComplianceResult(passed=True, rule_ids=[], violations=[]),
            overall_pass=True,
            feedback_for_generator="ok",
        )

    result = generate_ticket_responses(
        ticket_id, db_engine=engine, generator=generator, evaluator=evaluator,
        retrieve_fn=lambda _query, k: [],
        max_iterations=1,
    )
    sections = {item["department_id"]: item for item in result["sections"]}
    assert set(sections) == {"warehouse", "lastmile"}
    assert sections["warehouse"]["needs_human_review"] is True
    assert sections["lastmile"]["draft_content"] == "Borrador lastmile para revisión."
    with Session(engine) as session:
        stored = session.exec(select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)).all()
        assert {item.department_id for item in stored} == {"warehouse", "lastmile"}
        assert {item.department_id for item in stored if item.needs_human_review} == {"warehouse"}
        assert {item.department_id for item in stored if item.draft_content == "Borrador lastmile para revisión."} == {"lastmile"}
    engine.dispose()


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
