"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_BASE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import { getToken } from "@trackflow/core/services/auth";

interface PerformanceEntry {
  warehouse: string;
  client_id: string;
  inbound_units_count: number;
  outbound_orders_count: number;
  stockout_events_count: number;
  discrepancy_events_count: number;
  discrepancy_rate: number;
}

interface PerformanceResponse {
  week_start: string | null;
  entries: PerformanceEntry[];
}

const EMPTY_RESPONSE: PerformanceResponse = { week_start: null, entries: [] };

export default function ReportingPage() {
  const { t, lang } = useTranslation();
  const [report, setReport] = useState<PerformanceResponse>(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const response = await fetch(
        `${API_BASE}/reporting/weekly-warehouse-client-performance`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      setReport(await response.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("reporting.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const totals = useMemo(() => report.entries.reduce(
    (result, entry) => ({
      inbound: result.inbound + entry.inbound_units_count,
      outbound: result.outbound + entry.outbound_orders_count,
      stockouts: result.stockouts + entry.stockout_events_count,
      discrepancies: result.discrepancies + entry.discrepancy_events_count,
    }),
    { inbound: 0, outbound: 0, stockouts: 0, discrepancies: 0 },
  ), [report.entries]);

  const discrepancyRate = totals.outbound
    ? totals.discrepancies / totals.outbound
    : 0;

  const chartData = report.entries.map((entry) => ({
    name: `${entry.warehouse} / ${entry.client_id}`,
    inbound: entry.inbound_units_count,
    outbound: entry.outbound_orders_count,
  }));

  if (loading) return <StatusMessage>{t("reporting.loading")}</StatusMessage>;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-lg border border-red-300 bg-red-100 p-4 text-red-700">
          <p className="font-semibold">{t("reporting.error")}</p>
          <p className="text-sm">{error}</p>
          <button type="button" onClick={() => void loadReport()} className="mt-2 text-sm underline">
            {t("reporting.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-[#14263a]">{t("reporting.title")}</h1>
        <p className="text-sm text-[#2f4a62]">{t("reporting.subtitle")}</p>
        <p className="mt-2 text-sm text-[#2f4a62]">
          <span className="font-semibold">{t("reporting.week")}:</span>{" "}
          {report.week_start ? formatDate(report.week_start, lang) : t("reporting.no_week")}
        </p>
      </header>

      {report.entries.length === 0 ? (
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 text-[#2f4a62]">
          {t("reporting.empty")}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label={t("reporting.kpi.inbound")} value={totals.inbound} />
            <MetricCard label={t("reporting.kpi.outbound")} value={totals.outbound} />
            <MetricCard label={t("reporting.kpi.stockouts")} value={totals.stockouts} />
            <MetricCard label={t("reporting.kpi.discrepancies")} value={totals.discrepancies} />
            <MetricCard label={t("reporting.kpi.rate")} value={formatRate(discrepancyRate)} />
          </section>

          <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-[#14263a]">{t("reporting.chart.title")}</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 55 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={75} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="inbound" name={t("reporting.kpi.inbound")} fill="#3b82f6" />
                  <Bar dataKey="outbound" name={t("reporting.kpi.outbound")} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="overflow-x-auto rounded-xl border border-[#c89d66] bg-[#f3ddba] shadow-sm">
            <table className="min-w-full text-left text-sm text-[#14263a]">
              <thead className="border-b border-[#c89d66]">
                <tr>{["warehouse", "client", "inbound", "outbound", "stockouts", "discrepancies", "rate"].map((key) => (
                  <th key={key} className="px-4 py-3 font-semibold">{t(`reporting.table.${key}`)}</th>
                ))}</tr>
              </thead>
              <tbody>
                {report.entries.map((entry) => (
                  <tr key={`${entry.warehouse}-${entry.client_id}`} className="border-b border-[#dec59e] last:border-0">
                    <td className="px-4 py-3">{entry.warehouse}</td>
                    <td className="px-4 py-3">{entry.client_id}</td>
                    <td className="px-4 py-3">{entry.inbound_units_count.toLocaleString(lang)}</td>
                    <td className="px-4 py-3">{entry.outbound_orders_count.toLocaleString(lang)}</td>
                    <td className="px-4 py-3">{entry.stockout_events_count.toLocaleString(lang)}</td>
                    <td className="px-4 py-3">{entry.discrepancy_events_count.toLocaleString(lang)}</td>
                    <td className="px-4 py-3">{formatRate(entry.discrepancy_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm"><p className="text-sm text-[#2f4a62]">{label}</p><p className="mt-2 text-2xl font-bold text-[#14263a]">{value}</p></div>;
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex h-64 max-w-7xl items-center justify-center p-6 text-lg text-[#2f4a62]">{children}</div>;
}

function formatDate(value: string, lang: string) {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-ES", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatRate(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}