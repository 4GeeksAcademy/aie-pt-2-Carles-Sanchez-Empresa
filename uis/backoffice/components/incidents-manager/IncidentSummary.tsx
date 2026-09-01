import {
  BRANCH_LABELS,
  CATEGORY_LABELS,
  ORIGIN_LABELS,
  STATUS_LABELS,
} from "@/lib/incidents";
import type { IncidentSummary as IncidentSummaryData } from "@/services/api";

interface IncidentSummaryProps {
  summary: IncidentSummaryData | null;
  loading: boolean;
  error: string | null;
}

interface MetricGroupProps {
  title: string;
  data: Record<string, number | undefined>;
  labels: Record<string, string>;
}

function MetricGroup({ title, data, labels }: MetricGroupProps) {
  const entries = Object.entries(data).filter((entry): entry is [string, number] => typeof entry[1] === "number");
  return (
    <section className="space-y-3 border-t border-[#c89d66] pt-4">
      <h3 className="text-sm font-semibold text-[#14263a]">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-[#2f4a62]">Sin datos.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-lg border-l-4 border-[#1d4f7a] bg-[#f8fbff] px-4 py-3">
              <p className="text-xl font-bold text-[#14263a]">{value}</p>
              <p className="text-xs text-[#2f4a62]">{labels[key] ?? key}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function IncidentSummary({ summary, loading, error }: IncidentSummaryProps) {
  if (loading) return <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm text-center"><p className="py-10 text-sm text-[#2f4a62]">Cargando resumen...</p></div>;
  if (error) return <p className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800">{error}</p>;
  if (!summary) return <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm text-center"><p className="text-sm text-[#2f4a62]">No hay resumen disponible.</p></div>;

  return (
    <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm space-y-5">
      <div className="border-l-4 border-[#c89d66] bg-[#14263a] rounded-lg px-5 py-4 text-[#f8fbff]">
        <p className="text-xs uppercase">Total de incidencias</p>
        <p className="text-3xl font-bold">{summary.total}</p>
      </div>
      <MetricGroup title="Por estado" data={summary.by_status} labels={STATUS_LABELS} />
      <MetricGroup title="Por categoría" data={summary.by_category} labels={CATEGORY_LABELS} />
      <MetricGroup title="Por origen" data={summary.by_origin} labels={ORIGIN_LABELS} />
      <MetricGroup title="Por sede" data={summary.by_branch} labels={BRANCH_LABELS} />
    </div>
  );
}