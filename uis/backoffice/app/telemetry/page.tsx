"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { API_BASE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Period {
  from: string;
  to: string;
}

interface EventsPerDay {
  date: string;
  event_type: string;
  count: number;
}

interface ErrorEventsByType {
  date: string;
  event_type: string;
  count: number;
}

interface ApiLatencyStats {
  endpoint: string;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  count: number;
}

interface AuthFailureRate {
  date: string;
  failure_rate: number;
  failed: number;
  succeeded: number;
  total: number;
}

interface TelemetryReport {
  period: Period;
  metrics: {
    events_per_day: EventsPerDay[];
    error_events_by_type: ErrorEventsByType[];
    api_latency_stats: ApiLatencyStats[];
    auth_failure_rate: AuthFailureRate[];
  };
}

// ── Colores para gráficos ──────────────────────────────────────────────────

const CHART_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

// ── Componente principal ───────────────────────────────────────────────────

export default function TelemetryPage() {
  const { t, lang } = useTranslation();
  const [report, setReport] = useState<TelemetryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  async function fetchReport() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/telemetry/report`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data: TelemetryReport = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-[#2f4a62]">{t("telemetry.loading")}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-lg border border-red-300 bg-red-100 p-4 text-red-700">
          <p className="font-semibold">{t("telemetry.error")}</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchReport}
            className="mt-2 text-sm underline hover:text-red-900"
          >
            {t("telemetry.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#14263a]">
          {t("telemetry.title")}
        </h1>
        <p className="text-sm text-[#2f4a62]">
          {t("telemetry.subtitle")}
        </p>
      </div>

      {/* Período */}
      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
        <p className="text-sm text-[#2f4a62]">
          <span className="font-semibold text-[#14263a]">{t("telemetry.period")}:</span>{" "}
          {formatDate(report.period.from, lang)} — {formatDate(report.period.to, lang)}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid gap-6">
        {/* 1. Eventos por día */}
        <ChartCard title={t("telemetry.chart.events_per_day")}>
          <EventsPerDayChart data={report.metrics.events_per_day} t={t} />
        </ChartCard>

        {/* 2. Errores por tipo */}
        <ChartCard title={t("telemetry.chart.errors_by_type")}>
          <ErrorEventsChart data={report.metrics.error_events_by_type} t={t} />
        </ChartCard>

        {/* 3. Latencia de API */}
        <ChartCard title={t("telemetry.chart.latency")}>
          <LatencyTable data={report.metrics.api_latency_stats} t={t} />
        </ChartCard>

        {/* 4. Tasa de fallos de login */}
        <ChartCard title={t("telemetry.chart.auth_failures")}>
          <AuthFailureChart data={report.metrics.auth_failure_rate} t={t} />
        </ChartCard>
      </div>
    </div>
  );
}

// ── Componentes auxiliares ─────────────────────────────────────────────────

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a]">{title}</h2>
      {children}
    </div>
  );
}

// ── Gráfico: Eventos por día ───────────────────────────────────────────────

function EventsPerDayChart({ data, t }: { data: EventsPerDay[]; t: (key: string) => string }) {
  if (data.length === 0) {
    return <EmptyState message={t("telemetry.empty.events")} />;
  }

  // Agrupar por fecha y agregar counts por event_type
  const grouped = data.reduce<Record<string, Record<string, number>>>(
    (acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = {};
      }
      acc[item.date][item.event_type] = item.count;
      return acc;
    },
    {}
  );

  // Obtener todos los event_types únicos
  const eventTypes = [...new Set(data.map((d) => d.event_type))];

  // Transformar para el gráfico
  const chartData = Object.entries(grouped).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {eventTypes.map((type, index) => (
          <Bar
            key={type}
            dataKey={type}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            name={type}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Gráfico: Errores por tipo ──────────────────────────────────────────────

function ErrorEventsChart({ data, t }: { data: ErrorEventsByType[]; t: (key: string) => string }) {
  if (data.length === 0) {
    return <EmptyState message={t("telemetry.empty.errors")} />;
  }

  // Agrupar por event_type y sumar counts
  const byType = data.reduce<Record<string, number>>((acc, item) => {
    acc[item.event_type] = (acc[item.event_type] || 0) + item.count;
    return acc;
  }, {});

  const chartData = Object.entries(byType)
    .map(([event_type, count]) => ({ event_type, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="event_type" tick={{ fontSize: 12 }} width={180} />
        <Tooltip />
        <Bar dataKey="count" fill="#ef4444" name={t("telemetry.chart.quantity")} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Tabla: Latencia de API ─────────────────────────────────────────────────

function LatencyTable({ data, t }: { data: ApiLatencyStats[]; t: (key: string) => string }) {
  if (data.length === 0) {
    return (
      <EmptyState message={t("telemetry.empty.latency")} />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#c89d66] shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#14263a] text-[#f8fbff]">
          <tr>
            <th className="px-4 py-3">{t("telemetry.table.endpoint")}</th>
            <th className="px-4 py-3 text-right">{t("telemetry.table.avg")}</th>
            <th className="px-4 py-3 text-right">{t("telemetry.table.p50")}</th>
            <th className="px-4 py-3 text-right">{t("telemetry.table.p95")}</th>
            <th className="px-4 py-3 text-right">{t("telemetry.table.p99")}</th>
            <th className="px-4 py-3 text-right">{t("telemetry.table.requests")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#c89d66] bg-[#f3ddba]">
          {data.map((row) => (
            <tr key={row.endpoint} className="transition-colors hover:bg-[#f8fbff]">
              <td className="px-4 py-3 font-medium text-[#14263a] font-mono">
                {row.endpoint}
              </td>
              <td className="px-4 py-3 text-[#2f4a62] text-right">
                {row.avg_ms.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-[#2f4a62] text-right">
                {row.p50_ms.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-[#2f4a62] text-right">
                {row.p95_ms.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-[#2f4a62] text-right">
                {row.p99_ms.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-[#2f4a62] text-right">
                {row.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Gráfico: Tasa de fallos de login ───────────────────────────────────────

function AuthFailureChart({ data, t }: { data: AuthFailureRate[]; t: (key: string) => string }) {
  if (data.length === 0) {
    return (
      <EmptyState message={t("telemetry.empty.auth")} />
    );
  }

  const chartData = data.map((item) => ({
    date: item.date,
    tasa_fallos: (item.failure_rate * 100).toFixed(2),
    exitos: item.succeeded,
    fallos: item.failed,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: string, name: string) => {
            if (name === "tasa_fallos") return [`${value}%`, t("telemetry.chart.failure_rate")];
            return [value, name];
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="tasa_fallos"
          stroke="#ef4444"
          name={t("telemetry.chart.failure_rate")}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Componente: Estado vacío ───────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-[#2f4a62] text-sm">
      {message}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(isoString: string, lang: string = "es-ES"): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(lang, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
