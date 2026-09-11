/**
 * UI Handlers para el panel TrackFlow
 * Conecta los botones del HTML con las funciones de lógica TypeScript.
 */

import { filterProductsByWarehouse, filterProductsByCategory, filterLowStockProducts, sortProductsByStock, sortCarriersByReliability } from '../utils/collections';
import { findProductBySKU, findShipmentById, binarySearchProductByWeight } from '../utils/search';
import { scoreCarrierForShipment, selectBestCarrier, countProductsByCategory, calculateTotalInventoryValue, calculateAverageShipmentDistance, groupShipmentsByStatus, findTopCarriers } from '../utils/transformations';
import { validateProduct, validateShipment, validateCarrier } from '../utils/validations';
import { sampleProducts, sampleShipments, sampleCarriers } from '../data/sampleData';
import { Shipment } from '../types/models';
import {
  login,
  register,
  logout,
  getToken,
  clearToken,
  getAuthHeaders,
  requireAuth,
  handleAuthError,
  getAuthMe,
  getProfile,
  updateProfile,
} from '../services/auth';

// ───────────────────────────────────────────────
// State global mutable (el usuario puede modificarlo)
// ───────────────────────────────────────────────

const state = {
  products: [...sampleProducts],
  shipments: JSON.parse(JSON.stringify(sampleShipments)),
  carriers: [...sampleCarriers],
};

// ───────────────────────────────────────────────
// HELPERS UI
// ───────────────────────────────────────────────

function show(id: string, data: unknown): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

function fillTextarea(id: string, data: unknown): void {
  const el = document.getElementById(id) as HTMLTextAreaElement | null;
  if (el) el.value = JSON.stringify(data, null, 2);
}

function showSampleData(): void {
  fillTextarea('sampleProducts', state.products);
  fillTextarea('sampleShipments', state.shipments);
  fillTextarea('sampleCarriers', state.carriers);
}

function applyDataChanges(): void {
  try {
    const newProducts = JSON.parse((document.getElementById('sampleProducts') as HTMLTextAreaElement).value);
    const newShipments = JSON.parse((document.getElementById('sampleShipments') as HTMLTextAreaElement).value);
    const newCarriers = JSON.parse((document.getElementById('sampleCarriers') as HTMLTextAreaElement).value);

    state.products.length = 0;
    state.shipments.length = 0;
    state.carriers.length = 0;
    state.products.push(...newProducts);
    state.shipments.push(...newShipments);
    state.carriers.push(...newCarriers);

    fillTextarea('sampleProducts', state.products);
    fillTextarea('sampleShipments', state.shipments);
    fillTextarea('sampleCarriers', state.carriers);

    const status = document.getElementById('dataStatus');
    if (status) {
      status.textContent = '✅ Datos actualizados correctamente';
      status.className = 'text-xs text-emerald-600 font-medium';
    }
  } catch (e: unknown) {
    const status = document.getElementById('dataStatus');
    if (status) {
      status.textContent = '❌ Error de JSON: ' + (e instanceof Error ? e.message : String(e));
      status.className = 'text-xs text-red-600 font-medium';
    }
  }
}

// ───────────────────────────────────────────────
// MANEJADORES — Asignados al objeto window para
// poder usarlos desde onclick en el HTML
// ───────────────────────────────────────────────

(window as unknown as Record<string, unknown>).runFilterByWarehouse = (): void => {
  const wh = (document.getElementById('warehouseSelect') as HTMLSelectElement).value;
  const res = filterProductsByWarehouse(state.products, wh as any);
  show('resultWarehouse', res.length ? res : '❌ Ningún producto encontrado');
};

(window as unknown as Record<string, unknown>).runFilterByCategory = (): void => {
  const cat = (document.getElementById('categorySelect') as HTMLSelectElement).value;
  const res = filterProductsByCategory(state.products, cat as any);
  show('resultCategory', res.length ? res : '❌ Ningún producto encontrado');
};

(window as unknown as Record<string, unknown>).runLowStock = (): void => {
  const res = filterLowStockProducts(state.products);
  show('resultLowStock', res.length ? res : '✅ Ningún producto con stock bajo');
};

(window as unknown as Record<string, unknown>).runSortByStock = (): void => {
  const order = (document.getElementById('stockOrder') as HTMLSelectElement).value as 'asc' | 'desc';
  const res = sortProductsByStock(state.products, order);
  show('resultSortStock', res.length ? res : '❌ Sin resultados');
};

(window as unknown as Record<string, unknown>).runSortCarriers = (): void => {
  const order = (document.getElementById('reliabilityOrder') as HTMLSelectElement).value as 'asc' | 'desc';
  const res = sortCarriersByReliability(state.carriers, order);
  show('resultSortCarriers', res.length ? res : '❌ Sin resultados');
};

(window as unknown as Record<string, unknown>).runFindBySKU = (): void => {
  const sku = (document.getElementById('skuInput') as HTMLInputElement).value;
  const res = findProductBySKU(state.products, sku);
  show('resultSKU', res ?? '❌ Producto no encontrado');
};

(window as unknown as Record<string, unknown>).runFindShipmentById = (): void => {
  const id = (document.getElementById('shipmentIdInput') as HTMLInputElement).value;
  const res = findShipmentById(state.shipments, id);
  show('resultShipmentId', res ?? '❌ Envío no encontrado');
};

(window as unknown as Record<string, unknown>).runBinarySearch = (): void => {
  const target = parseFloat((document.getElementById('weightInput') as HTMLInputElement).value);
  const sorted = [...state.products].sort((a, b) => a.weightKg - b.weightKg);
  const idx = binarySearchProductByWeight(sorted, target);
  show('resultBinary', idx !== -1
    ? `✅ Peso ${target} kg encontrado en índice ${idx}: ${JSON.stringify(sorted[idx], null, 2)}`
    : `❌ Peso ${target} kg no encontrado (índice -1)`);
};

(window as unknown as Record<string, unknown>).runScoreCarrier = (): void => {
  const results = state.carriers.map(c => ({
    carrier: c.name,
    score: scoreCarrierForShipment(c, state.shipments[0], state.products[1]),
  }));
  show('resultScore', results);
};

(window as unknown as Record<string, unknown>).runSelectBest = (): void => {
  const res = selectBestCarrier(state.carriers, state.shipments[0], state.products[1]);
  show('resultBest', res ?? '❌ Ningún transportista adecuado');
};

(window as unknown as Record<string, unknown>).runCountByCategory = (): void => {
  show('resultCountCategory', countProductsByCategory(state.products));
};

(window as unknown as Record<string, unknown>).runInventoryValue = (): void => {
  const value = calculateTotalInventoryValue(state.products);
  show('resultInventory', `💰 $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
};

(window as unknown as Record<string, unknown>).runAvgDistance = (): void => {
  show('resultAvgDist', `📏 ${calculateAverageShipmentDistance(state.shipments)} km`);
};

(window as unknown as Record<string, unknown>).runGroupByStatus = (): void => {
  show('resultGroupStatus', groupShipmentsByStatus(state.shipments));
};

(window as unknown as Record<string, unknown>).runTopCarriers = (): void => {
  const n = parseInt((document.getElementById('topNInput') as HTMLInputElement).value) || 3;
  show('resultTopCarriers', getTopCarriers(state.shipments, n));
};

(window as unknown as Record<string, unknown>).runValidateProduct = (): void => {
  show('resultValidProduct', validateProduct(state.products[0]));
};

(window as unknown as Record<string, unknown>).runValidateShipment = (): void => {
  show('resultValidShipment', validateShipment(state.shipments[0]));
};

(window as unknown as Record<string, unknown>).runValidateCarrier = (): void => {
  show('resultValidCarrier', validateCarrier(state.carriers[0]));
};

(window as unknown as Record<string, unknown>).applyDataChanges = applyDataChanges;

// ════════════════════════════════════════════════
//  AUTH — Expuestas al ámbito global para HTML
// ════════════════════════════════════════════════

(window as unknown as Record<string, unknown>).login = login;
(window as unknown as Record<string, unknown>).register = register;
(window as unknown as Record<string, unknown>).logout = logout;
(window as unknown as Record<string, unknown>).getToken = getToken;
(window as unknown as Record<string, unknown>).clearToken = clearToken;
(window as unknown as Record<string, unknown>).getAuthHeaders = getAuthHeaders;
(window as unknown as Record<string, unknown>).requireAuth = requireAuth;
(window as unknown as Record<string, unknown>).handleAuthError = handleAuthError;
(window as unknown as Record<string, unknown>).getAuthMe = getAuthMe;
(window as unknown as Record<string, unknown>).getProfile = getProfile;
(window as unknown as Record<string, unknown>).updateProfile = updateProfile;

// ───────────────────────────────────────────────
// Helper: getTopCarriers (usa findTopCarriers internamente)
// ───────────────────────────────────────────────

function getTopCarriers(shipments: Shipment[], topN: number): unknown {
  const result = findTopCarriers(shipments, topN);
  if (result.length === 0) {
    return '❌ Ningún envío tiene un transportista asignado. Asigna un carrier a los envíos para ver el ranking.';
  }
  return result;
}

// ───────────────────────────────────────────────
// Inicializar datos al cargar
// ───────────────────────────────────────────────

showSampleData();