import type { StatusValue, StageValue } from "@/types";

/* ───────────────────────────────────────────
   Mapas de valor → clave de traducción
   ─────────────────────────────────────────── */

export const STATUS_KEYS: Record<StatusValue, string> = {
  received: "status.received",
  in_progress: "status.in_progress",
  selected: "status.selected",
  discarded: "status.discarded",
};

export const STAGE_KEYS: Record<StageValue, string> = {
  pending: "stage.pending",
  review: "stage.review",
  personal_interview: "stage.personal_interview",
  technical_interview: "stage.technical_interview",
  offer_presented: "stage.offer_presented",
};

/** Opciones para <select> de estado */
export const STATUS_OPTIONS: { value: StatusValue; labelKey: string }[] = [
  { value: "received", labelKey: "status.received" },
  { value: "in_progress", labelKey: "status.in_progress" },
  { value: "selected", labelKey: "status.selected" },
  { value: "discarded", labelKey: "status.discarded" },
];

/** Opciones para <select> de etapa */
export const STAGE_OPTIONS: { value: StageValue; labelKey: string }[] = [
  { value: "pending", labelKey: "stage.pending" },
  { value: "review", labelKey: "stage.review" },
  { value: "personal_interview", labelKey: "stage.personal_interview" },
  { value: "technical_interview", labelKey: "stage.technical_interview" },
  { value: "offer_presented", labelKey: "stage.offer_presented" },
];

/* ───────────────────────────────────────────
   URL base de la API
   ─────────────────────────────────────────── */

export const API_BASE = "/api/proxy";