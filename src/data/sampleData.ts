/**
 * Datos de ejemplo (seeds) para el panel TrackFlow
 * Este archivo contiene los datos de demostración usados en la interfaz del Backoffice.
 */

import type { Product, Shipment, Carrier } from '../types/models';

export const sampleProducts: Product[] = [
  { sku: "SHOE-BLK-42", name: "Zapatillas Negras Running - Talla 42", category: "Fashion", weightKg: 0.8, dimensions: { lengthCm: 35, widthCm: 22, heightCm: 12 }, warehouse: "Los Angeles", stockQuantity: 45, minStockThreshold: 20, unitCostUSD: 35.0, isFragile: false, status: "Active" },
  { sku: "LAPTOP-DELL-15", name: "Laptop Dell 15 pulgadas", category: "Electronics", weightKg: 2.3, dimensions: { lengthCm: 40, widthCm: 28, heightCm: 3 }, warehouse: "Zaragoza", stockQuantity: 8, minStockThreshold: 10, unitCostUSD: 650.0, isFragile: true, status: "Low stock" },
  { sku: "PERFUME-COCO-50", name: "Perfume Coco 50ml", category: "Cosmetics", weightKg: 0.3, dimensions: { lengthCm: 12, widthCm: 8, heightCm: 15 }, warehouse: "Los Angeles", stockQuantity: 120, minStockThreshold: 30, unitCostUSD: 85.0, isFragile: true, status: "Active" },
  { sku: "LAMPA-DESK-LED", name: "Lámpara de Escritorio LED", category: "Home", weightKg: 1.2, dimensions: { lengthCm: 25, widthCm: 15, heightCm: 40 }, warehouse: "Zaragoza", stockQuantity: 15, minStockThreshold: 5, unitCostUSD: 28.0, isFragile: false, status: "Active" },
  { sku: "CERAMIC-VASE-W", name: "Jarrón de Cerámica Blanco", category: "Home", weightKg: 1.8, dimensions: { lengthCm: 20, widthCm: 20, heightCm: 35 }, warehouse: "Los Angeles", stockQuantity: 3, minStockThreshold: 8, unitCostUSD: 42.0, isFragile: true, status: "Low stock" },
] as Product[];

export const sampleShipments: Shipment[] = [
  { id: "SH-2024-8821", sku: "LAPTOP-DELL-15", quantity: 1, origin: "Zaragoza", destination: { city: "Madrid", country: "Spain", postalCode: "28001", distanceKm: 320 }, priority: "Express", declaredValueUSD: 650.0, carrier: null, status: "Pending", createdAt: new Date("2024-03-15") },
  { id: "SH-2024-8822", sku: "SHOE-BLK-42", quantity: 2, origin: "Los Angeles", destination: { city: "San Francisco", country: "United States", postalCode: "94102", distanceKm: 615 }, priority: "Standard", declaredValueUSD: 70.0, carrier: "CAR-UPS", status: "In transit", createdAt: new Date("2024-03-14") },
  { id: "SH-2024-8823", sku: "PERFUME-COCO-50", quantity: 5, origin: "Los Angeles", destination: { city: "Barcelona", country: "Spain", postalCode: "08001", distanceKm: 9600 }, priority: "Same-day", declaredValueUSD: 425.0, carrier: "CAR-DHL", status: "Assigned", createdAt: new Date("2024-03-16") },
  { id: "SH-2024-8824", sku: "CERAMIC-VASE-W", quantity: 1, origin: "Los Angeles", destination: { city: "New York", country: "United States", postalCode: "10001", distanceKm: 3930 }, priority: "Express", declaredValueUSD: 42.0, carrier: "CAR-UPS", status: "Delivered", createdAt: new Date("2024-03-10") },
] as Shipment[];

export const sampleCarriers: Carrier[] = [
  { id: "CAR-UPS", name: "UPS", operatesIn: ["United States"], baseRateUSD: 5.0, ratePerKgUSD: 1.2, ratePerKmUSD: 0.05, avgDeliveryDays: 3, onTimeRate: 88, maxWeightKg: 30, handlesFragile: true, acceptsPriority: ["Standard", "Express"] },
  { id: "CAR-SEUR", name: "SEUR", operatesIn: ["Spain"], baseRateUSD: 6.5, ratePerKgUSD: 1.5, ratePerKmUSD: 0.08, avgDeliveryDays: 2, onTimeRate: 92, maxWeightKg: 25, handlesFragile: true, acceptsPriority: ["Standard", "Express", "Same-day"] },
  { id: "CAR-DHL", name: "DHL Express", operatesIn: ["United States", "Spain"], baseRateUSD: 12.0, ratePerKgUSD: 2.0, ratePerKmUSD: 0.1, avgDeliveryDays: 1, onTimeRate: 95, maxWeightKg: 50, handlesFragile: true, acceptsPriority: ["Express", "Same-day"] },
  { id: "CAR-FEDEX", name: "FedEx Ground", operatesIn: ["United States"], baseRateUSD: 7.0, ratePerKgUSD: 1.0, ratePerKmUSD: 0.04, avgDeliveryDays: 4, onTimeRate: 85, maxWeightKg: 40, handlesFragile: false, acceptsPriority: ["Standard"] },
] as Carrier[];
