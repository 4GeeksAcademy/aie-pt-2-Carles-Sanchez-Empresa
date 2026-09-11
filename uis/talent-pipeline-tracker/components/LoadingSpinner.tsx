"use client";

import { useTranslation } from "@/lib/i18n";

export function LoadingSpinner({ text }: { text?: string }) {
  const { t } = useTranslation();
  const displayText = text ?? t("app.loading");
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c89d66] border-t-[#14263a]" />
      <p className="text-sm text-[#2f4a62]">{displayText}</p>
    </div>
  );
}