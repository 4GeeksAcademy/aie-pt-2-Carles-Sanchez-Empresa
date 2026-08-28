import type { StageValue } from "@/types";
import { STAGE_LABELS } from "@/lib/constants";

const BADGE_CLASSES: Record<StageValue, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-300",
  review: "bg-indigo-100 text-indigo-700 border-indigo-300",
  personal_interview: "bg-purple-100 text-purple-700 border-purple-300",
  technical_interview: "bg-cyan-100 text-cyan-700 border-cyan-300",
  offer_presented: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

export function StageBadge({ stage }: { stage: StageValue }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}