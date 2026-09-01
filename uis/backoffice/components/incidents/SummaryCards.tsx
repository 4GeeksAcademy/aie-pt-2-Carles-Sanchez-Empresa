"use client";

import type { IncidentStats } from "@/hooks/useIncidentAnalyzer";

interface SummaryCardsProps {
  stats: IncidentStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        Resumen
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-center">
          <p className="text-2xl font-bold text-[#14263a]">{stats.total}</p>
          <p className="text-xs text-[#2f4a62]">Total incidencias</p>
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          <p className="text-xs text-[#2f4a62]">Resueltas</p>
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{stats.pending}</p>
          <p className="text-xs text-[#2f4a62]">Pendientes</p>
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-center">
          <p className="text-2xl font-bold text-[#14263a]">
            {stats.avgResolutionTime ? `${stats.avgResolutionTime.toFixed(1)}h` : "—"}
          </p>
          <p className="text-xs text-[#2f4a62]">Tiempo medio resolución</p>
        </div>
      </div>
    </section>
  );
}