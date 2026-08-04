import type { StatusValue, StatusLabel, StageValue, StageLabel } from "@/types";

/* ───────────────────────────────────────────
   Mapas de valor → etiqueta legible
   ─────────────────────────────────────────── */

export const STATUS_LABELS: Record<StatusValue, StatusLabel> = {
  received: "Recibida",
  in_progress: "En proceso",
  selected: "Seleccionada",
  discarded: "Descartada",
};

export const STAGE_LABELS: Record<StageValue, StageLabel> = {
  pending: "Pendiente de revisión",
  review: "En revisión",
  personal_interview: "Entrevista personal",
  technical_interview: "Entrevista técnica",
  offer_presented: "Oferta presentada",
};

/** Opciones para <select> de estado */
export const STATUS_OPTIONS: { value: StatusValue; label: StatusLabel }[] = [
  { value: "received", label: "Recibida" },
  { value: "in_progress", label: "En proceso" },
  { value: "selected", label: "Seleccionada" },
  { value: "discarded", label: "Descartada" },
];

/** Opciones para <select> de etapa */
export const STAGE_OPTIONS: { value: StageValue; label: StageLabel }[] = [
  { value: "pending", label: "Pendiente de revisión" },
  { value: "review", label: "En revisión" },
  { value: "personal_interview", label: "Entrevista personal" },
  { value: "technical_interview", label: "Entrevista técnica" },
  { value: "offer_presented", label: "Oferta presentada" },
];

/* ───────────────────────────────────────────
   URL base de la API
   ─────────────────────────────────────────── */

export const API_BASE = "/api/proxy";