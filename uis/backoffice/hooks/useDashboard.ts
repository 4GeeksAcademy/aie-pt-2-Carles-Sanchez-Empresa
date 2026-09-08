"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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

  // Refs para evitar recreación de callbacks en cada cambio de estado
  const productsRef = useRef(products);
  const shipmentsRef = useRef(shipments);
  const carriersRef = useRef(carriers);
  productsRef.current = products;
  shipmentsRef.current = shipments;
  carriersRef.current = carriers;

  // Carga diferida de datos de ejemplo — una sola vez
  useEffect(() => {
    loadSampleData().then((data) => {
      // Asignamos todo en un solo tick para minimizar re-renders
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

  // ── Collections (usando refs para evitar dependencias) ──
  const runFilterByWarehouse = useCallback((warehouse: string) => {
    return filterProductsByWarehouse(productsRef.current, warehouse as any);
  }, []);

  const runFilterByCategory = useCallback((category: string) => {
    return filterProductsByCategory(productsRef.current, category as any);
  }, []);

  const runLowStock = useCallback(() => {
    return filterLowStockProducts(productsRef.current);
  }, []);

  const runSortByStock = useCallback((order: "asc" | "desc") => {
    return sortProductsByStock(productsRef.current, order);
  }, []);

  const runSortCarriers = useCallback((order: "asc" | "desc") => {
    return sortCarriersByReliability(carriersRef.current, order);
  }, []);

  // ── Search ──
  const runFindBySKU = useCallback((sku: string) => {
    return findProductBySKU(productsRef.current, sku);
  }, []);

  const runFindShipmentById = useCallback((id: string) => {
    return findShipmentById(shipmentsRef.current, id);
  }, []);

  const runBinarySearch = useCallback((weight: number) => {
    const sorted = [...productsRef.current].sort((a, b) => a.weightKg - b.weightKg);
    const idx = binarySearchProductByWeight(sorted, weight);
    if (idx === -1) return null;
    return sorted[idx];
  }, []);

  // ── Transformations ──
  const runScoreCarrier = useCallback((carrierIdx: number, shipmentIdx: number, productIdx: number) => {
    return scoreCarrierForShipment(carriersRef.current[carrierIdx], shipmentsRef.current[shipmentIdx], productsRef.current[productIdx]);
  }, []);

  const runSelectBest = useCallback((shipmentIdx: number, productIdx: number) => {
    return selectBestCarrier(carriersRef.current, shipmentsRef.current[shipmentIdx], productsRef.current[productIdx]);
  }, []);

  const runCountByCategory = useCallback(() => {
    return countProductsByCategory(productsRef.current);
  }, []);

  const runInventoryValue = useCallback(() => {
    return calculateTotalInventoryValue(productsRef.current);
  }, []);

  const runAvgDistance = useCallback(() => {
    return calculateAverageShipmentDistance(shipmentsRef.current);
  }, []);

  const runGroupByStatus = useCallback(() => {
    return groupShipmentsByStatus(shipmentsRef.current);
  }, []);

  const runTopCarriers = useCallback((n: number) => {
    return findTopCarriers(shipmentsRef.current, n);
  }, []);

  // ── Validations ──
  const runValidateProduct = useCallback((productIdx: number) => {
    return validateProduct(productsRef.current[productIdx]);
  }, []);

  const runValidateShipment = useCallback((shipmentIdx: number) => {
    return validateShipment(shipmentsRef.current[shipmentIdx]);
  }, []);

  const runValidateCarrier = useCallback((carrierIdx: number) => {
    return validateCarrier(carriersRef.current[carrierIdx]);
  }, []);

  // Memorizar el objeto de retorno para estabilidad de referencias
  return useMemo(() => ({
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
  }), [
    products,
    shipments,
    carriers,
    updateProducts,
    updateShipments,
    updateCarriers,
  ]);
}