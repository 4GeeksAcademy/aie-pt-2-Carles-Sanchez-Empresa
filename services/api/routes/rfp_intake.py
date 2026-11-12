"""HTTP adapters de recepción RFP; la lógica de procesamiento vive en data.pipelines."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Session, select

from auth import get_current_user, require_admin
from database import get_db
from models import DepartmentSection, RfpApprovalTrace, RfpMetadata, RfpNotificationEvent, RfpTicket

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rfp-intake", tags=["RFP Intake"])

# Límite acordado: 10 MiB (10 * 1024 * 1024 bytes).
MAX_PDF_BYTES = 10 * 1024 * 1024
UPLOAD_CHUNK_BYTES = 1024 * 1024
SSE_POLL_INTERVAL_SECONDS = 1.0
SSE_KEEPALIVE_INTERVAL_SECONDS = 15.0
RAW_DATA_DIR = Path(os.getenv("TRACKFLOW_RAW_DATA_DIR", Path(__file__).resolve().parents[3] / "data" / "raw"))


class TicketSummary(BaseModel):
    ticket_id: str
    rfp_id: str
    status: str
    created_at: str
    updated_at: str
    processing_failed: bool = False
    processing_error: bool = False
    manual_review_required: bool = False
    client_name: str | None = None
    client_country: str | None = None
    departments_needed: list[str] = PydanticField(default_factory=list)


class TicketDetail(TicketSummary):
    retry_count: int
    last_error: str | None = None
    failed_at: str | None = None
    metadata: dict | None = None
    sections: list[dict]
    handoff_schema_version: str | None = None
    handoff_payload: dict | None = None
    final_proposal: str | None = None
    human_review_comment: str | None = None
    human_reviewed_by: str | None = None
    human_reviewed_at: str | None = None
    final_document_available: bool = False
    approval_trace: list[dict] = PydanticField(default_factory=list)


def _iso(value):
    return value.isoformat() if value else None


def _metadata_payload(metadata: RfpMetadata | None) -> dict | None:
    if metadata is None:
        return None
    return {
        "client_name": metadata.client_name,
        "client_country": metadata.client_country,
        "services_requested": metadata.services_requested,
        "monthly_volume": metadata.monthly_volume,
        "deadline": metadata.deadline,
        "budget_range": metadata.budget_range,
        "departments_needed": metadata.departments_needed,
        "unassigned_scope": metadata.unassigned_scope,
        "currency": metadata.currency,
        "readability_metrics": metadata.readability_metrics,
        "is_rfp": metadata.is_rfp,
        "classification_reason": metadata.classification_reason,
        "classification_evidence": metadata.classification_evidence,
        "manual_review_required": metadata.manual_review_required,
        "manual_review_reason": metadata.manual_review_reason,
        "open_questions": metadata.open_questions,
    }


def _section_payload(section: DepartmentSection) -> dict:
    return {
        "department_id": section.department_id,
        "owner": section.owner,
        "relevant_extracts": section.relevant_extracts,
        "key_aspects": section.key_aspects,
        "open_questions": section.open_questions,
        "evidence": section.evidence,
        "draft_content": section.draft_content,
        "evaluation_results": section.evaluation_results,
        "needs_human_review": section.needs_human_review,
        "generation_iterations": section.generation_iterations,
        "approval_status": section.approval_status,
        "approver_name": section.approver_name,
        "approved_at": _iso(section.approved_at),
        "approval_comment": section.approval_comment,
        "approval_iteration": section.approval_iteration,
        "checkpoint_thread_id": section.checkpoint_thread_id,
    }


def _summary(ticket: RfpTicket, metadata: RfpMetadata | None) -> TicketSummary:
    return TicketSummary(
        ticket_id=ticket.ticket_id,
        rfp_id=ticket.rfp_id,
        status=ticket.status,
        created_at=_iso(ticket.created_at),
        updated_at=_iso(ticket.updated_at),
        processing_failed=ticket.failed_at is not None,
        processing_error=bool(ticket.last_error or ticket.retry_count),
        manual_review_required=bool(metadata and metadata.manual_review_required),
        client_name=metadata.client_name if metadata else None,
        client_country=metadata.client_country if metadata else None,
        departments_needed=metadata.departments_needed if metadata else [],
    )


def _dispatch_rfp_job(ticket: RfpTicket, session: Session) -> None:
    """Encola solo IDs y ruta controlada, nunca PDF ni token del usuario."""
    # main.py ya resuelve la importación del módulo Celery para local y Docker,
    # donde services/api/services.py puede ocultar el paquete services.
    from main import celery_app

    task_id = str(uuid4())
    ticket.celery_task_id = task_id
    session.add(ticket)
    session.commit()
    celery_app.send_task("trackflow.process_rfp_ticket", args=[ticket.ticket_id], task_id=task_id)


def _sse_frame(event_id: int, payload: dict) -> str:
    """Serialize a named SSE frame (the JSON data is not wrapped in an envelope)."""
    import json

    return f"id: {event_id}\nevent: rfp_ticket_created\ndata: {json.dumps(payload, ensure_ascii=False, separators=(',', ':'))}\n\n"


def _notification_payload(ticket: RfpTicket) -> dict:
    """Build the briefing-shaped event using only values known at ticket creation."""
    return {
        "ticket_id": ticket.ticket_id,
        "rfp_id": ticket.rfp_id,
        "client_name": None,
        "client_country": None,
        "services_requested": [],
        # API/database retain the Spanish business state; the wire uses the
        # English equivalent specified by the notification contract.
        "status": "analyzing" if ticket.status == "analizando" else ticket.status,
        "created_at": _iso(ticket.created_at),
    }


@router.get("/tickets/events", include_in_schema=True)
async def stream_rfp_ticket_events(
    request: Request,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Authenticated shared event feed with durable per-client replay cursor."""
    del current_user  # Authentication is the access policy for this shared feed.
    bind = session.get_bind()

    last_event_id = request.headers.get("last-event-id")
    try:
        cursor = int(last_event_id) if last_event_id is not None else None
        if cursor is not None and cursor < 0:
            raise ValueError
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Last-Event-ID debe ser un entero no negativo.") from exc

    if cursor is None:
        # Replay from the beginning on first connection. The browser persists
        # every received id; defaulting to "now" here could lose events if the
        # initial connection drops before the client receives its first frame.
        cursor = 0

    async def event_stream():
        import asyncio
        import time

        nonlocal cursor
        last_keepalive = time.monotonic()
        while not await request.is_disconnected():
            # Keep a short-lived DB session per poll so each open dashboard does
            # not pin a pooled connection for the full lifetime of its stream.
            with Session(bind) as poll_session:
                events = poll_session.exec(
                    select(RfpNotificationEvent)
                    .where(RfpNotificationEvent.id > cursor)
                    .order_by(RfpNotificationEvent.id)
                    .limit(100)
                ).all()
            if events:
                for notification in events:
                    cursor = notification.id or cursor
                    yield _sse_frame(cursor, notification.payload)
                continue

            now = time.monotonic()
            if now - last_keepalive >= SSE_KEEPALIVE_INTERVAL_SECONDS:
                last_keepalive = now
                yield ": keep-alive\n\n"
            await asyncio.sleep(SSE_POLL_INTERVAL_SECONDS)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/tickets", response_model=TicketSummary, status_code=status.HTTP_202_ACCEPTED)
async def upload_rfp(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Guarda PDF y ticket antes de encolar; errores de cola compensan el registro."""
    filename = (file.filename or "").strip()
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Solo se aceptan documentos PDF.")
    if file.content_type not in {"application/pdf", "application/octet-stream", None}:
        raise HTTPException(status_code=415, detail="El tipo de contenido debe ser PDF.")

    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    ticket_id = str(uuid4())
    raw_path = RAW_DATA_DIR / f"rfp-{ticket_id}.pdf"
    total_bytes = 0
    try:
        with raw_path.open("xb") as destination:
            while chunk := await file.read(UPLOAD_CHUNK_BYTES):
                total_bytes += len(chunk)
                if total_bytes > MAX_PDF_BYTES:
                    raise HTTPException(status_code=413, detail="El PDF supera el límite de 10 MB.")
                destination.write(chunk)
        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="El PDF está vacío.")
        with raw_path.open("rb") as source:
            if source.read(5) != b"%PDF-":
                raise HTTPException(status_code=400, detail="El archivo no contiene una cabecera PDF válida.")

        user_id = current_user.get("id") or current_user.get("user_id") or current_user.get("sub")
        ticket = RfpTicket(ticket_id=ticket_id, raw_pdf_path=str(raw_path), created_by_user_id=str(user_id) if user_id is not None else None)
        session.add(ticket)
        session.commit()
        session.refresh(ticket)
        try:
            _dispatch_rfp_job(ticket, session)
        except Exception as exc:
            logger.exception("No se pudo encolar ticket RFP %s", ticket_id)
            session.delete(ticket)
            session.commit()
            raise HTTPException(status_code=503, detail="No se pudo programar el análisis; vuelve a intentarlo.") from exc
        try:
            # Publish only after ticket persistence and queue acceptance.
            session.add(RfpNotificationEvent(ticket_id=ticket.ticket_id, payload=_notification_payload(ticket)))
            session.commit()
        except Exception:
            # Queue acceptance is already durable at this point; never delete a
            # ticket that may be processing just because the outbox write failed.
            session.rollback()
            logger.exception("No se pudo persistir notificación SSE del ticket RFP %s", ticket_id)
        return _summary(ticket, None)
    except HTTPException:
        if raw_path.exists():
            raw_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        if raw_path.exists():
            raw_path.unlink(missing_ok=True)
        session.rollback()
        logger.exception("Falló la recepción del PDF RFP")
        raise HTTPException(status_code=500, detail="No se pudo guardar la solicitud RFP.") from exc
    finally:
        await file.close()


@router.get("/tickets", response_model=list[TicketSummary])
def list_rfp_tickets(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Lista tickets visibles a usuarios autenticados (mock-up; restringir antes de producción)."""
    tickets = session.exec(select(RfpTicket).order_by(RfpTicket.created_at.desc())).all()
    result = []
    for ticket in tickets:
        metadata = session.get(RfpMetadata, ticket.ticket_id)
        result.append(_summary(ticket, metadata))
    return result


@router.get("/tickets/{ticket_id}", response_model=TicketDetail)
def get_rfp_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Consulta estado y resultados persistidos; autenticado para mock-up compartido."""
    try:
        UUID(ticket_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.") from exc
    ticket = session.get(RfpTicket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.")
    metadata = session.get(RfpMetadata, ticket.ticket_id)
    sections = session.exec(
        select(DepartmentSection).where(DepartmentSection.ticket_id == ticket.ticket_id)
    ).all()
    if ticket.status == "en_evaluación" and sections and all(section.draft_content for section in sections):
        # Supports manually generated tickets and recovery if the Celery worker
        # persisted Parte 2 but stopped before writing its approval gate.
        from data.pipelines.rfp_approval import start_approval
        start_approval(ticket.ticket_id, db_engine=session.get_bind())
        session.refresh(ticket)
        sections = session.exec(
            select(DepartmentSection).where(DepartmentSection.ticket_id == ticket.ticket_id)
        ).all()
    traces = session.exec(select(RfpApprovalTrace).where(
        RfpApprovalTrace.ticket_id == ticket.ticket_id
    ).order_by(RfpApprovalTrace.created_at, RfpApprovalTrace.id)).all()
    summary = _summary(ticket, metadata).model_dump()
    return TicketDetail(
        **summary,
        retry_count=ticket.retry_count,
        last_error=ticket.last_error,
        failed_at=_iso(ticket.failed_at),
        metadata=_metadata_payload(metadata),
        sections=[_section_payload(section) for section in sections],
        handoff_schema_version=ticket.handoff_schema_version,
        handoff_payload=ticket.handoff_payload,
        final_proposal=ticket.final_proposal,
        human_review_comment=ticket.human_review_comment,
        human_reviewed_by=ticket.human_reviewed_by,
        human_reviewed_at=_iso(ticket.human_reviewed_at),
        final_document_available=bool(ticket.final_document_path and Path(ticket.final_document_path).is_file()),
        approval_trace=[{
            "department_id": trace.department_id, "node_name": trace.node_name,
            "agent_name": trace.agent_name, "input": trace.input_payload,
            "output": trace.output_payload, "timestamp": _iso(trace.created_at),
        } for trace in traces],
    )


class ApprovalDecision(BaseModel):
    decision: str
    approver_name: str
    comment: str | None = None
    request_id: str | None = None


class HumanReviewAction(BaseModel):
    action: str
    comment: str | None = None
    return_to_client: bool = False
    field_updates: dict[str, object] = PydanticField(default_factory=dict)


@router.post("/tickets/{ticket_id}/start-approval")
def start_rfp_approval(ticket_id: str, current_user: dict = Depends(get_current_user),
                       session: Session = Depends(get_db)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador para iniciar aprobaciones.")
    try:
        UUID(ticket_id)
        from data.pipelines.rfp_approval import start_approval
        return start_approval(ticket_id, db_engine=session.get_bind())
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/tickets/{ticket_id}/departments/{department_id}/decision", response_model=TicketDetail)
def decide_rfp_section(ticket_id: str, department_id: str, payload: ApprovalDecision,
                       current_user: dict = Depends(require_admin), session: Session = Depends(get_db)):
    try:
        UUID(ticket_id)
        from data.pipelines.rfp_approval import resume_approval
        approvers = {"warehouse": "Ana Whitfield", "lastmile": "Carlos Vega", "reverse": "Sofía Ramos"}
        if payload.approver_name != approvers.get(department_id):
            raise HTTPException(status_code=403, detail="El aprobador no corresponde al departamento.")
        resume_approval(ticket_id, department_id, payload.decision,
                        db_engine=session.get_bind(), approver_name=payload.approver_name,
                        comment=payload.comment, request_id=payload.request_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    ticket = session.get(RfpTicket, ticket_id)
    metadata = session.get(RfpMetadata, ticket_id)
    sections = session.exec(select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)).all()
    traces = session.exec(select(RfpApprovalTrace).where(RfpApprovalTrace.ticket_id == ticket_id)
                          .order_by(RfpApprovalTrace.created_at, RfpApprovalTrace.id)).all()
    return TicketDetail(
        **_summary(ticket, metadata).model_dump(), retry_count=ticket.retry_count,
        last_error=ticket.last_error, failed_at=_iso(ticket.failed_at), metadata=_metadata_payload(metadata),
        sections=[_section_payload(section) for section in sections],
        handoff_schema_version=ticket.handoff_schema_version, handoff_payload=ticket.handoff_payload,
        final_proposal=ticket.final_proposal,
        human_review_comment=ticket.human_review_comment,
        human_reviewed_by=ticket.human_reviewed_by,
        human_reviewed_at=_iso(ticket.human_reviewed_at),
        final_document_available=bool(ticket.final_document_path and Path(ticket.final_document_path).is_file()),
        approval_trace=[{"department_id": trace.department_id, "node_name": trace.node_name,
                         "agent_name": trace.agent_name, "input": trace.input_payload,
                         "output": trace.output_payload, "timestamp": _iso(trace.created_at)} for trace in traces],
    )


@router.post("/tickets/{ticket_id}/human-review", response_model=TicketDetail)
def review_rfp(ticket_id: str, payload: HumanReviewAction,
               current_user: dict = Depends(require_admin), session: Session = Depends(get_db)):
    """Final admin review: edit, return to client, approve, or archive/discard."""
    try:
        UUID(ticket_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.") from exc

    ticket = session.get(RfpTicket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.")
    if ticket.status != "needs_human_review":
        raise HTTPException(status_code=409, detail="El ticket no está pendiente de revisión humana.")

    metadata = session.get(RfpMetadata, ticket_id)
    sections = session.exec(select(DepartmentSection).where(
        DepartmentSection.ticket_id == ticket_id,
    )).all()
    metadata_fields = {"client_name", "client_country", "services_requested", "monthly_volume",
                       "deadline", "budget_range", "currency", "unassigned_scope", "open_questions"}
    section_fields = {"draft_content", "open_questions", "key_aspects"}
    actor = str(current_user.get("id") or current_user.get("user_id") or current_user.get("sub") or "admin")

    if payload.action == "edit":
        updates = payload.field_updates
        unknown_top = set(updates) - {"metadata", "sections"}
        if unknown_top:
            raise HTTPException(status_code=422, detail=f"Campos de edición no válidos: {sorted(unknown_top)}")
        metadata_updates = updates.get("metadata", {})
        section_updates = updates.get("sections", {})
        if not isinstance(metadata_updates, dict) or not isinstance(section_updates, dict):
            raise HTTPException(status_code=422, detail="metadata y sections deben ser objetos.")
        if set(metadata_updates) - metadata_fields:
            raise HTTPException(status_code=422, detail="La edición incluye campos de metadata no permitidos.")
        if metadata_updates and metadata is None:
            raise HTTPException(status_code=409, detail="No existe metadata editable para este ticket.")
        if "monthly_volume" in metadata_updates and metadata_updates["monthly_volume"] is not None:
            try:
                volume = int(metadata_updates["monthly_volume"])
            except (TypeError, ValueError) as exc:
                raise HTTPException(status_code=422, detail="monthly_volume debe ser un entero no negativo.") from exc
            if volume < 0:
                raise HTTPException(status_code=422, detail="monthly_volume debe ser un entero no negativo.")
            metadata_updates["monthly_volume"] = volume
        for field_name, value in metadata_updates.items():
            setattr(metadata, field_name, value)
        by_department = {section.department_id: section for section in sections}
        for department_id, values in section_updates.items():
            if department_id not in by_department or not isinstance(values, dict) or set(values) - section_fields:
                raise HTTPException(status_code=422, detail=f"Edición de sección inválida: {department_id}.")
            for field_name, value in values.items():
                setattr(by_department[department_id], field_name, value)
            session.add(by_department[department_id])
        if payload.return_to_client:
            ticket.status = "returned_to_client"
            ticket.human_review_comment = payload.comment or "Información adicional solicitada al cliente."
            ticket.human_reviewed_by = actor
            ticket.human_reviewed_at = datetime.now(timezone.utc)
        elif not metadata_updates and not section_updates:
            raise HTTPException(status_code=422, detail="Indica al menos un campo para editar.")
        session.add(ticket)
        if metadata:
            session.add(metadata)
        from models import RfpApprovalTrace
        session.add(RfpApprovalTrace(ticket_id=ticket_id, node_name="human_review_edit",
                                     agent_name=actor, input_payload=updates,
                                     output_payload={"status": ticket.status,
                                                     "returned_to_client": payload.return_to_client}))
    elif payload.action == "approve":
        if payload.return_to_client:
            raise HTTPException(status_code=422, detail="La aprobación no puede devolver el ticket al cliente.")
        active_sections = [section for section in sections if section.draft_content]
        if not active_sections:
            raise HTTPException(status_code=409, detail="No hay borradores para generar la propuesta final; edita o devuelve el ticket al cliente.")
        context = []
        if metadata:
            context = ["## Datos de la solicitud", f"- Cliente: {metadata.client_name or 'No especificado'}",
                       f"- País: {metadata.client_country or 'No especificado'}",
                       f"- Servicios: {', '.join(metadata.services_requested or []) or 'No especificados'}",
                       f"- Volumen mensual: {metadata.monthly_volume if metadata.monthly_volume is not None else 'Por confirmar'}",
                       f"- Fecha límite: {metadata.deadline or 'No especificada'}",
                       f"- Presupuesto: {metadata.budget_range or 'No especificado'} {metadata.currency or ''}".rstrip()]
        sections_document = "\n\n---\n\n".join(
            f"## {section.department_id}\n\n{section.draft_content}" for section in active_sections
        )
        ticket.final_proposal = "# Propuesta final RFP\n\n" + "\n".join(context) + "\n\n---\n\n" + sections_document
        final_dir = (RAW_DATA_DIR / "final").resolve()
        final_dir.mkdir(parents=True, exist_ok=True)
        document_path = final_dir / f"{ticket_id}.md"
        document_path.write_text(ticket.final_proposal, encoding="utf-8")
        ticket.final_document_path = str(document_path)
        ticket.final_proposal_created_at = datetime.now(timezone.utc)
        ticket.status = "done"
        ticket.human_review_comment = payload.comment
        ticket.human_reviewed_by = actor
        ticket.human_reviewed_at = datetime.now(timezone.utc)
        session.add(ticket)
        from models import RfpApprovalTrace
        session.add(RfpApprovalTrace(ticket_id=ticket_id, node_name="human_review_approve",
                                     agent_name=actor, input_payload={"comment": payload.comment},
                                     output_payload={"status": "done", "document": document_path.name}))
    elif payload.action == "reject":
        if payload.return_to_client:
            raise HTTPException(status_code=422, detail="El rechazo no puede devolver el ticket al cliente.")
        disposition = payload.field_updates.get("disposition", "archived")
        if disposition not in {"archived", "descartado"}:
            raise HTTPException(status_code=422, detail="disposition debe ser archived o descartado.")
        ticket.status = disposition
        ticket.human_review_comment = payload.comment
        ticket.human_reviewed_by = actor
        ticket.human_reviewed_at = datetime.now(timezone.utc)
        session.add(ticket)
        from models import RfpApprovalTrace
        session.add(RfpApprovalTrace(ticket_id=ticket_id, node_name="human_review_reject",
                                     agent_name=actor, input_payload={"comment": payload.comment},
                                     output_payload={"status": disposition}))
    else:
        raise HTTPException(status_code=422, detail="action debe ser approve, edit o reject.")

    ticket.updated_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(ticket)
    return get_rfp_ticket(ticket_id, current_user=current_user, session=session)


@router.get("/tickets/{ticket_id}/final-document")
def download_final_rfp_document(ticket_id: str, current_user: dict = Depends(get_current_user),
                               session: Session = Depends(get_db)):
    try:
        UUID(ticket_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.") from exc
    ticket = session.get(RfpTicket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.")
    if ticket.status != "done" or not ticket.final_document_path:
        raise HTTPException(status_code=409, detail="No hay documento final aprobado.")
    final_dir = (RAW_DATA_DIR / "final").resolve()
    path = Path(ticket.final_document_path).resolve()
    if path.parent != final_dir or path.name != f"{ticket_id}.md" or not path.is_file():
        raise HTTPException(status_code=404, detail="No se encontró el documento final.")
    return FileResponse(path, media_type="text/markdown; charset=utf-8", filename=f"rfp-{ticket_id}-final.md")


@router.post("/tickets/{ticket_id}/generate-response", response_model=TicketDetail)
def generate_rfp_response(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Reanuda la Parte 2 sobre el handoff almacenado; no acepta/reprocesa el PDF."""
    try:
        UUID(ticket_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.") from exc
    ticket = session.get(RfpTicket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.")
    if ticket.status not in {"analisis_completo", "generando_borrador", "en_evaluación", "needs_human_review"}:
        raise HTTPException(status_code=409, detail="El ticket aún no tiene un handoff listo para generar respuesta.")
    try:
        from data.pipelines.rfp_response_generation import generate_ticket_responses
        generate_ticket_responses(ticket_id, db_engine=session.get_bind(), force_regenerate=True)
    except (ValueError, RuntimeError) as exc:
        logger.exception("No se pudo generar respuesta RFP %s", ticket_id)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Falló la generación de respuesta RFP %s", ticket_id)
        raise HTTPException(status_code=503, detail="No se pudo generar la respuesta RFP.") from exc
    # La petición inyectada puede no apuntar al engine global en pruebas; releer con la misma sesión.
    session.refresh(ticket)
    metadata = session.get(RfpMetadata, ticket_id)
    sections = session.exec(select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)).all()
    return TicketDetail(
        **_summary(ticket, metadata).model_dump(),
        retry_count=ticket.retry_count,
        last_error=ticket.last_error,
        failed_at=_iso(ticket.failed_at),
        metadata=_metadata_payload(metadata),
        sections=[_section_payload(section) for section in sections],
        handoff_schema_version=ticket.handoff_schema_version,
        handoff_payload=ticket.handoff_payload,
    )


@router.delete("/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rfp_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Delete an RFP ticket and its generated files for operational cleanup."""
    try:
        UUID(ticket_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.") from exc

    ticket = session.get(RfpTicket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket RFP no encontrado.")
    if ticket.status == "analizando" and ticket.failed_at is None:
        if not ticket.last_error and ticket.retry_count == 0:
            raise HTTPException(
                status_code=409,
                detail="El análisis está ejecutándose; espera a que falle o termine antes de eliminarlo.",
            )
        # Revoke queued retries, but don't force-kill a currently running task.
        # Pipeline persistence checks the ticket still exists before committing.
        if ticket.celery_task_id:
            try:
                from main import celery_app

                celery_app.control.revoke(ticket.celery_task_id, terminate=False)
            except Exception as exc:
                logger.exception("No se pudo cancelar la tarea Celery del ticket RFP %s", ticket_id)
                raise HTTPException(
                    status_code=503,
                    detail="No se pudo cancelar el reintento; el ticket no se eliminó.",
                ) from exc

    raw_path = Path(ticket.raw_pdf_path).resolve()
    allowed_raw_dir = RAW_DATA_DIR.resolve()
    if raw_path.parent != allowed_raw_dir or raw_path.name != f"rfp-{ticket.ticket_id}.pdf":
        raise HTTPException(status_code=409, detail="La ruta del PDF no es segura; no se eliminó el ticket.")

    markdown_root = (allowed_raw_dir / "markdown").resolve()
    expected_markdown_path = markdown_root / f"{ticket.ticket_id}.md"
    if ticket.markdown_path:
        markdown_path = Path(ticket.markdown_path).resolve()
        if markdown_path != expected_markdown_path:
            raise HTTPException(status_code=409, detail="La ruta del Markdown no es segura; no se eliminó el ticket.")
    else:
        # The converter can create this deterministic file before its path is
        # persisted in the ticket, so clean it by ticket ID as well.
        markdown_path = expected_markdown_path
    final_path = None
    if ticket.final_document_path:
        final_root = (allowed_raw_dir / "final").resolve()
        final_path = Path(ticket.final_document_path).resolve()
        if final_path.parent != final_root or final_path.name != f"{ticket.ticket_id}.md":
            raise HTTPException(status_code=409, detail="La ruta del documento final no es segura; no se eliminó el ticket.")

    try:
        metadata = session.get(RfpMetadata, ticket_id)
        if metadata is not None:
            session.delete(metadata)
        notification = session.exec(
            select(RfpNotificationEvent).where(RfpNotificationEvent.ticket_id == ticket_id)
        ).first()
        if notification is not None:
            session.delete(notification)
        for section in session.exec(
            select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)
        ).all():
            session.delete(section)
        session.delete(ticket)
        session.commit()
    except Exception:
        session.rollback()
        raise

    for path in (markdown_path, final_path, raw_path):
        if path and path.is_file():
            try:
                path.unlink()
            except OSError:
                logger.exception("No se pudo eliminar el archivo RFP asociado a %s", ticket_id)
    return None
