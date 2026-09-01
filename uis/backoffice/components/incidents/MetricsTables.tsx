"use client";

import type { IncidentStats } from "@/hooks/useIncidentAnalyzer";

interface MetricsTablesProps {
  stats: IncidentStats;
}

export function MetricsTables({ stats }: MetricsTablesProps) {
  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        Métricas detalladas
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <h3 className="mb-2 text-sm font-semibold text-[#14263a]">Por tipo</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c89d66] text-left text-xs text-[#2f4a62]">
                <th className="pb-1">Tipo</th>
                <th className="pb-1 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <tr key={type} className="border-b border-[#c89d66]/50">
                  <td className="py-1 text-[#14263a] capitalize">{type}</td>
                  <td className="py-1 text-right font-medium text-[#14263a]">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <h3 className="mb-2 text-sm font-semibold text-[#14263a]">Por prioridad</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c89d66] text-left text-xs text-[#2f4a62]">
                <th className="pb-1">Prioridad</th>
                <th className="pb-1 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.byPriority).sort((a, b) => b[1] - a[1]).map(([priority, count]) => (
                <tr key={priority} className="border-b border-[#c89d66]/50">
                  <td className="py-1 text-[#14263a] capitalize">{priority}</td>
                  <td className="py-1 text-right font-medium text-[#14263a]">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}