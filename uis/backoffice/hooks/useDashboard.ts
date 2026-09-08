"use client";

import { useState, useCallback, useEffect } from "react";
import {
  filterProductsByWarehouse,
  filterProductsByCategory,
  filterLowStockProducts,
  sortProductsByStock,
  sortCarriersByReliability,
} from "@trackflow/core/utils/collections";
import {
  findProductBySKU,
  findShipmentById,
  binarySearchProductByWeight,
} from "@trackflow/core/utils/search";
import {
  scoreCarrierForShipment,
  selectBestCarrier,
  countProductsByCategory,
  calculateTotalInventoryValue,
  calculateAverageShipmentDistance,
  groupShipmentsByStatus,
  findTopCarriers,
} from "@trackflow/core/utils/transformations";
import {
  validateProduct,
  validateShipment,
  validateCarrier,
} from "@trackflow/core/utils/validations";

async function loadSampleData(): Promise<{
  sampleProducts: any[];
  sampleShipments: any[];
  sampleCarriers: any[];
}> {
  const mod = await import("@trackflow/core/data/sampleData");
  return {
    sampleProducts: mod.sampleProducts,
    sampleShipments: mod.sampleShipments,
    sampleCarriers: mod.sampleCarriers,
  };
}

export function useDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);

  // Carga diferida de datos de ejemplo, solo cuando el hook se usa (Dashboard)
  useEffect(() => {
    loadSampleData().then((data) => {
      setProducts(data.sampleProducts as any[]);
      setShipments(JSON.parse(JSON.stringify(data.sampleShipments)));
      setCarriers(data.sampleCarriers as any[]);
    });
  }, []);

  // ── Data editor ──
  const updateProducts = useCallback((raw: string) => {
    try { setProducts(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  const updateShipments = useCallback((raw: string) => {
    try { setShipments(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  const updateCarriers = useCallback((raw: string) => {
    try { setCarriers(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);

  // ── Collections ──
  const runFilterByWarehouse = useCallback((warehouse: string) => {
    return filterProductsByWarehouse(products, warehouse as any);
  }, [products]);

  const runFilterByCategory = useCallback((category: string) => {
    return filterProductsByCategory(products, category as any);
  }, [products]);

  const runLowStock = useCallback(() => {
    return filterLowStockProducts(products);
  }, [products]);

  const runSortByStock = useCallback((order: "asc" | "desc") => {
    return sortProductsByStock(products, order);
  }, [products]);

  const runSortCarriers = useCallback((order: "asc" | "desc") => {
    return sortCarriersByReliability(carriers, order);
  }, [carriers]);

  // ── Search ──
  const runFindBySKU = useCallback((sku: string) => {
    return findProductBySKU(products, sku);
  }, [products]);

  const runFindShipmentById = useCallback((id: string) => {
    return findShipmentById(shipments, id);
  }, [shipments]);

  const runBinarySearch = useCallback((weight: number) => {
    const sorted = [...products].sort((a, b) => a.weightKg - b.weightKg);
    const idx = binarySearchProductByWeight(sorted, weight);
    if (idx === -1) return null;
    return sorted[idx];
  }, [products]);

  // ── Transformations ──
  const runScoreCarrier = useCallback((carrierIdx: number, shipmentIdx: number, productIdx: number) => {
    return scoreCarrierForShipment(carriers[carrierIdx], shipments[shipmentIdx], products[productIdx]);
  }, [products, shipments, carriers]);

  const runSelectBest = useCallback((shipmentIdx: number, productIdx: number) => {
    return selectBestCarrier(carriers, shipments[shipmentIdx], products[productIdx]);
  }, [products, shipments, carriers]);

  const runCountByCategory = useCallback(() => {
    return countProductsByCategory(products);
  }, [products]);

  const runInventoryValue = useCallback(() => {
    return calculateTotalInventoryValue(products);
  }, [products]);

  const runAvgDistance = useCallback(() => {
    return calculateAverageShipmentDistance(shipments);
  }, [shipments]);

  const runGroupByStatus = useCallback(() => {
    return groupShipmentsByStatus(shipments);
  }, [shipments]);

  const runTopCarriers = useCallback((n: number) => {
    return findTopCarriers(shipments, n);
  }, [shipments]);

  // ── Validations ──
  const runValidateProduct = useCallback((productIdx: number) => {
    return validateProduct(products[productIdx]);
  }, [products]);

  const runValidateShipment = useCallback((shipmentIdx: number) => {
    return validateShipment(shipments[shipmentIdx]);
  }, [shipments]);

  const runValidateCarrier = useCallback((carrierIdx: number) => {
    return validateCarrier(carriers[carrierIdx]);
  }, [carriers]);

  return {
    products,
    shipments,
    carriers,
    updateProducts,
    updateShipments,
    updateCarriers,
    runFilterByWarehouse,
    runFilterByCategory,
    runLowStock,
    runSortByStock,
    runSortCarriers,
    runFindBySKU,
    runFindShipmentById,
    runBinarySearch,
    runScoreCarrier,
    runSelectBest,
    runCountByCategory,
    runInventoryValue,
    runAvgDistance,
    runGroupByStatus,
    runTopCarriers,
    runValidateProduct,
    runValidateShipment,
    runValidateCarrier,
  };
}