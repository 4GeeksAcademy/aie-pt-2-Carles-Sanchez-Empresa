/**
 * services/telemetry.ts — TelemetryService (TrackFlow Backoffice)
 *
 * Sistema de captura de telemetría del frontend.
 *
 * Mecanismos:
 *   - Cola local: acumula eventos en memoria
 *   - Batch + debounce: envía cada 10s o al llegar a 20 eventos
 *   - Flush confiable: sendBeacon en visibilitychange (cierre de pestaña)
 *   - Reintentos: backoff exponencial (1s → 2s → 4s), descarta tras 3 fallos
 *
 * Uso (única función pública):
 *   import { track } from "@/services/telemetry";
 *   track("inbound_order_created", { warehouse: "los_angeles", ... });
 *
 * ⚠️ Todo el tracking del backoffice pasa por track() — nunca por fetch/axios.
 */

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface TelemetryEvent {
  eventId: string;
  timestamp: string;
  sessionId: string;
  userId: string;
  event_type: string;
  schemaVersion: string;
  requestId: string;
  properties: Record<string, unknown>;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const BATCH_INTERVAL_MS = 10_000;       // 10 segundos
const MAX_BATCH_SIZE = 20;               // Máximo eventos antes de flush forzado
const MAX_RETRIES = 3;                   // Reintentos antes de descartar
const BACKOFF_BASE_MS = 1_000;           // 1s → 2s → 4s
const SCHEMA_VERSION = "1.0";
const STORAGE_KEY_SESSION = "trackflow_session_id";
const STORAGE_KEY_TOKEN = "trackflow_token";

const ENDPOINT = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT || "/telemetry/events")
  : "/telemetry/events";

// ─── Estado singleton ────────────────────────────────────────────────────────

let queue: TelemetryEvent[] = [];
let timerId: ReturnType<typeof setInterval> | null = null;
let sessionId: string | null = null;
let initialized = false;

// ─── Helpers internos ────────────────────────────────────────────────────────

/** Genera o recupera el sessionId persistente en sessionStorage. */
function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window === "undefined") return "no-session";

  const stored = sessionStorage.getItem(STORAGE_KEY_SESSION);
  if (stored) {
    sessionId = stored;
    return stored;
  }

  const newId = crypto.randomUUID();
  try {
    sessionStorage.setItem(STORAGE_KEY_SESSION, newId);
  } catch {
    // sessionStorage no disponible (entorno restringido) — usar UUID en memoria
  }
  sessionId = newId;
  return newId;
}

/** Extrae el userId del JWT almacenado, o devuelve "anonymous". */
function getUserId(): string {
  if (typeof window === "undefined") return "anonymous";

  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  if (!token) return "anonymous";

  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    return String(payload.sub || payload.id || "anonymous");
  } catch {
    return "anonymous";
  }
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function generateTimestamp(): string {
  return new Date().toISOString();
}

// ─── Lógica de cola y envío ──────────────────────────────────────────────────

/** Envía un lote con reintentos (backoff exponencial). */
async function sendBatch(batch: TelemetryEvent[], attempt = 0): Promise<void> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
      console.warn(
        `[Telemetry] Batch reenviado (intento ${attempt + 1}/${MAX_RETRIES}) tras ${delay}ms:`,
        (err as Error).message,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendBatch(batch, attempt + 1);
    }
    // Todos los reintentos agotados — descartar el lote silenciosamente
    console.warn(
      `[Telemetry] Lote descartado tras ${MAX_RETRIES} intentos: ${batch.length} eventos`,
    );
  }
}

/** Vacía la cola actual y envía el lote al backend. */
function flush(): void {
  if (queue.length === 0) return;

  const batch = queue.splice(0, queue.length);
  // El mismo requestId para todos los eventos del lote (correlación de batch)
  const batchRequestId = generateUUID();
  const batchWithRequestId = batch.map((e) => ({ ...e, requestId: batchRequestId }));

  sendBatch(batchWithRequestId);
}

/** Envía con navigator.sendBeacon (confiable incluso al cerrar pestaña). */
function flushWithBeacon(): void {
  if (queue.length === 0) return;

  const batch = queue.splice(0, queue.length);
  const batchRequestId = generateUUID();
  const batchWithRequestId = batch.map((e) => ({ ...e, requestId: batchRequestId }));
  const payload = JSON.stringify({ events: batchWithRequestId });

  navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
}

/** Handler de visibilitychange: envía al ocultar la pestaña. */
function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    flushWithBeacon();
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Única función pública de telemetría.
 *
 * Registra un evento en la cola local. El servicio se encarga de:
 * - Generar eventId, timestamp, sessionId, userId, schemaVersion, requestId
 * - Acumular en cola y enviar en lotes (batch cada 10s o 20 eventos)
 * - Reintentar con backoff si falla la red
 * - Enviar con sendBeacon al cerrar la pestaña
 *
 * @param eventType  Tipo de evento (ej. "inbound_order_created")
 * @param properties Propiedades específicas del evento (allowlist por event_type)
 */
export function track(eventType: string, properties: Record<string, unknown>): void {
  const event: TelemetryEvent = {
    eventId: generateUUID(),
    timestamp: generateTimestamp(),
    sessionId: getSessionId(),
    userId: getUserId(),
    event_type: eventType,
    schemaVersion: SCHEMA_VERSION,
    requestId: generateUUID(),
    properties,
  };

  queue.push(event);

  // Flush inmediato si se alcanza el tamaño máximo del lote
  if (queue.length >= MAX_BATCH_SIZE) {
    flush();
  }
}

/**
 * Inicializa el servicio de telemetría.
 *
 * Debe llamarse una vez desde el layout raíz del backoffice.
 * Arranca el timer de batch y el listener de visibilitychange.
 */
export function initTelemetry(): void {
  if (typeof window === "undefined") return; // SSR guard
  if (initialized) return;

  initialized = true;

  // Flush periódico
  timerId = setInterval(flush, BATCH_INTERVAL_MS);

  // sendBeacon al ocultar la pestaña (cierre, navegación)
  document.addEventListener("visibilitychange", onVisibilityChange);

  console.info("[Telemetry] Service initialized — endpoint:", ENDPOINT);
}

/**
 * Detiene el servicio y libera recursos.
 * Útil en tests o al desmontar la aplicación.
 */
export function destroyTelemetry(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  document.removeEventListener("visibilitychange", onVisibilityChange);
  flush(); // Enviar eventos pendientes
  initialized = false;
}