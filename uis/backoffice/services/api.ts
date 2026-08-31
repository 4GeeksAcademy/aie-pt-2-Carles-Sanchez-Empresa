// API service for backoffice — uses fetch with auth token from @trackflow/core
import { getToken, clearToken } from "@trackflow/core";
import { API_BASE } from "@/lib/constants";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? getToken() : null;

  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=session_expired";
      }
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

// ── Suppliers ──

export interface Supplier {
  id: number;
  name: string;
  country: "USA" | "Spain";
  rate_per_shipment: number;
  currency: string;
  categories: string;
  service_zone?: string;
  contact_email?: string;
  notes?: string;
  status: "active" | "suspended";
  updated_at: string;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  return request<Supplier[]>("/suppliers");
}

export async function createSupplier(data: Record<string, unknown>): Promise<Supplier> {
  return request<Supplier>("/suppliers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSupplier(id: number, data: Record<string, unknown>): Promise<Supplier> {
  return request<Supplier>(`/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSupplier(id: number): Promise<void> {
  await request<void>(`/suppliers/${id}`, { method: "DELETE" });
}