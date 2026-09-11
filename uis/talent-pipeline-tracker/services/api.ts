import { API_BASE } from "@/lib/constants";
import { clearToken, getToken } from "@/services/auth";
import type {
  RecordOut,
  RecordCreate,
  RecordUpdate,
  RecordPatch,
  RecordsQuery,
  PaginatedRecords,  PaginatedNotes,  NoteOut,
  NoteCreate,
} from "@/types";

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  if (process.env.NODE_ENV !== "production") {
    console.log(`🌐 ${options?.method || "GET"} ${url}`);
  }
  const token = typeof window !== "undefined" ? getToken() : null;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      const loginUrl = new URL("/login?reason=session_expired", window.location.origin);
      window.location.href = loginUrl.toString();
    }
    throw new Error("Sesión expirada");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`API Error ${res.status} — consulta la respuesta completa en la excepción`);
    throw new Error(`Error ${res.status}: ${res.statusText}${body ? ` — ${body}` : ""}`);
  }

  if (res.status === 204) return undefined as T; // DELETE sin cuerpo
  return res.json() as Promise<T>;
}

export function buildQueryString(params: RecordsQuery): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.stage) search.set("stage", params.stage);
  if (params.search) search.set("search", params.search);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/* ───────────────────────────────────────────────
   Records
   ─────────────────────────────────────────────── */

export async function getRecords(
  params: RecordsQuery = {},
): Promise<RecordOut[]> {
  // Pedir todos los registros (la API ordena alfabéticamente por nombre)
  const res = await request<PaginatedRecords>(
    `${API_BASE}/records${buildQueryString({ limit: 999, ...params })}`,
  );
  return res.data;
}

export async function getRecordById(id: string): Promise<RecordOut> {
  return request<RecordOut>(`${API_BASE}/records/${id}`);
}

export async function createRecord(
  data: RecordCreate,
): Promise<RecordOut> {
  // Limpiar campos opcionales vacíos para que la API no los rechace
  const body: Record<string, unknown> = { ...data };
  if (!body.linkedin_url) delete body.linkedin_url;
  if (!body.cv_url) delete body.cv_url;

  return request<RecordOut>(`${API_BASE}/records`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateRecord(
  id: string,
  data: RecordUpdate,
): Promise<RecordOut> {
  // Limpiar campos opcionales vacíos
  const body: Record<string, unknown> = { ...data };
  if (!body.linkedin_url) delete body.linkedin_url;
  if (!body.cv_url) delete body.cv_url;

  return request<RecordOut>(`${API_BASE}/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function patchRecord(
  id: string,
  data: RecordPatch,
): Promise<RecordOut> {
  return request<RecordOut>(`${API_BASE}/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteRecord(id: string): Promise<void> {
  return request<void>(`${API_BASE}/records/${id}`, {
    method: "DELETE",
  });
}

/* ───────────────────────────────────────────────
   Notas
   ─────────────────────────────────────────────── */

export async function getNotes(recordId: string): Promise<NoteOut[]> {
  const res = await request<PaginatedNotes>(`${API_BASE}/records/${recordId}/notes`);
  return res.data;
}

export async function createNote(
  recordId: string,
  data: NoteCreate,
): Promise<NoteOut> {
  return request<NoteOut>(`${API_BASE}/records/${recordId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(
  recordId: string,
  noteId: string,
): Promise<void> {
  return request<void>(
    `${API_BASE}/records/${recordId}/notes/${noteId}`,
    { method: "DELETE" },
  );
}