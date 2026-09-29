"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { API_BASE } from "@/lib/constants";
import { getToken } from "@trackflow/core/services/auth";

interface ForecastPoint {
  month: string;
  year: number;
  actual_eur: number;
  predicted_eur: number;
  lower_eur: number;
  upper_eur: number;
}

interface Metrics {
  mse_eur2: number;
  normalized_mse_percent: number;
  rmse_percent_of_mean: number;
  rmse_eur: number;
  psi: number;
  gini: number | null;
  gini_threshold_eur: number;
  k2_score: number;
  k2_pvalue: number;
  months: number;
}

interface ForecastReport {
  train_period: { start: string; end: string; months: number };
  test_period: { start: string; end: string; months: number };
  metrics: Metrics;
  points: ForecastPoint[];
  psi_method: string;
  gini_method: string;
  k2_method: string;
  validation: { period: string; band_method: string };
}

const cardClass = "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm";

export default function SalesForecastPage() {
  const [report, setReport] = useState<ForecastReport | null>(null);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startYear) params.set("start_year", startYear);
      if (endYear) params.set("end_year", endYear);
      const token = getToken();
      const response = await fetch(`${API_BASE}/reporting/sales-forecast${params.size ? `?${params}` : ""}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
      setReport(await response.json() as ForecastReport);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load forecast report.");
    } finally {
      setLoading(false);
    }
  }, [startYear, endYear]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  const years = useMemo(() => {
    const first = report ? Number(report.test_period.start.slice(0, 4)) : 2024;
    const last = report ? Number(report.test_period.end.slice(0, 4)) : 2025;
    return Array.from({ length: last - first + 1 }, (_, index) => String(first + index));
  }, [report]);

  const chartData = useMemo(() => (report?.points ?? []).map((point) => ({
    ...point,
    month_label: new Intl.DateTimeFormat("es-ES", { month: "short", year: "2-digit", timeZone: "UTC" })
      .format(new Date(`${point.month}T00:00:00Z`)),
    band: Math.max(0, point.upper_eur - point.lower_eur),
    band_base: point.lower_eur,
  })), [report]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-[#14263a]">Pronóstico de ventas</h1>
        <p className="text-sm text-[#2f4a62]">Random Forest para ingresos consolidados mensuales de TrackFlow.</p>
        <p className="mt-1 text-sm text-[#2f4a62]">Entrenamiento: 2016–2023 (96 meses) · Prueba: 2024–2025 (24 meses)</p>
      </header>

      <section className={`${cardClass} flex flex-wrap items-end gap-4`} aria-label="Filtros por año">
        <label className="grid gap-1 text-sm font-medium text-[#14263a]">
          Año inicial
          <select value={startYear} onChange={(event) => setStartYear(event.target.value)} className="rounded border border-[#c89d66] bg-white px-3 py-2">
            <option value="">Global</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#14263a]">
          Año final
          <select value={endYear} onChange={(event) => setEndYear(event.target.value)} className="rounded border border-[#c89d66] bg-white px-3 py-2">
            <option value="">Global</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => { setStartYear(""); setEndYear(""); }} className="rounded bg-[#14263a] px-4 py-2 text-sm font-semibold text-white">Ver global</button>
        <p className="text-xs text-[#2f4a62]">Al seleccionar un año inicial o final, se muestran las métricas del intervalo inclusivo.</p>
      </section>

      {loading ? <Status>Calculando vista…</Status> : error ? (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-100 p-4 text-red-800">
          <p>No se pudo cargar el pronóstico. Ejecuta primero <code>python scripts/sales_forecast.py</code> y asegúrate de que la API esté activa.</p>
          <p className="mt-1 text-sm">{error}</p>
          <button onClick={() => void loadReport()} className="mt-2 underline">Reintentar</button>
        </div>
      ) : report ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="MSE (EUR²)" value={formatNumber(report.metrics.mse_eur2)} description={`${report.metrics.normalized_mse_percent.toFixed(2)}% del ingreso medio al cuadrado; RMSE = ${report.metrics.rmse_percent_of_mean.toFixed(2)}% del ingreso medio.`} />
          <MetricCard title="RMSE (EUR)" value={formatCurrency(report.metrics.rmse_eur)} description="Error típico en la unidad de negocio: euros." />
          <MetricCard title="PSI" value={report.metrics.psi.toFixed(3)} description={psiInterpretation(report.metrics.psi)} />
          <MetricCard title="Gini" value={report.metrics.gini === null ? "N/D" : report.metrics.gini.toFixed(3)} description="Ordena meses por encima del percentil 75 de ingresos de entrenamiento." />
          <MetricCard title="K² Score" value={report.metrics.k2_score.toFixed(3)} description={`Residuos vs. normalidad; p = ${report.metrics.k2_pvalue.toPrecision(3)}.`} />
          <MetricCard title="Meses comparados" value={report.metrics.months} description="Se recalcula con el rango de años seleccionado." />
        </section>

        <section className={`${cardClass} h-[420px]`}>
          <h2 className="mb-4 text-lg font-semibold text-[#14263a]">Predicción frente a ingresos reales</h2>
          <ResponsiveContainer width="100%" height="90%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 22, left: 12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month_label" minTickGap={16} />
              <YAxis tickFormatter={(value: number) => `€${Math.round(value / 1000)}k`} width={75} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Area dataKey="band_base" stackId="confidence" stroke="none" fill="transparent" name="" legendType="none" />
              <Area dataKey="band" stackId="confidence" stroke="none" fill="#93c5fd" fillOpacity={0.35} name="Banda de variabilidad (95%)" />
              <Line dataKey="actual_eur" name="Ingresos reales" stroke="#14263a" strokeWidth={2} dot={false} />
              <Line dataKey="predicted_eur" name="Predicción Random Forest" stroke="#dc6b2f" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-xs text-[#2f4a62]">La banda usa los percentiles 2,5 y 97,5 de residuos en validación temporal 2022–2023, no valores del periodo de prueba.</p>
        </section>

        <section className={cardClass}>
          <h2 className="mb-2 font-semibold text-[#14263a]">Cómo leer estas métricas</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#2f4a62]">
            <li>MSE penaliza errores grandes; RMSE expresa el error en euros y resulta más intuitivo.</li>
            <li>PSI compara la distribución de puntuaciones de entrenamiento walk-forward con la de prueba; valores altos indican deriva y no equivalen a error de predicción.</li>
            <li>Gini = 2 × AUC − 1; la etiqueta de ingresos altos se define con el percentil 75 del entrenamiento.</li>
            <li>K² es el estadístico D’Agostino-Pearson aplicado a residuos (real − predicción); un p-valor pequeño es evidencia contra la normalidad. Con pocos meses debe interpretarse con cautela.</li>
          </ul>
          <p className="mt-3 text-xs text-[#2f4a62]">PSI: {report.psi_method} Umbrales: &lt;0,1 estable; 0,1–0,25 deriva ligera; &gt;0,25 deriva significativa.</p>
          <p className="mt-1 text-xs text-[#2f4a62]">Gini: {report.gini_method} · K²: {report.k2_method}</p>
          <p className="mt-1 text-xs text-[#2f4a62]">La fuente solo incluye ingresos consolidados, por lo que no permite atribuir cambios a la mezcla entre países.</p>
        </section>
      </> : null}
    </div>
  );
}

function MetricCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return <article className={cardClass}><h2 className="text-sm font-medium text-[#2f4a62]">{title}</h2><p className="mt-2 text-2xl font-bold text-[#14263a]">{value}</p><p className="mt-2 text-xs text-[#2f4a62]">{description}</p></article>;
}

function Status({ children }: { children: React.ReactNode }) {
  return <div className={`${cardClass} py-16 text-center`}>{children}</div>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function psiInterpretation(value: number) {
  if (value < 0.1) return "Estable (< 0,1).";
  if (value <= 0.25) return "Deriva ligera; monitorizar.";
  return "Deriva significativa (> 0,25); revisar/reentrenar.";
}
