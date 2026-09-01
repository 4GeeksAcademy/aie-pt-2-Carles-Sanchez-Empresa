"use client";

import type { IncidentStats } from "@/hooks/useIncidentAnalyzer";
import { useTranslation } from "@/lib/i18n";

interface MetricsTablesProps {
  stats: IncidentStats;
}

export function MetricsTables({ stats }: MetricsTablesProps) {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        {t("incidents.metrics.title")}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <h3 className="mb-2 text-sm font-semibold text-[#14263a]">{t("incidents.metrics.by_type")}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c89d66] text-left text-xs text-[#2f4a62]">
                <th className="pb-1">{t("incidents.metrics.type")}</th>
                <th className="pb-1 text-right">{t("incidents.metrics.count")}</th>
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
          <h3 className="mb-2 text-sm font-semibold text-[#14263a]">{t("incidents.metrics.by_priority")}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c89d66] text-left text-xs text-[#2f4a62]">
                <th className="pb-1">{t("incidents.metrics.priority")}</th>
                <th className="pb-1 text-right">{t("incidents.metrics.count")}</th>
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