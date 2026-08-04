"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getRecords, createRecord } from "@/services/api";
import type { RecordOut, RecordCreate, StatusValue, StageValue } from "@/types";
import { STATUS_OPTIONS, STAGE_OPTIONS } from "@/lib/constants";
import { isValidPhone, PHONE_ERROR } from "@/lib/validation";
import { StatusBadge } from "@/components/StatusBadge";
import { StageBadge } from "@/components/StageBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SuccessToast } from "@/components/SuccessToast";

/* ───────────────────────────────────────────────
   Modal de nueva candidatura
   ─────────────────────────────────────────────── */

function NewRecordModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<RecordCreate>({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    experience_years: 0,
    linkedin_url: "",
    cv_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await createRecord(form);
      console.log("✅ Candidatura creada con éxito");
      onCreated();
      onClose();
      setForm({
        full_name: "",
        email: "",
        phone: "",
        position: "",
        experience_years: 0,
        linkedin_url: "",
        cv_url: "",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear candidatura";
      console.error("❌ Error al crear candidatura:", err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-[#14263a]">Nueva candidatura</h2>

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
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
                placeholder="María García"
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
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
                placeholder="maria@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2f4a62]">Teléfono <span className="text-red-500">*</span></label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
                placeholder="+34 600 000 000"
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
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
                placeholder="Asistente de Dirección"
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
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#2f4a62]">Enlace al CV</label>
              <input
                name="cv_url"
                value={form.cv_url}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
                placeholder="https://..."
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
              {saving ? "Guardando…" : "Crear candidatura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Contenido interno del listado (usa useSearchParams)
   ─────────────────────────────────────────────── */

function CandidatesList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = (searchParams.get("status") || "") as StatusValue | "";
  const stageParam = (searchParams.get("stage") || "") as StageValue | "";
  const searchParam = searchParams.get("search") || "";

  const [records, setRecords] = useState<RecordOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchParam);
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecords({
        ...(statusParam && { status: statusParam as StatusValue }),
        ...(stageParam && { stage: stageParam as StageValue }),
        ...(searchParam && { search: searchParam }),
      });
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener candidaturas");
    } finally {
      setLoading(false);
    }
  }, [statusParam, stageParam, searchParam]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  /* Actualizar URL cuando cambia un filtro */
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      updateFilter("search", localSearch);
    }
  };

  const clearFilters = () => {
    setLocalSearch("");
    router.push("/");
  };

  const hasFilters = statusParam || stageParam || searchParam;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-6 md:pb-10">
      {/* Título y acción */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#14263a]">Candidaturas</h1>
          <p className="mt-1 text-sm text-[#2f4a62]">
            Gestiona las candidaturas del proceso de selección
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva candidatura
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[#2f4a62] mb-1">Buscar</label>
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Nombre o email…"
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-xs font-medium text-[#2f4a62] mb-1">Estado</label>
          <select
            value={statusParam}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-xs font-medium text-[#2f4a62] mb-1">Etapa</label>
          <select
            value={stageParam}
            onChange={(e) => updateFilter("stage", e.target.value)}
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
          >
            <option value="">Todas las etapas</option>
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="self-end rounded-lg border border-[#c89d66] bg-white px-3 py-2 text-sm font-medium text-[#2f4a62] hover:bg-[#e5be83]"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Estados de carga / error / vacío */}
      {loading && <LoadingSpinner text="Cargando candidaturas…" />}

      {error && <ErrorMessage message={error} onRetry={fetchRecords} />}

      {!loading && !error && records.length === 0 && (
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 text-center">
          <p className="text-sm text-[#2f4a62]">
            {hasFilters
              ? "No se encontraron candidaturas con los filtros actuales."
              : "Aún no hay candidaturas registradas."}
          </p>
        </div>
      )}

      {/* Tabla de candidaturas */}
      {!loading && !error && records.length > 0 && (
        <div className="overflow-x-auto lg:overflow-x-visible rounded-xl border border-[#c89d66] bg-[#f3ddba]">
          <table className="w-full text-sm text-[#2f4a62]">
            <thead>
              <tr className="border-b border-[#c89d66] bg-[#e5be83]/50 text-left text-xs uppercase tracking-wider text-[#14263a]">
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Nombre</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Puesto</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Estado</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap hidden md:table-cell">Etapa</th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c89d66]/50">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#e5be83]/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#14263a] max-w-[180px] truncate whitespace-nowrap">
                    {rec.full_name}
                  </td>
                  <td className="px-4 py-3 text-[#2f4a62]/80 max-w-[200px] truncate whitespace-nowrap hidden sm:table-cell">
                    {rec.email}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate whitespace-nowrap">{rec.position}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    <StageBadge stage={rec.stage} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/candidates/${rec.id}`}
                      className="inline-block rounded-lg border border-[#c89d66] bg-white px-3 py-1.5 text-xs font-medium text-[#14263a] hover:bg-[#e5be83] transition"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva candidatura */}
      <NewRecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          // Mostrar toast de éxito
          setSuccessMessage("Candidatura creada con éxito");
          // Ir a la raíz sin filtros para que el nuevo registro sea visible
          if (hasFilters) {
            setLocalSearch("");
            router.push("/");
          } else {
            fetchRecords();
          }
        }}
      />

      {/* Toast de éxito */}
      <SuccessToast
        message={successMessage ?? ""}
        visible={successMessage !== null}
        onClose={() => setSuccessMessage(null)}
      />
    </div>
  );
}

/* ───────────────────────────────────────────────
   Página principal (con Suspense boundary)
   ─────────────────────────────────────────────── */

export default function CandidatesPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Cargando candidaturas…" />}>
      <CandidatesList />
    </Suspense>
  );
}
