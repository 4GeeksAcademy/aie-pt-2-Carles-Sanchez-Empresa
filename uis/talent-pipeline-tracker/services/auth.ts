const STORAGE_KEY = "trackflow_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const AUTH_API_BASE = "/api/auth-proxy";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface AuthErrorBody {
  detail?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface AuthMeResponse {
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

export interface ProfileResponse {
  id: number;
  user_id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
  address?: string;
}

function decodeBase64Url(base64Url: string): string {
  let normalized = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4 !== 0) normalized += "=";
  return atob(normalized);
}

export function isExpiredJwt(token: string): boolean {
  if (!token) return true;
  const parts = token.split(".");
  if (parts.length !== 3) return true;

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  } catch {
    return true;
  }
}

function setTokenCookie(token: string): void {
  document.cookie = `${STORAGE_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function clearTokenCookie(): void {
  document.cookie = `${STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return null;

  if (isExpiredJwt(token)) {
    clearToken();
    return null;
  }

  return token;
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
  setTokenCookie(token);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
  clearTokenCookie();
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function isValidPhoneForRegister(phone: string): boolean {
  return /^[\d\s+\-()]{6,20}$/.test(phone);
}

async function parseError(res: Response): Promise<string> {
  const defaultMessage = `Error ${res.status}`;
  try {
    const body = (await res.json()) as AuthErrorBody;
    return body.detail || defaultMessage;
  } catch {
    return defaultMessage;
  }
}

function handleUnauthorizedRedirect(): never {
  clearToken();
  if (typeof window !== "undefined") {
    const url = new URL("/login?reason=session_expired", window.location.origin);
    window.location.href = url.toString();
  }
  throw new Error("Sesión expirada");
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${AUTH_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = (await res.json()) as LoginResponse;
  setToken(data.access_token);
  return data.access_token;
}

export async function register(payload: RegisterPayload): Promise<string> {
  const registerPayload: RegisterPayload = {
    email: payload.email,
    password: payload.password,
  };

  if (payload.name) registerPayload.name = payload.name;
  if (payload.phone) registerPayload.phone = payload.phone;
  if (payload.address) registerPayload.address = payload.address;

  const regRes = await fetch(`${AUTH_API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registerPayload),
  });

  if (!regRes.ok) {
    throw new Error(await parseError(regRes));
  }

  return login(payload.email, payload.password);
}

export async function getAuthMe(): Promise<AuthMeResponse> {
  const token = getToken();
  if (!token) {
    throw new Error("No hay sesión activa.");
  }

  const res = await fetch(`${AUTH_API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorizedRedirect();
    }
    throw new Error(await parseError(res));
  }

  return (await res.json()) as AuthMeResponse;
}

export async function updateProfile(data: ProfileUpdatePayload): Promise<ProfileResponse> {
  const token = getToken();
  if (!token) {
    throw new Error("No hay sesión activa.");
  }

  const res = await fetch(`${AUTH_API_BASE}/profiles/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorizedRedirect();
    }
    throw new Error(await parseError(res));
  }

  return (await res.json()) as ProfileResponse;
}
