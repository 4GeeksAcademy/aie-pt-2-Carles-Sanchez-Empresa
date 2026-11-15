"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchIncidents,
  fetchOrders,
  fetchSuppliers,
  type Incident,
  type Movement,
  type Supplier,
} from "@/services/api";
import { API_BASE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import { getToken } from "@trackflow/core/services/auth";

const MAX_ITEMS = 5;
const cardStyle = "flex min-h-[25rem] flex-col rounded-xl border border-[#c89d66] bg-[#f3ddba] shadow-sm";
const innerLinkStyle = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#14263a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1d4f7a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4f7a]";

type MovementTab = "inbound" | "outbound";

interface ForecastPoint {
  month: string;
  actual_eur: number;
  predicted_eur: number;
}

interface ForecastReport {
  points: ForecastPoint[];
}

interface WeeklyEntry {
  warehouse: string;
  client_id: string;
  inbound_units_count: number;
  outbound_orders_count: number;
  discrepancy_rate: number;
}

interface WeeklyReport {
  week_start: string | null;
  entries: WeeklyEntry[];
}

export function BackofficePreviews() {
  const { t, lang } = useTranslation();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [movementTab, setMovementTab] = useState<MovementTab>("inbound");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [forecast, setForecast] = useState<ForecastReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const results = await Promise.allSettled([fetchOrders(), fetchSuppliers(), fetchIncidents()]);
      if (cancelled) return;
      const nextErrors: Record<string, boolean> = {};
      if (results[0].status === "fulfilled") setMovements(results[0].value);
      else nextErrors.inventory = true;
      if (results[1].status === "fulfilled") setSuppliers(results[1].value);
      else nextErrors.suppliers = true;
      if (results[2].status === "fulfilled") setIncidents(results[2].value);
      else nextErrors.incidents = true;
      setErrors(nextErrors);
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const results = await Promise.allSettled([
        fetch(`${API_BASE}/reporting/sales-forecast`, { headers }),
        fetch(`${API_BASE}/reporting/weekly-warehouse-client-performance`, { headers }),
      ]);
      if (cancelled) return;
      let failed = false;
      if (results[0].status === "fulfilled" && results[0].value.ok) {
        setForecast(await results[0].value.json() as ForecastReport);
      } else failed = true;
      if (results[1].status === "fulfilled" && results[1].value.ok) {
        setWeekly(await results[1].value.json() as WeeklyReport);
      } else failed = true;
      setReportsError(failed);
      setReportsLoading(false);
    };
    void loadReports();
    return () => { cancelled = true; };
  }, []);

  const recentSuppliers = useMemo(() => [...suppliers].sort((a, b) => Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? "")), [suppliers]);
  const recentIncidents = useMemo(() => [...incidents].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)), [incidents]);
  const visibleMovements = useMemo(() => movements.filter((item) => item.type === movementTab).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)), [movements, movementTab]);

  return (
    <>
      <section aria-labelledby="operations-previews-title">
        <div className="mb-4">
          <h2 id="operations-previews-title" className="text-xl font-bold text-[#14263a]">{t("dashboard.previews.operations")}</h2>
          <p className="mt-1 text-sm text-[#2f4a62]">{t("dashboard.previews.operations_subtitle")}</p>
        </div>
        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <PreviewCard title={t("dashboard.preview.inventory")} itemsCount={visibleMovements.length} href="/inventory" more={t("dashboard.preview.see_more")} notificationLabel={t("dashboard.preview.additional")}>
            <div className="flex gap-2 border-b border-[#c89d66] px-4 pt-3" role="tablist" aria-label={t("dashboard.preview.inventory_tabs")}>
              {(["inbound", "outbound"] as const).map((tab) => (
                <button key={tab} type="button" role="tab" aria-selected={movementTab === tab} onClick={() => setMovementTab(tab)} className={`min-h-10 rounded-t-lg px-3 text-sm font-semibold ${movementTab === tab ? "bg-white text-[#14263a]" : "text-[#2f4a62] hover:bg-white/60"}`}>
                  {t(`dashboard.preview.${tab}`)}
                </button>
              ))}
            </div>
            <div className="flex-1 p-4">
              {loading ? <PreviewMessage>{t("dashboard.preview.loading")}</PreviewMessage> : errors.inventory ? <PreviewMessage>{t("dashboard.preview.load_error")}</PreviewMessage> : visibleMovements.length === 0 ? <PreviewMessage>{t("dashboard.preview.empty_movements")}</PreviewMessage> : (
                <ul className="space-y-2">
                  {visibleMovements.slice(0, MAX_ITEMS).map((item) => <li key={`${item.type}-${item.id}`} className="rounded-lg border border-[#dec59e] bg-white p-3">
                    <div className="flex items-start justify-between gap-2"><p className="font-semibold text-[#14263a]">{item.sku_name}</p><span className="shrink-0 rounded-full bg-[#edf5fb] px-2 py-1 text-xs font-semibold text-[#1d4f7a]">{item.type === "inbound" ? "+" : "−"}{item.quantity}</span></div>
                    <p className="mt-1 text-xs text-[#2f4a62]">{item.sku_code} · {item.warehouse}</p>
                    <p className="mt-1 text-xs text-[#2f4a62]">{new Date(item.created_at).toLocaleString(lang === "en" ? "en-US" : "es-ES")}</p>
                  </li>)}
                </ul>
              )}
            </div>
          </PreviewCard>

          <PreviewCard title={t("dashboard.preview.supply")} itemsCount={recentSuppliers.length} href="/suppliers" more={t("dashboard.preview.see_more")} notificationLabel={t("dashboard.preview.additional")}>
            <div className="flex-1 p-4">
              {loading ? <PreviewMessage>{t("dashboard.preview.loading")}</PreviewMessage> : errors.suppliers ? <PreviewMessage>{t("dashboard.preview.load_error")}</PreviewMessage> : recentSuppliers.length === 0 ? <PreviewMessage>{t("dashboard.preview.empty_suppliers")}</PreviewMessage> : (
                <ul className="space-y-2">
                  {recentSuppliers.slice(0, MAX_ITEMS).map((supplier) => <li key={supplier.id} className="rounded-lg border border-[#dec59e] bg-white p-3">
                    <div className="flex items-start justify-between gap-2"><p className="font-semibold text-[#14263a]">{supplier.name}</p><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${supplier.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{t(`dashboard.preview.supplier_${supplier.status}`)}</span></div>
                    <p className="mt-1 text-xs text-[#2f4a62]">{supplier.country} · {supplier.categories.join(", ")}</p>
                    <p className="mt-1 text-xs text-[#2f4a62]">{t("dashboard.preview.modified")}: {supplier.updated_at ? new Date(supplier.updated_at).toLocaleString(lang === "en" ? "en-US" : "es-ES") : "—"}</p>
                  </li>)}
                </ul>
              )}
            </div>
          </PreviewCard>

          <PreviewCard title={t("dashboard.preview.incidents")} itemsCount={recentIncidents.length} href="/incidents-manager?tab=list" more={t("dashboard.preview.see_more")} notificationLabel={t("dashboard.preview.additional")}>
            <div className="flex-1 p-4">
              {loading ? <PreviewMessage>{t("dashboard.preview.loading")}</PreviewMessage> : errors.incidents ? <PreviewMessage>{t("dashboard.preview.load_error")}</PreviewMessage> : recentIncidents.length === 0 ? <PreviewMessage>{t("dashboard.preview.empty_incidents")}</PreviewMessage> : (
                <ul className="space-y-2">
                  {recentIncidents.slice(0, MAX_ITEMS).map((incident) => <li key={incident.id} className="rounded-lg border border-[#dec59e] bg-white p-3">
                    <div className="flex items-start justify-between gap-2"><p className="line-clamp-2 font-semibold text-[#14263a]">{incident.title}</p><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${incident.status === "resolved" ? "bg-emerald-100 text-emerald-800" : incident.status === "discarded" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-900"}`}>{t(`incident.status.${incident.status}`)}</span></div>
                    <p className="mt-1 text-xs text-[#2f4a62]">#{incident.id} · {t(`incident.branch.${incident.branch}`)}</p>
                    <p className="mt-1 text-xs text-[#2f4a62]">{t("dashboard.preview.modified")}: {new Date(incident.updated_at).toLocaleString(lang === "en" ? "en-US" : "es-ES")}</p>
                  </li>)}
                </ul>
              )}
            </div>
          </PreviewCard>
        </div>
      </section>

      <section aria-labelledby="business-previews-title" className="space-y-4">
        <div>
          <h2 id="business-previews-title" className="text-xl font-bold text-[#14263a]">{t("dashboard.previews.business")}</h2>
          <p className="mt-1 text-sm text-[#2f4a62]">{t("dashboard.previews.business_subtitle")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-[#14263a]">{t("dashboard.preview.forecast")}</h3><p className="text-sm text-[#2f4a62]">{t("dashboard.preview.forecast_subtitle")}</p></div><Link href="/sales-forecast" className={innerLinkStyle}>{t("dashboard.preview.see_more")}</Link></div>
            <div className="mt-4 min-h-48">
              {reportsLoading ? <PreviewMessage>{t("dashboard.preview.loading")}</PreviewMessage> : forecast?.points.length ? <div className="grid gap-2 sm:grid-cols-2">
                {forecast.points.slice(-4).reverse().map((point) => <div key={point.month} className="rounded-lg border border-[#dec59e] bg-white p-3"><p className="text-xs font-medium text-[#2f4a62]">{formatMonth(point.month, lang)}</p><p className="mt-1 text-sm">{t("dashboard.preview.actual")}: <strong>{formatMoney(point.actual_eur, lang)}</strong></p><p className="text-sm">{t("dashboard.preview.predicted")}: <strong>{formatMoney(point.predicted_eur, lang)}</strong></p></div>)}
              </div> : <PreviewMessage>{reportsError ? t("dashboard.preview.report_error") : t("dashboard.preview.empty_report")}</PreviewMessage>}
            </div>
          </article>

          <article className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-[#14263a]">{t("dashboard.preview.weekly")}</h3><p className="text-sm text-[#2f4a62]">{t("dashboard.preview.weekly_subtitle")}</p></div><Link href="/reporting" className={innerLinkStyle}>{t("dashboard.preview.see_more")}</Link></div>
            {weekly?.week_start && <p className="mt-3 text-xs text-[#2f4a62]">{t("dashboard.preview.week_of")}: {new Date(`${weekly.week_start}T00:00:00Z`).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { dateStyle: "medium", timeZone: "UTC" })}</p>}
            <div className="mt-3 min-h-48">
              {reportsLoading ? <PreviewMessage>{t("dashboard.preview.loading")}</PreviewMessage> : weekly?.entries.length ? <div className="overflow-x-auto rounded-lg border border-[#dec59e] bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-[#14263a] text-white"><tr><th className="px-3 py-2">{t("dashboard.preview.warehouse_client")}</th><th className="px-3 py-2">{t("dashboard.preview.inbound")}</th><th className="px-3 py-2">{t("dashboard.preview.outbound")}</th><th className="px-3 py-2">{t("dashboard.preview.discrepancy")}</th></tr></thead><tbody className="divide-y divide-[#dec59e]">{weekly.entries.slice(0, MAX_ITEMS).map((entry) => <tr key={`${entry.warehouse}-${entry.client_id}`}><td className="px-3 py-2">{entry.warehouse} / {entry.client_id}</td><td className="px-3 py-2">{entry.inbound_units_count.toLocaleString(lang)}</td><td className="px-3 py-2">{entry.outbound_orders_count.toLocaleString(lang)}</td><td className="px-3 py-2">{(entry.discrepancy_rate * 100).toFixed(1)}%</td></tr>)}</tbody></table></div> : <PreviewMessage>{reportsError ? t("dashboard.preview.report_error") : t("dashboard.preview.empty_report")}</PreviewMessage>}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

function PreviewCard({ title, itemsCount, href, more, notificationLabel, children }: { title: string; itemsCount: number; href: string; more: string; notificationLabel: string; children: React.ReactNode }) {
  const additionalCount = Math.max(0, itemsCount - MAX_ITEMS);
  return <article className={cardStyle}>
    <header className="flex min-h-[4.5rem] items-center justify-between gap-3 border-b border-[#c89d66] px-4 py-3"><h3 className="text-lg font-semibold text-[#14263a]">{title}</h3>{additionalCount > 0 && <span title={`${additionalCount} ${notificationLabel}`} aria-label={`${additionalCount} ${notificationLabel}`} className="inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full bg-red-700 px-2 text-sm font-bold text-white"><svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><span>+{additionalCount}</span></span>}</header>
    {children}
    <footer className="border-t border-[#c89d66] p-4"><Link href={href} className={`${innerLinkStyle} w-full`}>{more}</Link></footer>
  </article>;
}

function PreviewMessage({ children }: { children: React.ReactNode }) {
  return <p className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-[#c89d66] px-4 text-center text-sm text-[#2f4a62]">{children}</p>;
}

function formatMonth(value: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-ES", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`));
}

function formatMoney(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
