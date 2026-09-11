import type {
  IncidentBranch,
  IncidentCategory,
  IncidentOrigin,
  IncidentStatus,
} from "@/services/api";

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Abierta",
  in_progress: "En progreso",
  resolved: "Resuelta",
  discarded: "Descartada",
};

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  lost_parcel: "Paquete perdido",
  delivery_failure: "Fallo de entrega",
  inventory_discrepancy: "Discrepancia de inventario",
  carrier_issue: "Problema con transportista",
  returns_issue: "Problema de devolución",
  warehouse_incident: "Incidencia de almacén",
  system_failure: "Fallo del sistema",
  client_complaint: "Queja de cliente",
  other: "Otro",
};

export const ORIGIN_LABELS: Record<IncidentOrigin, string> = {
  customer: "Cliente",
  branch: "Sede",
  internal: "Interno",
};

export const BRANCH_LABELS: Record<IncidentBranch, string> = {
  central: "Central (Madrid)",
  la_warehouse: "Almacén Los Ángeles",
  la_office: "Oficina Los Ángeles",
  zaragoza_warehouse: "Almacén Zaragoza",
  zaragoza_office: "Oficina Zaragoza",
};

export const STATUS_STYLES: Record<IncidentStatus, string> = {
  open: "border-amber-300 bg-amber-50 text-amber-800",
  in_progress: "border-sky-300 bg-sky-50 text-sky-800",
  resolved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  discarded: "border-gray-300 bg-gray-100 text-gray-700",
};

export const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};