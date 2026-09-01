"use client";

import { useState } from "react";
import {
  BRANCH_LABELS,
  CATEGORY_LABELS,
  ORIGIN_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  STATUS_TRANSITIONS,
} from "@/lib/incidents";
import type { Incident, IncidentFilters, IncidentStatus } from "@/services/api";

interface IncidentListProps {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  updatingId: number | null;
  onLoad: (filters?: IncidentFilters) => Promise<void>;
  onStatusChange: (id: number, status: IncidentStatus) => Promise<boolean>;
}

export function IncidentList({ incidents, loading, error, updatingId, onLoad, onStatusChange }: IncidentListProps) {
  const [filters, setFilters] = useState<IncidentFilters>({});

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs font-medium text-[#2f4a62]">
            Estado
            <select value={filters.status ?? ""} onChange={(event) => setFilters({ ...filters, status: (event.target.value || undefined) as IncidentStatus | undefined })} className="min-h-10 rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]">
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-[#2f4a62]">
            Origen
            <select value={filters.origin ?? ""} onChange={(event) => setFilters({ ...filters, origin: (event.target.value || undefined) as IncidentFilters["origin"] })} className="min-h-10 rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]">
              <option value="">Todos</option>
              {Object.entries(ORIGIN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-[#2f4a62]">
            Sede
            <select value={filters.branch ?? ""} onChange={(event) => setFilters({ ...filters, branch: (event.target.value || undefined) as IncidentFilters["branch"] })} className="min-h-10 rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]">
              <option value="">Todas</option>
              {Object.entries(BRANCH_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void onLoad(filters)} disabled={loading} className="min-h-10 rounded-lg bg-[#14263a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4f7a] disabled:opacity-60">
            Aplicar filtros
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800">{error}</p>}
      {loading && <p className="py-10 text-center text-sm text-[#2f4a62]">Cargando incidencias...</p>}
      {!loading && incidents.length === 0 && !error && <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 text-center shadow-sm"><p className="text-[#2f4a62]">No hay incidencias para los filtros seleccionados.</p></div>}

      {!loading && incidents.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#c89d66] shadow-sm">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#14263a] text-[#f8fbff]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Incidencia</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Sede</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c89d66] bg-[#f3ddba]">
              {incidents.map((incident) => (
                <tr key={incident.id} className="align-top transition hover:bg-[#f8fbff]">
                  <td className="px-4 py-3 font-mono text-xs text-[#2f4a62]">#{incident.id}</td>
                  <td className="max-w-72 px-4 py-3">
                    <p className="font-semibold text-[#14263a]">{incident.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[#2f4a62]">{incident.description}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{CATEGORY_LABELS[incident.category]}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${STATUS_STYLES[incident.status]}`}>{STATUS_LABELS[incident.status]}</span></td>
                  <td className="px-4 py-3 text-xs">{ORIGIN_LABELS[incident.origin]}</td>
                  <td className="px-4 py-3 text-xs">{BRANCH_LABELS[incident.branch]}</td>
                  <td className="px-4 py-3">
                    {STATUS_TRANSITIONS[incident.status].length === 0 ? (
                      <span className="text-xs text-gray-500">Estado final</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {STATUS_TRANSITIONS[incident.status].map((status) => (
                          <button key={status} type="button" onClick={() => void onStatusChange(incident.id, status)} disabled={updatingId === incident.id} className="rounded border border-[#1d4f7a] px-2 py-1 text-xs font-medium text-[#1d4f7a] hover:bg-[#1d4f7a] hover:text-white disabled:opacity-50">
                            {updatingId === incident.id ? "Actualizando..." : STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}