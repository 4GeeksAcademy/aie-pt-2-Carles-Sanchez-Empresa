export const API_BASE = "/api";

export const SUPPLIER_CATEGORIES = [
  { value: "carrier_last_mile", label: "🚚 Última milla" },
  { value: "carrier_international", label: "✈️ Internacional" },
  { value: "warehouse_supplies", label: "🏭 Suministros almacén" },
  { value: "packaging_materials", label: "📦 Embalaje" },
  { value: "reverse_logistics", label: "🔄 Logística inversa" },
  { value: "fleet_maintenance", label: "🔧 Mantenimiento flota" },
  { value: "it_and_wms_software", label: "💻 IT y WMS" },
  { value: "cleaning_and_facilities", label: "🧹 Limpieza" },
] as const;

export const COUNTRIES = ["USA", "Spain"] as const;