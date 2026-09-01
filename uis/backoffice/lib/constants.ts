export const API_BASE = "/api";

export const SUPPLIER_CATEGORIES = [
  { value: "carrier_last_mile", labelKey: "supplier.category.last_mile" },
  { value: "carrier_international", labelKey: "supplier.category.international" },
  { value: "warehouse_supplies", labelKey: "supplier.category.warehouse" },
  { value: "packaging_materials", labelKey: "supplier.category.packaging" },
  { value: "reverse_logistics", labelKey: "supplier.category.reverse" },
  { value: "fleet_maintenance", labelKey: "supplier.category.fleet" },
  { value: "it_and_wms_software", labelKey: "supplier.category.software" },
  { value: "cleaning_and_facilities", labelKey: "supplier.category.cleaning" },
] as const;

export const COUNTRIES = ["USA", "Spain"] as const;