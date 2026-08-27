"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getRecordById,
  patchRecord,
  updateRecord,
  deleteRecord,
  getNotes,
  createNote,
  deleteNote,
} from "@/services/api";
import type {
  RecordOut,
  RecordPatch,
  RecordUpdate,
  NoteOut,
  NoteCreate,
  StatusValue,
  StageValue,
} from "@/types";
import { STATUS_OPTIONS, STAGE_OPTIONS, STATUS_LABELS, STAGE_LABELS } from "@/lib/constants";
import { isValidPhone, PHONE_ERROR } from "@/lib/validation";
import { StatusBadge } from "@/components/StatusBadge";
import { StageBadge } from "@/components/StageBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SuccessToast } from "@/components/SuccessToast";

/* ───────────────────────────────────────────────
   Modal de edición de datos
   ─────────────────────────────────────────────── */

function EditModal({
  open,
  record,
  onClose,
  onSaved,
}: {
  open: boolean;
  record: RecordOut;
  onClose: () => void;
  onSaved: (updated: RecordOut) => void;
}) {
  const [form, setForm] = useState<RecordUpdate>({
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    position: record.position,
    linkedin_url: record.linkedin_url ?? "",
    cv_url: record.cv_url ?? "",
    experience_years: record.experience_years,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      full_name: record.full_name,
      email: record.email,
      phone: record.phone,
      position: record.position,
      linkedin_url: record.linkedin_url ?? "",
      cv_url: record.cv_url ?? "",
      experience_years: record.experience_years,
    });
  }, [record]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "experience_years" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación unificada
    const campos = [];
    if (!form.full_name.trim()) campos.push("nombre");
    if (!form.email.trim()) campos.push("email");
    if (!form.phone.trim()) campos.push("teléfono");
    if (!form.position.trim()) campos.push("puesto");

    if (campos.length > 0) {
      setError(`Los siguientes campos son obligatorios: ${campos.join(", ")}.`);
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError(PHONE_ERROR);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateRecord(record.id, form);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-[#14263a]">Editar candidatura</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#2f4a62]">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2f4a62]">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2f4a62]">Teléfono <span className="text-red-500">*</span></label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2f4a62]">
                Puesto <span className="text-red-500">*</span>
              </label>
              <input
                name="position"
                value={form.position}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2f4a62]">Años de experiencia</label>
              <input
                name="experience_years"
                type="number"
                min={0}
                value={form.experience_years}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2f4a62]">LinkedIn</label>
              <input
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#2f4a62]">Enlace al CV</label>
              <input
                name="cv_url"
                value={form.cv_url}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#c89d66] bg-white px-4 py-2 text-sm font-medium text-[#2f4a62] hover:bg-[#e5be83]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Página de detalle
   ─────────────────────────────────────────────── */

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [record, setRecord] = useState<RecordOut | null>(null);
  const [notes, setNotes] = useState<NoteOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [patching, setPatching] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  /* Auto-ocultar SuccessToast tras 4 segundos */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rec, nts] = await Promise.all([getRecordById(id), getNotes(id)]);
      setRecord(rec);
      setNotes(nts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener el candidato");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Cambio rápido de estado o etapa (PATCH) */
  const handleQuickChange = async (patch: RecordPatch) => {
    if (!record) return;
    setPatching(true);
    setInlineError(null);
    try {
      const updated = await patchRecord(record.id, patch);
      setRecord(updated);
      setSuccessMessage("Cambio aplicado correctamente");
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setPatching(false);
    }
  };

  /* Añadir nota */
  const handleAddNote = async () => {
    if (!newNote.trim() || !record) return;
    setSavingNote(true);
    setInlineError(null);
    try {
      await createNote(record.id, { content: newNote.trim() });
      setNewNote("");
      setSuccessMessage("Nota añadida correctamente");
      const nts = await getNotes(record.id);
      setNotes(nts);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Error al añadir nota");
    } finally {
      setSavingNote(false);
    }
  };

  /* Eliminar nota */
  const handleDeleteNote = async (noteId: string) => {
    if (!record) return;
    if (!confirm("¿Eliminar esta nota?")) return;
    setDeletingNote(true);
    setInlineError(null);
    try {
      await deleteNote(record.id, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Error al eliminar nota");
    } finally {
      setDeletingNote(false);
    }
  };

  /* Eliminar candidatura */
  const handleDeleteRecord = async () => {
    if (!record) return;
    if (!confirm("¿Estás seguro de eliminar esta candidatura? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    setInlineError(null);
    try {
      await deleteRecord(record.id);
      router.push("/");
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  /* ────────────────── Render ────────────────── */

  if (loading) return <LoadingSpinner text="Cargando candidato…" />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!record) return <ErrorMessage message="Candidato no encontrado" />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-24 pt-6 md:pb-10">
      {/* Barra de navegación superior */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2f4a62] hover:text-[#14263a]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al listado
        </Link>

        <div className="flex gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-lg border border-[#c89d66] bg-white px-3 py-1.5 text-sm font-medium text-[#2f4a62] hover:bg-[#e5be83]"
          >
            Editar datos
          </button>
          <button
            onClick={handleDeleteRecord}
            disabled={deleting}
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>

      {/* Tarjeta de información del candidato */}
      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#14263a]">{record.full_name}</h1>
          <p className="text-sm text-[#2f4a62]">{record.position}</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Email" value={record.email} />
          <InfoItem label="Teléfono" value={record.phone || "—"} />
          <InfoItem label="Años de experiencia" value={`${record.experience_years} años`} />
          <InfoItem
            label="LinkedIn"
            value={
              record.linkedin_url ? (
                <a
                  href={record.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1d4f7a] underline underline-offset-2 hover:text-[#14263a]"
                >
                  {record.linkedin_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoItem
            label="CV"
            value={
              record.cv_url ? (
                <a
                  href={record.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1d4f7a] underline underline-offset-2 hover:text-[#14263a]"
                >
                  Ver CV
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoItem
            label="Fecha de aplicación"
            value={new Date(record.applied_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        </div>

        {/* Cambios rápidos de estado y etapa */}
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <div>
            <label className="block text-xs font-medium text-[#2f4a62] mb-1">Estado</label>
            <div className="flex items-center gap-2">
              <StatusBadge status={record.status} />
              <select
                value={record.status}
                onChange={(e) =>
                  handleQuickChange({ status: e.target.value as StatusValue })
                }
                className="rounded-lg border border-[#c89d66] bg-[#f8fbff] px-2 py-1 text-xs text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2f4a62] mb-1">Etapa</label>
            <div className="flex items-center gap-2">
              <StageBadge stage={record.stage} />
              <select
                value={record.stage}
                onChange={(e) =>
                  handleQuickChange({ stage: e.target.value as StageValue })
                }
                className="rounded-lg border border-[#c89d66] bg-[#f8fbff] px-2 py-1 text-xs text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque de notas */}
      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#14263a]">
          Notas {notes.length > 0 && <span className="text-sm font-normal text-[#2f4a62]">({notes.length})</span>}
        </h2>

        <div className="mt-4 flex gap-2">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNote();
            }}
            placeholder="Añadir una nota..."
            className="flex-1 rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim() || savingNote}
            className="rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50"
          >
            {savingNote ? "Añadiendo…" : "Añadir"}
          </button>
        </div>

        {notes.length === 0 && (
          <p className="mt-4 text-sm text-[#2f4a62]/60">No hay notas todavía.</p>
        )}

        <ul className="mt-4 space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[#c89d66]/50 bg-[#e5be83]/30 p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2f4a62] whitespace-pre-wrap">{note.content}</p>
                <p className="mt-1 text-xs text-[#2f4a62]/50">
                  {new Date(note.created_at).toLocaleString("es-ES")}
                </p>
              </div>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="shrink-0 rounded p-1 text-[#2f4a62]/40 hover:text-red-600 transition"
                title="Eliminar nota"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.868 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.994-1.858L5 7m5 4v6m4-6v6m5-10H4" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal edición */}
      <EditModal
        open={editOpen}
        record={record}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setRecord(updated);
          setSuccessMessage("Candidatura actualizada con éxito");
        }}
      />

      {/* Toast de éxito */}
      <SuccessToast
        message={successMessage ?? ""}
        visible={successMessage !== null}
        onClose={() => setSuccessMessage(null)}
      />

      {/* Mensaje de error inline para operaciones rápidas */}
      {inlineError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border border-red-300 bg-red-50 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-red-500">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="mt-1 text-sm text-red-700">{inlineError}</p>
            </div>
            <button
              onClick={() => setInlineError(null)}
              className="shrink-0 rounded p-1 text-red-400 hover:text-red-600"
              aria-label="Cerrar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Componente auxiliar
   ─────────────────────────────────────────────── */

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#2f4a62]/70 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm text-[#2f4a62]">{value}</p>
    </div>
  );
}