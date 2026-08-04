/* ───────────────────────────────────────────
   Tipos del Talent Pipeline Tracker
   ─────────────────────────────────────────── */

/** Valores crudos que devuelve la API para el campo `status` */
export type StatusValue = "received" | "in_progress" | "selected" | "discarded";

/** Valores crudos que devuelve la API para el campo `stage` */
export type StageValue =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

/** Etiqueta para mostrar en pantalla (status) */
export type StatusLabel =
  | "Recibida"
  | "En proceso"
  | "Seleccionada"
  | "Descartada";

/** Etiqueta para mostrar en pantalla (stage) */
export type StageLabel =
  | "Pendiente de revisión"
  | "En revisión"
  | "Entrevista personal"
  | "Entrevista técnica"
  | "Oferta presentada";

/** Candidatura completa devuelta por GET /records y GET /records/:id */
export interface RecordOut {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: StatusValue;
  stage: StageValue;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

/** Cuerpo para POST /records */
export interface RecordCreate {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url?: string;
  cv_url?: string;
  experience_years: number;
}

/** Cuerpo para PUT /records/:id */
export type RecordUpdate = RecordCreate;

/** Cuerpo para PATCH /records/:id (cambio rápido de estado/etapa) */
export interface RecordPatch {
  status?: StatusValue;
  stage?: StageValue;
}

/** Cuerpo para POST /records/:id/notes */
export interface NoteCreate {
  content: string;
}

/** Nota devuelta por la API */
export interface NoteOut {
  id: string;
  content: string;
  created_at: string;
}

/** Respuesta paginada de GET /records */
export interface PaginatedRecords {
  total: number;
  page: number;
  limit: number;
  data: RecordOut[];
}

/** Parámetros de consulta para GET /records */
export interface RecordsQuery {
  status?: StatusValue;
  stage?: StageValue;
  search?: string;
  page?: number;
  limit?: number;
}

/** Respuesta paginada de GET /records/:id/notes */
export interface PaginatedNotes {
  data: NoteOut[];
  meta: { total: number };
}