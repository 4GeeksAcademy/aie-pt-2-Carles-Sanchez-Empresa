"use client";

import type { IncidentStats } from "@/hooks/useIncidentAnalyzer";
import { useTranslation } from "@/lib/i18n";

interface SummaryCardsProps {
  stats: IncidentStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        {t("incidents.summary")}
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-center">
          <p className="text-2xl font-bold text-[#14263a]">{stats.total}</p>
          <p className="text-xs text-[#2f4a62]">{t("incidents.summary.total")}</p>
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          <p className="text-xs text-[#2f4a62]">{t("incidents.summary.resolved")}</p>
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{stats.pending}</p>
          <p className="text-xs text-[#2f4a62]">{t("incidents.summary.pending")}</p>
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-center">
          <p className="text-2xl font-bold text-[#14263a]">
            {stats.avgResolutionTime ? `${stats.avgResolutionTime.toFixed(1)}h` : "—"}
          </p>
          <p className="text-xs text-[#2f4a62]">{t("incidents.summary.avg_time")}</p>
        </div>
      </div>
    </section>
  );
}