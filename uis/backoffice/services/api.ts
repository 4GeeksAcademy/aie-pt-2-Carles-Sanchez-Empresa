// API service for backoffice — uses fetch with auth token from @trackflow/core
import { getToken, clearToken } from "@trackflow/core";
import { API_BASE } from "@/lib/constants";

function formatErrorDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "object" && item !== null && "error" in item) {
          return String(item.error);
        }
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String(item.msg);
        }
        return null;
      })
      .filter((message): message is string => Boolean(message))
      .join("; ") || fallback;
  }
  return fallback;
}

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
      const body: { detail?: unknown } = await res.json();
      detail = formatErrorDetail(body.detail, detail);
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
  categories: string[];
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

// ── Centralized incident manager ──

export type IncidentStatus = "open" | "in_progress" | "resolved" | "discarded";
export type IncidentOrigin = "customer" | "branch" | "internal";
export type IncidentCategory =
  | "lost_parcel"
  | "delivery_failure"
  | "inventory_discrepancy"
  | "carrier_issue"
  | "returns_issue"
  | "warehouse_incident"
  | "system_failure"
  | "client_complaint"
  | "other";
export type IncidentBranch =
  | "central"
  | "la_warehouse"
  | "la_office"
  | "zaragoza_warehouse"
  | "zaragoza_office";

export interface Incident {
  id: number;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: IncidentBranch;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreateInput {
  title: string;
  description: string;
  category: IncidentCategory;
  origin: IncidentOrigin;
  branch: IncidentBranch;
}

export interface IncidentFilters {
  status?: IncidentStatus;
  origin?: IncidentOrigin;
  branch?: IncidentBranch;
  category?: IncidentCategory;
}

export interface IncidentSummary {
  total: number;
  by_status: Partial<Record<IncidentStatus, number>>;
  by_category: Partial<Record<IncidentCategory, number>>;
  by_origin: Partial<Record<IncidentOrigin, number>>;
  by_branch: Partial<Record<IncidentBranch, number>>;
}

export async function fetchIncidents(filters: IncidentFilters = {}): Promise<Incident[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return request<Incident[]>(`/incidents${query ? `?${query}` : ""}`);
}

export async function createIncident(data: IncidentCreateInput): Promise<Incident> {
  return request<Incident>("/incidents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIncidentStatus(id: number, status: IncidentStatus): Promise<Incident> {
  return request<Incident>(`/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchIncidentSummary(): Promise<IncidentSummary> {
  return request<IncidentSummary>("/incidents/summary");
}

// ── Inventory ──

export interface SKUItem {
  id: number;
  name: string;
  sku_code: string;
  client_name: string;
  category: string;
  warehouse: string;
  current_stock: number;
  created_at: string;
}

export interface SKUCreateInput {
  name: string;
  sku_code: string;
  client_name: string;
  category: string;
  warehouse: string;
}

export interface StockEntryInput {
  sku_id: number;
  quantity: number;
  reference: string;
  warehouse: string;
}

export interface StockEntryResult {
  id: number;
  sku_id: number;
  quantity: number;
  reference: string;
  warehouse: string;
  user_uuid: string;
  created_at: string;
}

export interface StockExitInput {
  sku_id: number;
  quantity: number;
  exit_type: "dispatch" | "loss";
  tracking_number?: string | null;
  warehouse: string;
}

export interface StockExitResult {
  id: number;
  sku_id: number;
  quantity: number;
  exit_type: string;
  tracking_number: string | null;
  warehouse: string;
  user_uuid: string;
  created_at: string;
}

export interface Movement {
  id: number;
  type: "inbound" | "outbound";
  sku_id: number;
  sku_name: string;
  sku_code: string;
  quantity: number;
  warehouse: string;
  user_uuid: string;
  reference_or_exit: string;
  tracking_number?: string | null;
  created_at: string;
}

export async function fetchProducts(filters?: { warehouse?: string; category?: string }): Promise<SKUItem[]> {
  const params = new URLSearchParams();
  if (filters?.warehouse) params.set("warehouse", filters.warehouse);
  if (filters?.category) params.set("category", filters.category);
  const query = params.toString();
  return request<SKUItem[]>(`/inventory/products${query ? `?${query}` : ""}`);
}

export async function createProduct(data: SKUCreateInput): Promise<SKUItem> {
  return request<SKUItem>("/inventory/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchProduct(id: number): Promise<SKUItem> {
  return request<SKUItem>(`/inventory/products/${id}`);
}

export async function createInboundOrder(data: StockEntryInput): Promise<StockEntryResult> {
  return request<StockEntryResult>("/inventory/orders/inbound", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createOutboundOrder(data: StockExitInput): Promise<StockExitResult> {
  return request<StockExitResult>("/inventory/orders/outbound", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchOrders(warehouse?: string): Promise<Movement[]> {
  const params = warehouse ? `?warehouse=${warehouse}` : "";
  return request<Movement[]>(`/inventory/orders${params}`);
}