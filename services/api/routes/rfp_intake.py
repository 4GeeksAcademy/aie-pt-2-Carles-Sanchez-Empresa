"""HTTP adapters de recepción RFP; la lógica de procesamiento vive en data.pipelines."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Session, select

from auth import get_current_user
from database import get_db
from models import DepartmentSection, RfpMetadata, RfpTicket

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rfp-intake", tags=["RFP Intake"])

# Límite acordado: 10 MiB (10 * 1024 * 1024 bytes).
MAX_PDF_BYTES = 10 * 1024 * 1024
UPLOAD_CHUNK_BYTES = 1024 * 1024
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

    try:
        metadata = session.get(RfpMetadata, ticket_id)
        if metadata is not None:
            session.delete(metadata)
        for section in session.exec(
            select(DepartmentSection).where(DepartmentSection.ticket_id == ticket_id)
        ).all():
            session.delete(section)
        session.delete(ticket)
        session.commit()
    except Exception:
        session.rollback()
        raise

    for path in (markdown_path, raw_path):
        if path and path.is_file():
            try:
                path.unlink()
            except OSError:
                logger.exception("No se pudo eliminar el archivo RFP asociado a %s", ticket_id)
    return None
