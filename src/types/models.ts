//Interfaces y tipos

//Variables:

//Del producto:
interface Product {
  sku: string; // Stock Keeping Unit (ej: "SHOE-BLK-42")
  name: string; // Nombre del producto
  category: ProductCategory; // Categoría del producto
  weightKg: number; // Peso en kilogramos
  dimensions: Dimensions; // Largo, ancho, alto en cm
  warehouse: WarehouseLocation; // Almacén actual
  stockQuantity: number; // Unidades disponibles
  minStockThreshold: number; // Stock mínimo antes de alerta
  unitCostUSD: number; // Costo por unidad en USD
  isFragile: boolean; // Requiere manejo especial
  status: ProductStatus; // Estado actual
}

interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

type ProductCategory =
  | "Fashion"
  | "Electronics"
  | "Cosmetics"
  | "Home"
  | "Other";
type WarehouseLocation = "Los Angeles" | "Zaragoza";
type ProductStatus = "Active" | "Low stock" | "Out of stock" | "Discontinued";

//Del envío
interface Shipment {
  id: string; // ID único de envío (ej: "SH-2024-8821")
  sku: string; // SKU del producto siendo enviado
  quantity: number; // Número de unidades
  origin: WarehouseLocation; // Almacén de origen
  destination: Destination; // Destino de entrega
  priority: ShipmentPriority; // Nivel de urgencia
  declaredValueUSD: number; // Valor declarado para seguro
  carrier: string | null; // Transportista asignado (null si no asignado)
  status: ShipmentStatus; // Estado actual
  createdAt: Date; // Fecha de creación del pedido
}

interface Destination {
  city: string;
  country: Country;
  postalCode: string;
  distanceKm: number; // Distancia desde el almacén de origen
}

type Country = "United States" | "Spain";
type ShipmentPriority = "Standard" | "Express" | "Same-day";
type ShipmentStatus =
  | "Pending"
  | "Assigned"
  | "In transit"
  | "Delivered"
  | "Failed";

//Del transportista:
interface Carrier {
  id: string; // ID del transportista (ej: "CAR-UPS")
  name: string; // Nombre del transportista (ej: "UPS")
  operatesIn: Country[]; // Países donde opera
  baseRateUSD: number; // Costo base de entrega (USD)
  ratePerKgUSD: number; // Costo adicional por kg (USD)
  ratePerKmUSD: number; // Costo adicional por km (USD)
  avgDeliveryDays: number; // Tiempo promedio de entrega en días
  onTimeRate: number; // Tasa de entrega a tiempo (0-100)
  maxWeightKg: number; // Peso máximo de paquete que aceptan
  handlesFragile: boolean; // Puede manejar ítems frágiles
  acceptsPriority: ShipmentPriority[]; // Prioridades que soportan
}
