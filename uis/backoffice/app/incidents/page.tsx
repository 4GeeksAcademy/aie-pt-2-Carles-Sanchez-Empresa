"use client";

import { useState } from "react";
import { useIncidentAnalyzer } from "@/hooks/useIncidentAnalyzer";
import { FileUpload } from "@/components/incidents/FileUpload";
import { SummaryCards } from "@/components/incidents/SummaryCards";
import { MetricsTables } from "@/components/incidents/MetricsTables";
import { useTranslation } from "@/lib/i18n";

export default function IncidentsPage() {
  const { t } = useTranslation();
  const { rows, error, parseCSV, getStats } = useIncidentAnalyzer();
  const [fileError, setFileError] = useState<string | null>(null);

  const handleParse = (text: string) => {
    setFileError(null);
    parseCSV(text);
  };

  const stats = getStats();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-[#14263a]">{t("incidents.title")}</h1>
        <p className="text-sm text-[#2f4a62]">{t("incidents.subtitle")}</p>
      </div>

      {(error || fileError) && (
        <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
          {error ?? fileError}
        </div>
      )}

      <FileUpload onParse={handleParse} onError={setFileError} />

      {rows.length > 0 && (
        <div className="space-y-6">
          <div className="rounded-lg bg-[#f8fbff] border border-[#c89d66] p-3">
            <p className="text-xs text-[#2f4a62]">
              {t("incidents.rows_loaded", { count: rows.length })} · {t("incidents.columns", { count: Object.keys(rows[0]).length, columns: Object.keys(rows[0]).join(", ") })}
            </p>
          </div>

          {stats && (
            <>
              <SummaryCards stats={stats} />
              <MetricsTables stats={stats} />
            </>
          )}

          <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              {t("incidents.full_data")}
            </h2>
            <div className="overflow-x-auto rounded-lg border border-[#c89d66] bg-[#f8fbff]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#14263a] text-[#f8fbff]">
                  <tr>
                    {Object.keys(rows[0]).map((header) => (
                      <th key={header} className="whitespace-nowrap px-3 py-2">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c89d66]">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f3ddba]">
                      {Object.keys(rows[0]).map((header) => (
                        <td key={header} className="whitespace-nowrap px-3 py-1.5 text-[#14263a]">{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}