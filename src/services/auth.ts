/**
 * src/services/auth.ts — Módulo compartido de autenticación (TrackFlow)
 *
 * Funciones para login, registro, gestión de token JWT y perfil.
 * Utilizado tanto por el backoffice (HTML estático + bundle) como
 * por las aplicaciones Next.js del monorepo.
 *
 * Almacena el token en localStorage bajo la clave "trackflow_token".
 */

const STORAGE_KEY = "trackflow_token";
const API_ORIGIN = ""; // Rutas relativas (mismo servidor FastAPI)

// ════════════════════════════════════════════
//  GESTIÓN DEL TOKEN
// ════════════════════════════════════════════

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Redirige a /login si no hay token.
 * Útil para páginas protegidas del backoffice.
 */
export function requireAuth(): void {
  if (typeof window === "undefined") return;
  const token = getToken();
  if (!token) {
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }
}

/**
 * Si una llamada a la API devuelve 401, limpia la sesión y redirige.
 * Úsalo en el catch de fetch.
 */
export function handleAuthError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  // Detecta 401
  if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("No se pudieron validar")) {
    clearToken();
    window.location.href = "/login?reason=session_expired";
  }
  throw err;
}

// ════════════════════════════════════════════
//  AUTH API
// ════════════════════════════════════════════

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface AuthMeResponse {
  id: number;
  email: string;
  role: string;
  profile: {
    id: number;
    user_id: number;
    name: string | null;
    phone: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

interface ProfileResponse {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

interface UserCreateResponse {
  user: { id: number; email: string; role: string; is_active: boolean };
  profile: Record<string, unknown> | null;
}

/**
 * Inicia sesión: POST /auth/login con email + password.
 * Almacena el token en localStorage si es exitoso.
 * Devuelve el token.
 */
export async function login(email: string, password: string): Promise<string> {
  try {
    const res = await fetch(`${API_ORIGIN}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let detail = `Error ${res.status}`;
      try {
        const body = await res.json();
        detail = body.detail || detail;
      } catch {
        console.warn("[auth] No se pudo parsear el cuerpo de error en login (código HTTP", res.status, ")");
      }
      throw new Error(detail);
    }

    const data: LoginResponse = await res.json();
    setToken(data.access_token);
    return data.access_token;
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.");
    }
    throw err;
  }
}

/**
 * Registra un nuevo usuario, luego inicia sesión automáticamente.
 *
 * 1. POST /users con email, password, name opcional, phone opcional, address opcional
 * 2. POST /auth/login con las mismas credenciales
 * 3. Almacena el token
 *
 * Devuelve el token.
 */
export async function register(data: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
}): Promise<string> {
  try {
    // 1. Crear usuario
    const registerPayload: Record<string, unknown> = {
      email: data.email,
      password: data.password,
    };
    if (data.name) registerPayload.name = data.name;
    if (data.phone) registerPayload.phone = data.phone;
    if (data.address) registerPayload.address = data.address;

    const regRes = await fetch(`${API_ORIGIN}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerPayload),
    });

    if (!regRes.ok) {
      let detail = `Error ${regRes.status}`;
      try {
        const body = await regRes.json();
        detail = body.detail || detail;
      } catch {
        console.warn("[auth] No se pudo parsear el cuerpo de error en register (código HTTP", regRes.status, ")");
      }
      throw new Error(detail);
    }

    // 2. Login automático con las mismas credenciales
    return login(data.email, data.password);
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.");
    }
    throw err;
  }
}

/**
 * Obtiene la información del usuario autenticado: GET /auth/me.
 */
export async function getAuthMe(): Promise<AuthMeResponse> {
  try {
    const res = await fetch(`${API_ORIGIN}/auth/me`, {
      headers: { ...getAuthHeaders() },
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearToken();
        window.location.href = "/login?reason=session_expired";
      }
      let detail = `Error ${res.status}`;
      try {
        const body = await res.json();
        detail = body.detail || detail;
      } catch {
        console.warn("[auth] No se pudo parsear el cuerpo de error en getAuthMe (código HTTP", res.status, ")");
      }
      throw new Error(detail);
    }

    return res.json();
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.");
    }
    throw err;
  }
}

/**
 * Obtiene el perfil del usuario autenticado: GET /profiles/me.
 */
export async function getProfile(): Promise<ProfileResponse> {
  const res = await fetch(`${API_ORIGIN}/profiles/me`, {
    headers: { ...getAuthHeaders() },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.href = "/login?reason=session_expired";
    }
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return res.json();
}

/**
 * Actualiza el perfil del usuario autenticado: PUT /profiles/me.
 */
export async function updateProfile(data: {
  name?: string;
  phone?: string;
  address?: string;
}): Promise<ProfileResponse> {
  const res = await fetch(`${API_ORIGIN}/profiles/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.href = "/login?reason=session_expired";
    }
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return res.json();
}

/**
 * Cierra sesión: elimina el token y redirige a /login.
 */
export function logout(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}