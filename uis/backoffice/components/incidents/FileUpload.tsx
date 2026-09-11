"use client";

import { useRef } from "react";
import { useTranslation } from "@/lib/i18n";

interface FileUploadProps {
  onParse: (text: string) => void;
  onError: (error: string | null) => void;
}

export function FileUpload({ onParse, onError }: FileUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    onError(null);
    if (!file.name.endsWith(".csv")) {
      onError(t("incidents.upload.csv_only"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        onParse(text);
      }
    };
    reader.onerror = () => onError(t("incidents.upload.read_error"));
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        {t("incidents.upload.title")}
      </h2>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#c89d66] bg-[#f8fbff] p-8 transition hover:border-[#14263a]"
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="mb-2 text-4xl">📂</span>
        <p className="text-sm font-medium text-[#14263a]">{t("incidents.upload.drop")}</p>
        <p className="mt-1 text-xs text-[#2f4a62]">{t("incidents.upload.headers")}</p>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleChange} className="hidden" />
      </div>
    </section>
  );
}