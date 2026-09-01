"use client";

import { useState, type FormEvent } from "react";
import { BRANCH_LABELS, CATEGORY_LABELS, ORIGIN_LABELS } from "@/lib/incidents";
import type { IncidentCreateInput } from "@/services/api";

interface IncidentFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (input: IncidentCreateInput) => Promise<boolean>;
}

const initialForm: IncidentCreateInput = {
  title: "",
  description: "",
  category: "lost_parcel",
  origin: "customer",
  branch: "central",
};

export function IncidentForm({ loading, error, onSubmit }: IncidentFormProps) {
  const [form, setForm] = useState<IncidentCreateInput>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"title" | "description", string>>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(false);

    const nextErrors: Partial<Record<"title" | "description", string>> = {};
    const input = { ...form, title: form.title.trim(), description: form.description.trim() };
    if (!input.title) nextErrors.title = "El título es obligatorio.";
    if (input.description.length < 5) nextErrors.description = "La descripción debe tener al menos 5 caracteres.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (await onSubmit(input)) {
      setForm(initialForm);
      setSuccess(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-[#14263a] md:col-span-2">
          Título
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a] outline-none focus:border-[#1d4f7a] focus:ring-2 focus:ring-[#1d4f7a]/20"
            maxLength={120}
            disabled={loading}
          />
          {fieldErrors.title && <span className="mt-1 block text-xs text-red-700">{fieldErrors.title}</span>}
        </label>

        <label className="text-sm font-medium text-[#14263a] md:col-span-2">
          Descripción
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a] outline-none focus:border-[#1d4f7a] focus:ring-2 focus:ring-[#1d4f7a]/20 min-h-28 resize-y"
            disabled={loading}
          />
          {fieldErrors.description && <span className="mt-1 block text-xs text-red-700">{fieldErrors.description}</span>}
        </label>

        <label className="text-sm font-medium text-[#14263a]">
          Categoría
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as IncidentCreateInput["category"] })} className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a] outline-none focus:border-[#1d4f7a] focus:ring-2 focus:ring-[#1d4f7a]/20" disabled={loading}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className="text-sm font-medium text-[#14263a]">
          Origen
          <select value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value as IncidentCreateInput["origin"] })} className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a] outline-none focus:border-[#1d4f7a] focus:ring-2 focus:ring-[#1d4f7a]/20" disabled={loading}>
            {Object.entries(ORIGIN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <label className={`text-sm font-medium text-[#14263a] md:col-span-2 ${form.origin === "branch" ? "rounded-md bg-amber-100 p-3" : ""}`}>
          Sede responsable
          <select value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value as IncidentCreateInput["branch"] })} className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a] outline-none focus:border-[#1d4f7a] focus:ring-2 focus:ring-[#1d4f7a]/20" disabled={loading}>
            {Object.entries(BRANCH_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800">{error}</p>}
      {success && <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">Incidencia registrada correctamente.</p>}

      <button type="submit" disabled={loading} className="min-h-10 rounded-lg bg-[#14263a] px-5 py-2 text-sm font-semibold text-[#f8fbff] hover:bg-[#1d4f7a] disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? "Registrando..." : "Registrar incidencia"}
      </button>
    </form>
  );
}