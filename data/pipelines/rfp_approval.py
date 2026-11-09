"""Parte 3: pausa durable por departamento, arbitraje determinista y cierre RFP.

La fila de cada departamento es su checkpoint durable: su thread_id permite
reanudar una rama sin desbloquear ni reiniciar las demás.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

from sqlmodel import Session, select

from models import DepartmentSection, RfpApprovalTrace, RfpMetadata, RfpTicket

APPROVERS = {
    "warehouse": "Miguel Torres",
    "lastmile": "Carlos Vega",
    "reverse": "Sofía Ramos",
}
# La aprobación operativa de Warehouse corresponde a Ana Whitfield; se mantiene
# separada del arbitraje transversal de Miguel Torres.
SECTION_APPROVERS = {"warehouse": "Ana Whitfield", "lastmile": "Carlos Vega", "reverse": "Sofía Ramos"}
MAX_ITERATIONS = 3
ACTIVE_DEPARTMENTS = {"warehouse", "lastmile", "reverse"}


def _now():
    return datetime.now(timezone.utc)


def _trace(session, ticket_id, node, agent, input_payload, output_payload, department_id=None):
    timestamp = _now()
    payload = dict(
        ticket_id=ticket_id, department_id=department_id, node_name=node,
        agent_name=agent, input_payload=input_payload, output_payload=output_payload,
        created_at=timestamp,
    )
    session.add(RfpApprovalTrace(**payload))


def trace_pipeline_node(db_engine, ticket_id, node_name, agent_name, input_payload, output_payload,
                       department_id=None):
    """Persist an auditable execution record for a node in Parts 1–3."""
    with Session(db_engine) as session:
        _trace(session, ticket_id, node_name, agent_name, input_payload, output_payload, department_id)
        session.commit()


def _active_sections(session, ticket_id):
    rows = session.exec(select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)).all()
    return sorted((row for row in rows if row.department_id in ACTIVE_DEPARTMENTS), key=lambda row: row.department_id)


def start_approval(ticket_id: str, *, db_engine) -> dict:
    """Create one durable approval interrupt/checkpoint per active section."""
    with Session(db_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        if ticket is None:
            raise ValueError("Ticket RFP no encontrado.")
        if ticket.status not in {"en_evaluación", "waiting_for_approval"}:
            raise ValueError("El ticket todavía no está listo para aprobación.")
        sections = _active_sections(session, ticket_id)
        if not sections or any(not section.draft_content for section in sections):
            raise ValueError("Todas las secciones activas deben tener un borrador.")
        if ticket.status == "waiting_for_approval" and all(section.checkpoint_thread_id for section in sections):
            return {"ticket_id": ticket_id, "status": ticket.status,
                    "threads": {section.department_id: section.checkpoint_thread_id for section in sections}}
        from data.pipelines.rfp_approval_graph import pause_for_approval, thread_config
        for section in sections:
            if section.needs_human_review:
                section.approval_status = "pending"
            section.approval_iteration += 1
            config = thread_config(ticket_id, section.department_id, section.approval_iteration)
            checkpoint = pause_for_approval(
                ticket_id=ticket_id, department_id=section.department_id,
                approval_iteration=section.approval_iteration,
                draft=section.draft_content, config=config,
            )
            section.checkpoint_thread_id = config["configurable"]["thread_id"]
            _trace(session, ticket_id, "interrupt_before_approval", "approval_gate",
                   {"department_id": section.department_id, "draft": section.draft_content},
                   {"interrupted": True, "thread_id": section.checkpoint_thread_id,
                    "checkpoint": checkpoint[0]}, section.department_id)
            session.add(section)
        ticket.status = "waiting_for_approval"
        ticket.updated_at = _now()
        session.add(ticket)
        session.commit()
        return {"ticket_id": ticket_id, "status": ticket.status,
                "threads": {section.department_id: section.checkpoint_thread_id for section in sections}}


def _conflicts(sections, metadata):
    """Structured, deterministic BRIEFING conflict detector; never uses agent voting."""
    found = []
    expected_currency = {"US": "USD", "Spain": "EUR"}.get(metadata.client_country if metadata else None)
    all_text = {section.department_id: (section.draft_content or "") for section in sections}
    currencies_by_department = {
        department: {currency for currency in ("USD", "EUR") if re.search(rf"\b{currency}\b", text)}
        for department, text in all_text.items()
    }
    offenders = [department for department, currencies in currencies_by_department.items()
                 if expected_currency and currencies and expected_currency not in currencies]
    if offenders:
        found.append({"trigger": "currency-mismatch", "sections": offenders,
                      "expected_currency": expected_currency, "arbiter": "Miguel Torres"})

    return_breach = []
    reverse_breach = False
    for department, text in all_text.items():
        lowered = text.casefold()
        patterns = (r"(?:devoluci\w*|return\w*).{0,120}?(?:menos de|less than|under|<|inferior(?:es)? a|within|dentro de)\s*(\d{1,2})\s*(?:h|horas?|hours?)",
                    r"(?:menos de|less than|under|<|inferior(?:es)? a|within|dentro de)\s*(\d{1,2})\s*(?:h|horas?|hours?).{0,100}?(?:devoluci\w*|return\w*)")
        if any((match := re.search(pattern, lowered, re.DOTALL)) and int(match.group(1)) < 48 for pattern in patterns):
            return_breach.append(department)
            reverse_breach = reverse_breach or department == "reverse"
    if return_breach:
        if reverse_breach:
            found.append({"trigger": "returns-sla-breach", "sections": ["reverse"],
                          "arbiter": "Sofía Ramos"})
        other_offenders = [department for department in return_breach if department != "reverse"]
        if other_offenders:
            found.append({"trigger": "returns-sla-breach", "sections": other_offenders,
                          "arbiter": "Miguel Torres"})

    # Evidencia estructurada y trazable; no inferimos capacidad o volumen desde prosa.
    trigger_values = {}
    for section in sections:
        for trigger in (section.evaluation_results or {}).get("conflict_triggers", []):
            if isinstance(trigger, dict) and trigger.get("type") == "volume-vs-capacity":
                trigger_values.update(trigger)
    capacity = trigger_values.get("warehouse_capacity")
    proposed = trigger_values.get("proposed_volume")
    if isinstance(capacity, (int, float)) and isinstance(proposed, (int, float)) and proposed > capacity:
        found.append({"trigger": "volume-vs-capacity", "sections": ["warehouse", "lastmile"],
                      "warehouse_capacity": capacity, "proposed_volume": proposed,
                      "arbiter": "Miguel Torres"})
    return found


def _apply_arbitration(session, ticket_id, sections, metadata):
    conflicts = _conflicts(sections, metadata)
    for conflict in conflicts:
        offenders = set(conflict["sections"])
        if conflict["trigger"] == "returns-sla-breach" and "reverse" in offenders and conflict["arbiter"] == "Sofía Ramos":
            reverse = next((s for s in sections if s.department_id == "reverse"), None)
            if reverse:
                # Sofía rechaza el contenido actual y exige corregirlo; la sección
                # queda reanudable para que el equipo pueda volver a presentarla.
                reverse.approval_status = "changes_requested"
                reverse.approval_comment = "Sofía Ramos rechaza esta propuesta: no se puede prometer procesamiento de devoluciones en menos de 48 horas."
                reverse.approved_at = None
                session.add(reverse)
                offenders.discard("reverse")
        for section in sections:
            if section.department_id in offenders:
                section.approval_status = "changes_requested"
                section.approval_comment = f"Arbitraje {conflict['trigger']}: resolver antes del cierre."
                section.approved_at = None
                session.add(section)
        _trace(session, ticket_id, "arbitration", conflict["arbiter"], conflict,
               {"resolved": False, "affected_sections": sorted(offenders)})
    return conflicts


def resume_approval(ticket_id: str, department_id: str, decision: str, *, db_engine,
                    approver_name: str, comment: str | None = None,
                    generator=None, evaluator=None, request_id: str | None = None) -> dict:
    """Resume exactly one department thread after validating the human decision."""
    if decision not in {"approve", "reject", "request_changes"}:
        raise ValueError("Decisión no válida: usa approve, reject o request_changes.")
    if department_id not in ACTIVE_DEPARTMENTS or approver_name != SECTION_APPROVERS[department_id]:
        raise ValueError("Aprobador no autorizado para este departamento.")
    with Session(db_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        section = session.exec(select(DepartmentSection).where(
            DepartmentSection.ticket_id == ticket_id,
            DepartmentSection.department_id == department_id,
        )).first()
        if ticket is None or section is None:
            raise ValueError("Ticket o departamento no encontrado.")
        if request_id and section.approval_request_id == request_id:
            return {"ticket_id": ticket_id, "status": ticket.status, "department_id": department_id,
                    "approval_status": section.approval_status, "idempotent_replay": True}
        if ticket.status != "waiting_for_approval" or not section.checkpoint_thread_id:
            raise ValueError("No hay una interrupción pendiente para este departamento.")
        if section.approval_status not in {"pending", "changes_requested"}:
            raise ValueError("La decisión de este departamento ya fue registrada.")
        old = {"department_id": department_id, "decision": decision, "draft": section.draft_content,
               "thread_id": section.checkpoint_thread_id, "approval_iteration": section.approval_iteration}
        if decision == "approve":
            section.approval_status = "approved"
            section.approver_name = approver_name
            section.approved_at = _now()
            section.approval_comment = comment
        elif decision == "reject":
            section.approval_status = "rejected"
            section.approver_name = approver_name
            section.approved_at = None
            section.approval_comment = comment
        else:
            section.approval_status = "changes_requested"
            section.approver_name = approver_name
            section.approved_at = None
            section.approval_comment = comment
        if request_id:
            section.approval_request_id = request_id
        session.add(section)
        _trace(session, ticket_id, "resume_department", approver_name, old,
               {"decision": decision, "comment": comment, "resumed_thread_id": section.checkpoint_thread_id}, department_id)
        session.commit()

    from data.pipelines.rfp_approval_graph import resume_department
    resume_department(
        ticket_id=ticket_id, department_id=department_id,
        approval_iteration=old["approval_iteration"],
        decision={"decision": decision, "approver_name": approver_name, "comment": comment},
    )

    if decision == "request_changes":
        # Reutiliza el generador y el evaluador de Parte 2 solo para esta rama.
        with Session(db_engine) as session:
            metadata_row = session.get(RfpMetadata, ticket_id)
            section = session.exec(select(DepartmentSection).where(
                DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == department_id
            )).first()
            remaining = MAX_ITERATIONS - section.generation_iterations
            if remaining <= 0:
                section.needs_human_review = True
                ticket = session.get(RfpTicket, ticket_id)
                ticket.status = "needs_human_review"
                _trace(session, ticket_id, "iteration_limit", approver_name,
                       {"iterations": section.generation_iterations}, {"blocked": True}, department_id)
                session.add(section); session.add(ticket); session.commit()
                raise ValueError("La sección alcanzó el límite de iteraciones y requiere revisión humana.")
            metadata = {"client_country": metadata_row.client_country, "currency": metadata_row.currency,
                        "client_name": metadata_row.client_name, "monthly_volume": metadata_row.monthly_volume}
            aspects = [str(item) for item in section.key_aspects]
            old_draft = section.draft_content or ""
            section_inputs = (department_id, metadata, aspects, section.open_questions)
        from data.pipelines.rfp_response_generation import run_section_cycle
        result = run_section_cycle(*section_inputs, max_iterations=remaining, generator=generator,
                                   evaluator=evaluator or __import__("data.pipelines.rfp_response_generation", fromlist=["evaluate_draft"]).evaluate_draft,
                                   initial_feedback=comment or "")
        with Session(db_engine) as session:
            ticket = session.get(RfpTicket, ticket_id)
            section = session.exec(select(DepartmentSection).where(
                DepartmentSection.ticket_id == ticket_id, DepartmentSection.department_id == department_id
            )).first()
            section.draft_content = result["draft_content"]
            section.evaluation_results = result["evaluation_results"]
            section.generation_iterations += result["generation_iterations"]
            section.needs_human_review = result["needs_human_review"]
            section.approval_status = "pending"
            section.approved_at = None
            section.approval_comment = comment
            if not result["needs_human_review"]:
                section.approval_iteration += 1
                from data.pipelines.rfp_approval_graph import pause_for_approval, thread_config
                config = thread_config(ticket_id, department_id, section.approval_iteration)
                checkpoint = pause_for_approval(
                    ticket_id=ticket_id, department_id=department_id,
                    approval_iteration=section.approval_iteration,
                    draft=section.draft_content, config=config,
                )
                section.checkpoint_thread_id = config["configurable"]["thread_id"]
            else:
                checkpoint = ({}, {})
            ticket.status = "waiting_for_approval" if not result["needs_human_review"] else "needs_human_review"
            _trace(session, ticket_id, "regenerate_section", "department_generator",
                   {"previous_draft": old_draft, "feedback": comment, "iteration_limit": remaining},
                   {"draft": section.draft_content, "evaluation": section.evaluation_results,
                    "iterations": result["generation_iterations"], "checkpoint": checkpoint[0]}, department_id)
            session.add(section); session.add(ticket); session.commit()
        if result["needs_human_review"]:
            return {"ticket_id": ticket_id, "status": "needs_human_review", "department_id": department_id}

    with Session(db_engine) as session:
        ticket = session.get(RfpTicket, ticket_id)
        sections = _active_sections(session, ticket_id)
        metadata = session.get(RfpMetadata, ticket_id)
        conflicts = _apply_arbitration(session, ticket_id, sections, metadata)
        rejected = any(section.approval_status == "rejected" for section in sections)
        approved = bool(sections) and all(section.approval_status == "approved" for section in sections)
        current_approval_status = next((item.approval_status for item in sections if item.department_id == department_id), None)
        if approved and not conflicts and not rejected:
            proposal = "\n\n---\n\n".join(f"## {s.department_id}\n\n{s.draft_content}" for s in sections)
            ticket.final_proposal = proposal
            ticket.final_proposal_created_at = _now()
            ticket.status = "needs_human_review"
            _trace(session, ticket_id, "publish_final_proposal", "approval_coordinator",
                   {"departments": [s.department_id for s in sections]},
                   {"human_review_required": True, "proposal_prepared": True})
        elif rejected:
            ticket.status = "needs_human_review"
        else:
            ticket.status = "waiting_for_approval"
        ticket.updated_at = _now()
        session.add(ticket)
        session.commit()
        return {"ticket_id": ticket_id, "status": ticket.status, "department_id": department_id,
                "approval_status": current_approval_status, "conflicts": conflicts,
                "final_proposal": ticket.final_proposal if ticket.status == "done" else None}
