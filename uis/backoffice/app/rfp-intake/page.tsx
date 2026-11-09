"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { getToken } from "@trackflow/core/services/auth";
import { useTranslation } from "@/lib/i18n";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const POLL_INTERVAL_MS = 4_000;

interface TicketSummary {
  ticket_id: string;
  rfp_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  processing_failed: boolean;
  processing_error: boolean;
  manual_review_required: boolean;
  client_name: string | null;
  client_country: string | null;
  departments_needed: string[];
}

interface TicketSection {
  department_id: string;
  owner: string;
  relevant_extracts: string[];
  key_aspects: (string | {
    finding: string;
    aspect_key: string;
    source_extract: string;
  })[];
  open_questions: string[];
  evidence: unknown[];
  draft_content?: string | null;
  needs_human_review?: boolean;
  generation_iterations?: number;
  approval_status?: string;
  approver_name?: string | null;
  approved_at?: string | null;
  approval_comment?: string | null;
  checkpoint_thread_id?: string | null;
}

interface TicketDetail extends TicketSummary {
  retry_count: number;
  last_error: string | null;
  failed_at: string | null;
  metadata: Record<string, unknown> | null;
  sections: TicketSection[];
  handoff_schema_version: string | null;
  handoff_payload: Record<string, unknown> | null;
  final_proposal: string | null;
  final_document_available: boolean;
  human_review_comment: string | null;
  human_reviewed_by: string | null;
  human_reviewed_at: string | null;
  approval_trace: { department_id: string | null; node_name: string; agent_name: string; input: unknown; output: unknown; timestamp: string }[];
}

function requestHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    // Fall back to a generic status message for non-JSON responses.
  }
  return `HTTP ${response.status}`;
}

async function fetchTickets(): Promise<TicketSummary[]> {
  const response = await fetch("/api/rfp-intake/tickets", {
    headers: requestHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<TicketSummary[]>;
}

async function fetchTicket(ticketId: string): Promise<TicketDetail> {
  const response = await fetch(`/api/rfp-intake/tickets/${encodeURIComponent(ticketId)}`, {
    headers: requestHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<TicketDetail>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.length ? value.map(String).join(", ") : "—";
  return JSON.stringify(value);
}

export default function RfpIntakePage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadList = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingList(true);
    try {
      const result = await fetchTickets();
      setTickets(result);
      setError(null);
      if (!selectedId && result.length) setSelectedId(result[0].ticket_id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("rfp.error_list"));
    } finally {
      if (showLoading) setLoadingList(false);
    }
  }, [selectedId, t]);

  const loadDetail = useCallback(async (ticketId: string, showLoading = false) => {
    if (showLoading) setLoadingDetail(true);
    try {
      const result = await fetchTicket(ticketId);
      setDetail(result);
      setError(null);
      setTickets((current) => current.map((ticket) => ticket.ticket_id === ticketId ? {
        ...ticket,
        status: result.status,
        updated_at: result.updated_at,
        processing_failed: result.processing_failed,
        processing_error: result.processing_error,
        manual_review_required: result.manual_review_required,
        client_name: result.client_name,
        client_country: result.client_country,
        departments_needed: result.departments_needed,
      } : ticket));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("rfp.error_detail"));
    } finally {
      if (showLoading) setLoadingDetail(false);
    }
  }, [t]);

  useEffect(() => {
    void loadList(true);
  }, [loadList]);

  useEffect(() => {
    setDetail(null);
    if (selectedId) void loadDetail(selectedId, true);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (!selectedId || detail?.status !== "analizando" || detail.processing_failed) return;
    const timer = window.setInterval(() => {
      void loadDetail(selectedId);
      void loadList();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [detail?.processing_failed, detail?.status, loadDetail, loadList, selectedId]);

  useEffect(() => {
    const refresh = (event: Event) => {
      const ticketId = (event as CustomEvent<string>).detail;
      if (ticketId) {
        void loadDetail(ticketId);
        void loadList();
      }
    };
    window.addEventListener("rfp-ticket-refresh", refresh);
    return () => window.removeEventListener("rfp-ticket-refresh", refresh);
  }, [loadDetail, loadList]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || uploading) return;
    if (file.size > MAX_PDF_BYTES) {
      setError(t("rfp.file_too_large"));
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError(t("rfp.pdf_only"));
      return;
    }

    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/rfp-intake/tickets", {
        method: "POST",
        headers: requestHeaders(),
        body: formData,
      });
      if (!response.ok) throw new Error(await readError(response));
      const created = await response.json() as TicketSummary;
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setNotice(t("rfp.upload_accepted", { ticketId: created.ticket_id }));
      setTickets((current) => [created, ...current.filter((ticket) => ticket.ticket_id !== created.ticket_id)]);
      setSelectedId(created.ticket_id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("rfp.error_upload"));
    } finally {
      setUploading(false);
    }
  };

  const selectFile = (selected: File | null) => {
    setFile(selected);
    setError(null);
  };

  const handleDelete = async (ticket: TicketSummary) => {
    if (deletingId) return;
    if (!window.confirm(t("rfp.delete_confirm", { ticketId: ticket.ticket_id }))) return;
    setDeletingId(ticket.ticket_id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/rfp-intake/tickets/${encodeURIComponent(ticket.ticket_id)}`, {
        method: "DELETE",
        headers: requestHeaders(),
      });
      if (!response.ok) throw new Error(await readError(response));
      const remaining = tickets.filter((item) => item.ticket_id !== ticket.ticket_id);
      setTickets(remaining);
      if (selectedId === ticket.ticket_id) {
        setSelectedId(remaining[0]?.ticket_id ?? null);
        setDetail(null);
      }
      setNotice(t("rfp.delete_success"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("rfp.error_delete"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-[#2f4a62] sm:p-6">
      <header className="border-b border-[#c89d66] pb-5">
        <h1 className="text-2xl font-bold text-[#14263a]">{t("rfp.title")}</h1>
        <p className="mt-1 text-sm">{t("rfp.subtitle")}</p>
      </header>

      <aside role="note" className="rounded-lg border-l-4 border-amber-600 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>{t("rfp.access_notice_title")}</strong> {t("rfp.access_notice")}
      </aside>

      {notice && <div role="status" className="rounded-lg border border-emerald-700 bg-emerald-50 p-4 text-sm text-emerald-950">{notice}</div>}
      {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</div>}

      <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-[#14263a]">{t("rfp.upload_title")}</h2>
        <p className="mt-1 text-sm">{t("rfp.upload_help")}</p>
        <form onSubmit={(event) => void handleUpload(event)} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <label htmlFor="rfp-pdf" className="block text-sm font-semibold text-[#14263a]">{t("rfp.file_label")}</label>
            <input
              ref={fileInputRef}
              id="rfp-pdf"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
              disabled={uploading}
              className="block min-h-11 w-full rounded-lg border border-[#c89d66] bg-white p-2 text-sm text-[#14263a] file:mr-3 file:rounded file:border-0 file:bg-[#e5be83] file:px-3 file:py-1"
            />
            {file && <p className="break-all text-xs">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MiB</p>}
          </div>
          <button type="submit" disabled={!file || uploading} className="min-h-11 rounded-lg bg-[#14263a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1d4f7a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14263a] disabled:cursor-not-allowed disabled:opacity-50">
            {uploading ? t("rfp.uploading") : t("rfp.upload_button")}
          </button>
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.7fr)]">
        <section className="overflow-hidden rounded-xl border border-[#c89d66] bg-[#f3ddba] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#c89d66] p-4">
            <h2 className="font-semibold text-[#14263a]">{t("rfp.tickets_title")}</h2>
            <button type="button" onClick={() => void loadList(true)} className="min-h-11 rounded px-3 text-sm font-semibold hover:bg-[#e5be83]">{t("rfp.refresh")}</button>
          </div>
          {loadingList ? <p role="status" className="p-4 text-sm">{t("rfp.loading")}</p> : tickets.length === 0 ? (
            <p className="p-4 text-sm">{t("rfp.empty")}</p>
          ) : (
            <ul className="divide-y divide-[#c89d66]">
              {tickets.map((ticket) => (
                <li key={ticket.ticket_id} className={`p-3 ${selectedId === ticket.ticket_id ? "bg-[#e5be83]" : ""}`}>
                  <button type="button" onClick={() => setSelectedId(ticket.ticket_id)} aria-current={selectedId === ticket.ticket_id ? "true" : undefined} className="w-full rounded p-1 text-left transition-colors hover:bg-[#e5be83]">
                    <span className="block break-all text-xs font-semibold text-[#14263a]">{ticket.ticket_id}</span>
                    <span className="mt-1 block text-sm">{ticket.client_name || t("rfp.client_unknown")}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <StatusBadge status={ticket.status} />
                      {ticket.manual_review_required && <span className="font-semibold text-amber-900">{t("rfp.manual_review")}</span>}
                    </span>
                  </button>
                  <button type="button" onClick={() => void handleDelete(ticket)} disabled={deletingId !== null || (ticket.status === "analizando" && !ticket.processing_failed && !ticket.processing_error)} title={ticket.status === "analizando" && !ticket.processing_failed && !ticket.processing_error ? t("rfp.delete_wait_for_processing") : undefined} className="mt-2 min-h-10 rounded border border-red-700 px-3 text-sm font-semibold text-red-900 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                    {deletingId === ticket.ticket_id ? t("rfp.deleting") : t("rfp.delete_button")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 space-y-4">
          {!selectedId ? (
            <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 text-sm">{t("rfp.select_ticket")}</div>
          ) : loadingDetail && !detail ? (
            <div role="status" className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 text-sm">{t("rfp.loading_detail")}</div>
          ) : detail ? (
            <TicketResult detail={detail} t={t} />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const statusClass = ["analizando", "generando_borrador", "en_evaluación"].includes(status)
    ? "bg-blue-100 text-blue-900"
    : ["analisis_completo", "done"].includes(status)
      ? "bg-emerald-100 text-emerald-900"
      : status === "needs_human_review" || status === "waiting_for_approval"
        ? "bg-amber-100 text-amber-950"
        : status === "returned_to_client" ? "bg-violet-100 text-violet-950"
          : status === "descartado" || status === "archived" ? "bg-slate-200 text-slate-900"
            : "bg-red-100 text-red-900";
  const statusKeys: Record<string, string> = {
    analizando: "rfp.status_analyzing",
    analisis_completo: "rfp.status_complete",
    descartado: "rfp.status_discarded",
    waiting_for_approval: "rfp.status_waiting_approval",
    needs_human_review: "rfp.status_needs_human_review",
    returned_to_client: "rfp.status_returned_to_client",
    archived: "rfp.status_archived",
    done: "rfp.status_done",
    generando_borrador: "rfp.status_generating_draft",
    "en_evaluación": "rfp.status_evaluating",
  };
  const label = statusKeys[status] ? t(statusKeys[status]) : status;
  return <span className={`inline-flex rounded-full px-2.5 py-1 font-semibold ${statusClass}`}>{label}</span>;
}

function TicketResult({ detail, t }: { detail: TicketDetail; t: ReturnType<typeof useTranslation>["t"] }) {
  const metadata = detail.metadata ?? {};
  const fields: [string, unknown][] = [
    ["client_name", metadata.client_name ?? detail.client_name],
    ["client_country", metadata.client_country ?? detail.client_country],
    ["services_requested", metadata.services_requested],
    ["monthly_volume", metadata.monthly_volume],
    ["deadline", metadata.deadline],
    ["budget_range", metadata.budget_range],
    ["currency", metadata.currency],
     ["unassigned_scope", metadata.unassigned_scope],
     ];
  const questions = Array.isArray(metadata.open_questions) ? metadata.open_questions : [];

  return (
    <>
      <article className="min-w-0 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#14263a]">{t("rfp.detail_title")}</h2>
            <p className="mt-1 break-all font-mono text-xs">{detail.ticket_id}</p>
          </div>
          <StatusBadge status={detail.status} />
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-[#14263a]">{t("rfp.created_at")}</dt><dd>{formatDate(detail.created_at)}</dd></div>
          <div><dt className="font-semibold text-[#14263a]">{t("rfp.updated_at")}</dt><dd>{formatDate(detail.updated_at)}</dd></div>
          {fields.map(([key, value]) => <div key={key}><dt className="font-semibold text-[#14263a]">{t(`rfp.field.${key}`)}</dt><dd className="break-words">{displayValue(value)}</dd></div>)}
          <div><dt className="font-semibold text-[#14263a]">{t("rfp.departments")}</dt><dd className="break-words">{displayValue(detail.departments_needed)}</dd></div>
        </dl>
        {detail.manual_review_required && (
          <div className="mt-5 rounded-lg border border-amber-700 bg-amber-50 p-4 text-sm text-amber-950">
            <h3 className="font-semibold">{t("rfp.manual_review_title")}</h3>
            <p className="mt-1">{displayValue(metadata.manual_review_reason) === "—" ? t("rfp.manual_review_explanation") : displayValue(metadata.manual_review_reason)}</p>
          </div>
        )}
        {detail.status === "analizando" && <p role="status" className="mt-4 text-sm">{t("rfp.processing_notice")}</p>}
        {detail.status === "descartado" && <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">{t("rfp.discarded_notice")}</p>}
        {detail.last_error && (
          <div role="alert" className="mt-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            <h3 className="font-semibold">{t("rfp.operational_error")}</h3>
            <p className="mt-1 break-words">{detail.last_error}</p>
            <p className="mt-1 text-xs">{t("rfp.retry_count", { count: detail.retry_count })}{detail.failed_at ? ` · ${formatDate(detail.failed_at)}` : ""}</p>
          </div>
        )}
      </article>

      {detail.sections.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#14263a]">{t("rfp.workstreams_title")}</h2>
          {detail.sections.map((section) => (
            <article key={section.department_id} className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
              <h3 className="font-semibold text-[#14263a]">{section.department_id}</h3>
              <p className="mt-1 text-sm">{t("rfp.owner")}: {section.owner}</p>
              {section.draft_content && <div className="mt-3 rounded-lg bg-white/70 p-4"><h4 className="font-semibold text-[#14263a]">{t("rfp.draft_title")}</h4><pre className="mt-2 whitespace-pre-wrap break-words text-sm font-sans">{section.draft_content}</pre></div>}
              {section.approval_status && <div className="mt-3 text-sm"><strong>{t("rfp.approval_label")}:</strong> {approvalStatusLabel(section.approval_status, t)}{section.approver_name ? ` · ${section.approver_name}` : ""}{section.approval_comment ? ` · ${section.approval_comment}` : ""}</div>}
              {detail.status === "waiting_for_approval" && section.checkpoint_thread_id && section.approval_status !== "approved" && section.approval_status !== "rejected" && <ApprovalControls ticketId={detail.ticket_id} section={section} onUpdated={() => window.dispatchEvent(new CustomEvent("rfp-ticket-refresh", { detail: detail.ticket_id }))} />}
              <SectionList label={t("rfp.key_aspects")} items={section.key_aspects} />
              <SectionList label={t("rfp.relevant_extracts")} items={section.relevant_extracts} />
              <SectionList label={t("rfp.open_questions")} items={section.open_questions} />
            </article>
          ))}
        </section>
      )}

      {questions.length > 0 && (
        <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
          <h2 className="font-semibold text-[#14263a]">{t("rfp.open_questions")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{questions.map((question, index) => <li key={index}>{String(question)}</li>)}</ul>
        </section>
      )}

      {detail.handoff_payload && (
        <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
          <h2 className="font-semibold text-[#14263a]">{t("rfp.handoff_title")}</h2>
          {detail.handoff_schema_version && <p className="mt-1 text-xs">{t("rfp.schema_version")}: {detail.handoff_schema_version}</p>}
          <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-[#14263a] p-4 text-xs text-white">{JSON.stringify(detail.handoff_payload, null, 2)}</pre>
        </section>
      )}
      {detail.final_proposal && <section className="rounded-xl border border-emerald-700 bg-emerald-50 p-4 shadow-sm"><h2 className="font-semibold text-emerald-950">{t("rfp.final_proposal")}</h2><pre className="mt-3 whitespace-pre-wrap break-words text-sm font-sans">{detail.final_proposal}</pre></section>}
      {detail.final_document_available && <a className="inline-flex min-h-10 items-center rounded bg-emerald-800 px-4 font-semibold text-white" href={`/api/rfp-intake/tickets/${encodeURIComponent(detail.ticket_id)}/final-document`} target="_blank" rel="noreferrer">{t("rfp.final_document_link")}</a>}
      {detail.status === "needs_human_review" && <HumanReviewControls key={`${detail.ticket_id}:${detail.updated_at}`} detail={detail} onUpdated={() => window.dispatchEvent(new CustomEvent("rfp-ticket-refresh", { detail: detail.ticket_id }))} />}
    </>
  );
}

function approvalStatusLabel(status: string, t: ReturnType<typeof useTranslation>["t"]): string {
  const keys: Record<string, string> = {
    pending: "rfp.status_approval_pending",
    approved: "rfp.status_approval_approved",
    rejected: "rfp.status_approval_rejected",
    changes_requested: "rfp.status_approval_changes_requested",
  };
  return keys[status] ? t(keys[status]) : status;
}

function HumanReviewControls({ detail, onUpdated }: { detail: TicketDetail; onUpdated: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState(detail.human_review_comment ?? "");
  const [monthlyVolume, setMonthlyVolume] = useState(String(detail.metadata?.monthly_volume ?? ""));
  const [currency, setCurrency] = useState(String(detail.metadata?.currency ?? ""));
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(
    detail.sections.map((section) => [section.department_id, section.draft_content ?? ""]),
  ));

  const submit = async (action: "edit" | "approve" | "reject", options: { returnToClient?: boolean; disposition?: "archived" | "descartado" } = {}) => {
    setBusy(true); setError(null);
    const field_updates = action === "edit" ? {
      metadata: {
        ...(monthlyVolume.trim() ? { monthly_volume: Number(monthlyVolume) } : {}),
        ...(currency.trim() ? { currency: currency.trim() } : {}),
      },
      sections: Object.fromEntries(Object.entries(drafts).map(([department_id, draft_content]) => [department_id, { draft_content }])),
    } : options.disposition ? { disposition: options.disposition } : {};
    try {
      const response = await fetch(`/api/rfp-intake/tickets/${encodeURIComponent(detail.ticket_id)}/human-review`, {
        method: "POST", headers: { ...requestHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: comment || null, return_to_client: options.returnToClient ?? false, field_updates }),
      });
      if (!response.ok) throw new Error(await readError(response));
      onUpdated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("rfp.human_review_error"));
    } finally { setBusy(false); }
  };

  return <section className="space-y-4 rounded-xl border-2 border-amber-700 bg-amber-50 p-4 shadow-sm">
    <h2 className="text-lg font-bold text-amber-950">{t("rfp.human_review_title")}</h2>
    <p className="text-sm text-amber-950">{t("rfp.human_review_description")}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">{t("rfp.human_review_monthly_volume")}<input type="number" min="0" className="mt-1 block w-full rounded border p-2" value={monthlyVolume} onChange={(event) => setMonthlyVolume(event.target.value)} /></label>
      <label className="text-sm font-semibold">{t("rfp.human_review_currency")}<input className="mt-1 block w-full rounded border p-2" value={currency} onChange={(event) => setCurrency(event.target.value)} /></label>
    </div>
    {detail.sections.map((section) => <label key={section.department_id} className="block text-sm font-semibold">{t("rfp.human_review_draft", { department: section.department_id })}<textarea className="mt-1 block min-h-32 w-full rounded border p-2 font-normal" value={drafts[section.department_id] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [section.department_id]: event.target.value }))} /></label>)}
    <label className="block text-sm font-semibold">{t("rfp.human_review_comment")}<textarea className="mt-1 block w-full rounded border p-2 font-normal" rows={2} value={comment} onChange={(event) => setComment(event.target.value)} /></label>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => void submit("edit")} className="min-h-10 rounded border border-blue-800 px-3 font-semibold text-blue-950 transition-colors hover:bg-blue-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{t("rfp.human_review_save")}</button>
      <button type="button" disabled={busy} onClick={() => void submit("edit", { returnToClient: true })} className="min-h-10 rounded bg-amber-700 px-3 font-semibold text-white transition-colors hover:bg-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800 disabled:cursor-not-allowed disabled:opacity-50">{t("rfp.human_review_return")}</button>
      <button type="button" disabled={busy} onClick={() => void submit("approve")} className="min-h-10 rounded bg-emerald-800 px-3 font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">{t("rfp.human_review_approve")}</button>
      <button type="button" disabled={busy} onClick={() => void submit("reject", { disposition: "descartado" })} className="min-h-10 rounded bg-red-800 px-3 font-semibold text-white transition-colors hover:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900 disabled:cursor-not-allowed disabled:opacity-50">{t("rfp.human_review_discard")}</button>
      <button type="button" disabled={busy} onClick={() => void submit("reject", { disposition: "archived" })} className="min-h-10 rounded border border-slate-700 px-3 font-semibold text-slate-900 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{t("rfp.human_review_archive")}</button>
    </div>
  </section>;
}

function ApprovalControls({ ticketId, section, onUpdated }: { ticketId: string; section: TicketSection; onUpdated: () => void }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (decision: "approve" | "reject" | "request_changes") => {
    setBusy(true); setError(null);
    try {
      const approvers: Record<string, string> = { warehouse: "Ana Whitfield", lastmile: "Carlos Vega", reverse: "Sofía Ramos" };
      const response = await fetch(`/api/rfp-intake/tickets/${encodeURIComponent(ticketId)}/departments/${encodeURIComponent(section.department_id)}/decision`, {
        method: "POST", headers: { ...requestHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ decision, approver_name: approvers[section.department_id], comment: comment || null,
          request_id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }),
      });
      if (!response.ok) throw new Error(await readError(response));
      onUpdated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo registrar la decisión.");
    } finally { setBusy(false); }
  };
  return <div className="mt-4 space-y-2 rounded-lg border border-blue-300 bg-blue-50 p-3">
    <label className="block text-sm font-semibold text-[#14263a]">Decisión humana · {section.department_id}</label>
    <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} className="w-full rounded border border-slate-300 bg-white p-2 text-sm" placeholder="Comentario o cambios solicitados" />
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => void submit("approve")} className="min-h-10 rounded bg-emerald-800 px-3 text-sm font-semibold text-white disabled:opacity-50">Aprobar</button>
      <button type="button" disabled={busy} onClick={() => void submit("request_changes")} className="min-h-10 rounded bg-amber-700 px-3 text-sm font-semibold text-white disabled:opacity-50">Solicitar cambios</button>
      <button type="button" disabled={busy} onClick={() => void submit("reject")} className="min-h-10 rounded bg-red-800 px-3 text-sm font-semibold text-white disabled:opacity-50">Rechazar</button>
    </div>
  </div>;
}

function SectionList({ label, items }: { label: string; items: unknown[] }) {
  if (!items?.length) return null;
  return <div className="mt-3 text-sm"><h4 className="font-semibold text-[#14263a]">{label}</h4><ul className="mt-1 list-disc space-y-1 pl-5">{items.map((item, index) => <li key={index}>{renderSectionItem(item)}</li>)}</ul></div>;
}

function renderSectionItem(item: unknown) {
  if (typeof item === "string") return item;
  if (item === null || typeof item !== "object") return String(item ?? "");

  const aspect = item as Record<string, unknown>;
  if (typeof aspect.finding === "string") {
    return <>
      <span className="font-semibold">{typeof aspect.aspect_key === "string" ? `${aspect.aspect_key}: ` : ""}</span>
      {aspect.finding}
      {typeof aspect.source_extract === "string" && (
        <blockquote className="mt-1 border-l-2 border-[#c89d66] pl-2 text-xs italic text-[#52697d]">
          {aspect.source_extract}
        </blockquote>
      )}
    </>;
  }
  return JSON.stringify(item);
}
