import type { StatusValue } from "@/types";
import { STATUS_KEYS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

const BADGE_CLASSES: Record<StatusValue, string> = {
  received: "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  selected: "bg-green-100 text-green-800 border-green-300",
  discarded: "bg-gray-100 text-gray-600 border-gray-300",
};

export function StatusBadge({ status }: { status: StatusValue }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[status]}`}
    >
      {t(STATUS_KEYS[status])}
    </span>
  );
}