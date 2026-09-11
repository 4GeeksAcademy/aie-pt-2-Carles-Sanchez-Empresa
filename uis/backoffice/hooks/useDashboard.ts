"use client";

import { useState, useCallback } from "react";
import {
  filterProductsByWarehouse,
  filterProductsByCategory,
  filterLowStockProducts,
  sortProductsByStock,
  sortCarriersByReliability,
  findProductBySKU,
  findShipmentById,
  binarySearchProductByWeight,
  scoreCarrierForShipment,
  selectBestCarrier,
  countProductsByCategory,
  calculateTotalInventoryValue,
  calculateAverageShipmentDistance,
  groupShipmentsByStatus,
  findTopCarriers,
  validateProduct,
  validateShipment,
  validateCarrier,
  sampleProducts,
  sampleShipments,
  sampleCarriers,
} from "@trackflow/core";

export function useDashboard() {
  const [products, setProducts] = useState(sampleProducts);
  const [shipments, setShipments] = useState(() => JSON.parse(JSON.stringify(sampleShipments)));
  const [carriers, setCarriers] = useState(sampleCarriers);

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