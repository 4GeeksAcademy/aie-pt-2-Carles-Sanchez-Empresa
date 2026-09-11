/**
 * inventory-manager.js — Gestor de Inventario TrackFlow.
 *
 * Cuatro vistas en un solo HTML (tabs):
 *   1. Stock — tabla de productos con indicadores de nivel de stock
 *   2. Entrada (Inbound) — formulario de recepción de mercancía
 *   3. Salida (Outbound) — formulario de despacho/pérdida con stock reactivo
 *   4. Historial (Orders) — listado de solo lectura de todos los movimientos
 *
 * Dependencias: Tailwind CSS CDN (cargado en HTML).
 * Autenticación: JWT en localStorage (trackflow_token).
 *
 * ═════════════════════════════════════════════════════════════════════
 *  Umbrales de indicadores visuales de stock (documentados):
 *  - current_stock === 0  → 🔴 Rojo    "Sin stock"
 *  - 1–10                 → 🟡 Amarillo "Stock bajo"
 *  - > 10                 → 🟢 Verde    "Stock OK"
 * ═════════════════════════════════════════════════════════════════════
 */

"use strict";

// ──────────────────────────── Constantes ────────────────────────────

const API_BASE = "/inventory";

// Umbrales de stock (documentados)
const STOCK_THRESHOLDS = {
  OUT: 0,       // current_stock === 0 → Sin stock
  LOW: 10,      // 1–10 → Stock bajo
  // > 10 → Stock OK
};

const CATEGORY_OPTIONS = [
  { value: "", labelKey: "inv.stock.all", labelDefault: "Todas" },
  { value: "fashion", labelKey: null, labelDefault: "Moda" },
  { value: "electronics", labelKey: null, labelDefault: "Electrónica" },
  { value: "cosmetics", labelKey: null, labelDefault: "Cosmética" },
];

const WAREHOUSE_OPTIONS = [
  { value: "", labelKey: "inv.stock.all", labelDefault: "Todos" },
  { value: "LA", labelKey: null, labelDefault: "Los Ángeles (LA)" },
  { value: "ZGZ", labelKey: null, labelDefault: "Zaragoza (ZGZ)" },
];

const EXIT_TYPE_OPTIONS = [
  { value: "dispatch", labelKey: "inv.outbound.type_dispatch", labelDefault: "Despacho" },
  { value: "loss", labelKey: "inv.outbound.type_loss", labelDefault: "Pérdida" },
];

// ──────────────────────────── Utilidades ────────────────────────────

function getToken() {
  try {
    return localStorage.getItem("trackflow_token");
  } catch (e) {
    console.warn("[inventory] localStorage no disponible al leer token", e);
    return null;
  }
}

/**
 * apiFetch — wrapper centralizado para todas las llamadas a la API de inventario.
 *
 * - Añade cabecera Authorization: Bearer <token>
 * - Añade Content-Type: application/json
 * - Parsea JSON de respuesta
 * - Si !res.ok, extrae data.detail y lanza Error con mensaje legible
 * - Nunca fallo silencioso: el mensaje de error siempre se propaga al caller
 */
async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!options.noJson) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.detail || `Error ${res.status}`;
    const err = new Error(detail);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function logout() {
  try {
    localStorage.removeItem("trackflow_token");
  } catch (e) {}
  window.location.href = "/login";
}
window.logout = logout;

// ──────────────────────────── Traducción inline (fallback si i18n no ha cargado) ────────────────────────────
// NOTA: No usar "function __" porque colisiona con window.__ de i18n.js

function _t(key, fallback) {
  if (typeof window.__ === "function") {
    const translated = window.__(key);
    if (translated && translated !== key) return translated;
  }
  return fallback || key;
}

// ──────────────────────────── Módulo de integración con la API ────────────────────────────

/**
 * InventoryAPI — Capa de integración con la API de inventario.
 *
 * Ningún componente llama a fetch directamente. Todas las llamadas pasan
 * por este módulo, que centraliza la URL base, el token y el manejo de errores.
 */
const InventoryAPI = {
  /**
   * GET /inventory/products
   * Lista todos los SKUs con su current_stock calculado.
   * @param {Object} opts
   * @param {string} [opts.warehouse] - Filtrar por "LA" o "ZGZ"
   * @param {string} [opts.category] - Filtrar por "fashion", "electronics", "cosmetics"
   * @returns {Promise<Array>} Lista de SKUResponse
   */
  async listProducts({ warehouse, category } = {}) {
    const params = new URLSearchParams();
    if (warehouse) params.set("warehouse", warehouse);
    if (category) params.set("category", category);
    const qs = params.toString();
    const url = `${API_BASE}/products${qs ? `?${qs}` : ""}`;
    return apiFetch(url);
  },

  /**
   * POST /inventory/orders/inbound
   * Registra una recepción de mercancía (StockEntry).
   * @param {Object} payload - { sku_id, quantity, reference, warehouse }
   * @returns {Promise<Object>} StockEntryResponse
   */
  async createInboundOrder(payload) {
    return apiFetch(`${API_BASE}/orders/inbound`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /inventory/orders/outbound
   * Registra un despacho o pérdida (StockExit).
   * @param {Object} payload - { sku_id, quantity, exit_type, tracking_number?, warehouse }
   * @returns {Promise<Object>} StockExitResponse
   */
  async createOutboundOrder(payload) {
    return apiFetch(`${API_BASE}/orders/outbound`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /inventory/orders
   * Lista todos los movimientos de stock con datos del SKU.
   * @param {Object} opts
   * @param {string} [opts.warehouse] - Filtrar por almacén
   * @returns {Promise<Array>} Lista de MovementResponse
   */
  async listOrders({ warehouse } = {}) {
    const params = new URLSearchParams();
    if (warehouse) params.set("warehouse", warehouse);
    const qs = params.toString();
    const url = `${API_BASE}/orders${qs ? `?${qs}` : ""}`;
    return apiFetch(url);
  },
};

// ──────────────────────────── Tabs ────────────────────────────

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add("active");
  document.getElementById(`panel-${tab}`).classList.add("active");

  // Cargar datos al cambiar a cada tab
  if (tab === "stock") loadStock();
  if (tab === "inbound") loadInboundForm();
  if (tab === "outbound") loadOutboundForm();
  if (tab === "orders") loadOrders();
}
window.switchTab = switchTab;

// ──────────────────────────── Helpers de UI ────────────────────────────

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.classList.remove("hidden");
  }
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = "";
    el.classList.add("hidden");
  }
}

function showSuccess(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.classList.remove("hidden");
  }
}

function setLoading(buttonId, textId, spinnerId, loading) {
  const btn = document.getElementById(buttonId);
  const text = document.getElementById(textId);
  const spinner = document.getElementById(spinnerId);
  if (btn) btn.disabled = loading;
  if (text) text.classList.toggle("hidden", loading);
  if (spinner) spinner.classList.toggle("hidden", !loading);
}

function getStockLevel(currentStock) {
  if (currentStock <= STOCK_THRESHOLDS.OUT) return "out";
  if (currentStock <= STOCK_THRESHOLDS.LOW) return "low";
  return "ok";
}

/**
 * Devuelve clases CSS para el indicador de stock según el nivel.
 * current_stock === 0 → rojo, 1–10 → amarillo, > 10 → verde
 */
function getStockClasses(currentStock) {
  const level = getStockLevel(currentStock);
  switch (level) {
    case "out":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        badge: "bg-red-200 text-red-900",
        labelKey: "inv.stock.status_out",
        labelDefault: "Sin stock",
      };
    case "low":
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        badge: "bg-yellow-200 text-yellow-900",
        labelKey: "inv.stock.status_low",
        labelDefault: "Stock bajo",
      };
    default:
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        badge: "bg-green-200 text-green-900",
        labelKey: "inv.stock.status_ok",
        labelDefault: "Stock OK",
      };
  }
}

// ──────────────────────────── 1. Vista Stock ────────────────────────────

let _allProducts = []; // Cache para uso en otros tabs

async function loadStock() {
  const tbody = document.getElementById("stockTableBody");
  const loading = document.getElementById("stockLoading");
  const empty = document.getElementById("stockEmpty");
  const error = document.getElementById("stockError");
  const table = document.getElementById("stockTable");

  // Ocultar resultados previos
  table.classList.add("hidden");
  empty.classList.add("hidden");
  error.classList.add("hidden");
  loading.classList.remove("hidden");
  tbody.innerHTML = "";

  // Leer filtros
  const warehouse = document.getElementById("filterWarehouse").value;
  const category = document.getElementById("filterCategory").value;

  try {
    const products = await InventoryAPI.listProducts({ warehouse, category });
    _allProducts = products; // Actualizar cache global

    loading.classList.add("hidden");

    if (products.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    table.classList.remove("hidden");

    products.forEach((p) => {
      const stockInfo = getStockClasses(p.current_stock);
      const tr = document.createElement("tr");
      tr.className = `border-b border-gray-100 hover:bg-gray-50 transition ${stockInfo.bg}`;

      tr.innerHTML = `
        <td class="px-4 py-3 text-sm font-mono text-gray-600">${escapeHtml(p.sku_code)}</td>
        <td class="px-4 py-3 text-sm font-medium text-gray-900">${escapeHtml(p.name)}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(p.client_name)}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(p.category)}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(p.warehouse)}</td>
        <td class="px-4 py-3 text-sm font-semibold ${stockInfo.text}">
          <span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold ${stockInfo.badge}">
            ${p.current_stock}
          </span>
          <span class="text-xs ml-1">${_t(stockInfo.labelKey, stockInfo.labelDefault)}</span>
        </td>
        <td class="px-4 py-3 text-sm">
          <div class="flex gap-1">
            <button onclick="selectProductForInbound(${p.id})"
                    class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-medium transition"
                    title="${_t("inv.stock.btn_inbound", "Crear entrada")}">
              📥 ${_t("inv.stock.btn_inbound", "Entrada")}
            </button>
            <button onclick="selectProductForOutbound(${p.id})"
                    class="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded text-xs font-medium transition"
                    title="${_t("inv.stock.btn_outbound", "Crear salida")}">
              📤 ${_t("inv.stock.btn_outbound", "Salida")}
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    loading.classList.add("hidden");
    showError("stockError", `${_t("inv.error_load", "Error al cargar los datos.")} ${err.message}`);
  }
}
window.loadStock = loadStock;

// Navegación rápida desde la tabla de stock
function selectProductForInbound(skuId) {
  // Guardar para preseleccionar en el formulario de entrada
  window._preselectSkuId = skuId;
  switchTab("inbound");
}

function selectProductForOutbound(skuId) {
  window._preselectSkuId = skuId;
  switchTab("outbound");
}

window.selectProductForInbound = selectProductForInbound;
window.selectProductForOutbound = selectProductForOutbound;

// ──────────────────────────── 2. Vista Entrada (Inbound) ────────────────────────────

async function loadInboundForm() {
  const select = document.getElementById("inboundProductSelect");
  const loading = document.getElementById("inboundFormLoading");

  // Ocultar mensajes previos
  hideError("inboundError");
  hideError("inboundSuccess");
  hideError("inboundFormError");

  // Si ya hay productos cargados y el select tiene opciones, no recargar
  // a menos que esté vacío o necesitemos preseleccionar
  if (select.options.length > 1 && !window._preselectSkuId) return;

  select.innerHTML = `<option value="">${_t("inv.inbound.select_product", "Seleccionar producto...")}</option>`;
  loading.classList.remove("hidden");

  try {
    // Si no tenemos productos en cache, cargarlos
    if (_allProducts.length === 0) {
      _allProducts = await InventoryAPI.listProducts();
    }
    loading.classList.add("hidden");

    _allProducts.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.sku_code}) — ${p.warehouse}`;
      select.appendChild(opt);
    });

    // Preseleccionar si venimos desde la tabla de stock
    if (window._preselectSkuId) {
      select.value = String(window._preselectSkuId);
      window._preselectSkuId = null;
    }
  } catch (err) {
    loading.classList.add("hidden");
    showError("inboundFormError", `${_t("inv.error_load", "Error al cargar los datos.")} ${err.message}`);
  }
}

async function handleInboundSubmit(event) {
  event.preventDefault();
  hideError("inboundError");
  hideError("inboundSuccess");

  const sku_id = parseInt(document.getElementById("inboundProductSelect").value, 10);
  const quantity = parseInt(document.getElementById("inboundQuantity").value, 10);
  const reference = document.getElementById("inboundReference").value.trim();
  const warehouse = document.getElementById("inboundWarehouse").value;

  // Validación cliente
  if (!sku_id) {
    showError("inboundError", _t("inv.inbound.error_product", "Selecciona un producto."));
    return;
  }
  if (!quantity || quantity < 1) {
    showError("inboundError", _t("inv.inbound.error_quantity", "La cantidad debe ser mayor a 0."));
    return;
  }
  if (!reference) {
    showError("inboundError", _t("inv.inbound.error_reference", "La referencia es obligatoria."));
    return;
  }
  if (!warehouse) {
    showError("inboundError", _t("inv.inbound.error_warehouse", "Selecciona un almacén."));
    return;
  }

  setLoading("btnInboundSubmit", "btnInboundSubmitText", "btnInboundSubmitSpinner", true);

  try {
    await InventoryAPI.createInboundOrder({ sku_id, quantity, reference, warehouse });

    // Éxito: limpiar formulario y mostrar confirmación
    document.getElementById("inboundForm").reset();
    showSuccess("inboundSuccess", _t("inv.inbound.success", "✅ Entrada registrada correctamente"));
    // Recargar cache de productos para stock actualizado
    _allProducts = [];
  } catch (err) {
    // Error 400/500: mostrar mensaje legible de la API
    showError("inboundError", err.message);
  } finally {
    setLoading("btnInboundSubmit", "btnInboundSubmitText", "btnInboundSubmitSpinner", false);
  }
}
window.handleInboundSubmit = handleInboundSubmit;

// ──────────────────────────── 3. Vista Salida (Outbound) ────────────────────────────

async function loadOutboundForm() {
  const select = document.getElementById("outboundProductSelect");
  const loading = document.getElementById("outboundFormLoading");

  hideError("outboundError");
  hideError("outboundSuccess");
  hideError("outboundFormError");
  hideError("outboundStockWarning");

  if (select.options.length > 1 && !window._preselectSkuId) return;

  select.innerHTML = `<option value="">${_t("inv.outbound.select_product", "Seleccionar producto...")}</option>`;
  loading.classList.remove("hidden");

  try {
    if (_allProducts.length === 0) {
      _allProducts = await InventoryAPI.listProducts();
    }
    loading.classList.add("hidden");

    _allProducts.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.dataset.stock = p.current_stock;
      opt.textContent = `${p.name} (${p.sku_code}) — ${p.warehouse} [Stock: ${p.current_stock}]`;
      select.appendChild(opt);
    });

    if (window._preselectSkuId) {
      select.value = String(window._preselectSkuId);
      window._preselectSkuId = null;
      onOutboundProductChange();
    }
  } catch (err) {
    loading.classList.add("hidden");
    showError("outboundFormError", `${_t("inv.error_load", "Error al cargar los datos.")} ${err.message}`);
  }
}

/**
 * onOutboundProductChange — Muestra el stock disponible del producto seleccionado
 * de forma reactiva. Se actualiza al cambiar el selector de producto.
 * Requisito del brief: mostrar stock disponible antes de enviar.
 */
function onOutboundProductChange() {
  const select = document.getElementById("outboundProductSelect");
  const stockDisplay = document.getElementById("outboundStockDisplay");
  const quantityInput = document.getElementById("outboundQuantity");
  const warning = document.getElementById("outboundStockWarning");
  const trackingGroup = document.getElementById("outboundTrackingGroup");
  const exitType = document.getElementById("outboundExitType").value;

  const selectedOption = select.options[select.selectedIndex];
  hideError("outboundStockWarning");
  hideError("outboundError");

  // Mostrar/ocultar tracking según tipo
  trackingGroup.classList.toggle("hidden", exitType !== "dispatch");

  if (!selectedOption || !selectedOption.value) {
    stockDisplay.classList.add("hidden");
    return;
  }

  const currentStock = parseInt(selectedOption.dataset.stock, 10);
  stockDisplay.classList.remove("hidden");

  // Mostrar stock disponible (bilingüe: el texto se traduce)
  const stockLabel = _t("inv.outbound.stock_label", "Stock disponible");
  stockDisplay.innerHTML = `📦 <strong>${stockLabel}: ${currentStock} ${_t("inv.outbound.units", "unidades")}</strong>`;

  // Validar cantidad si ya hay un valor escrito
  const quantity = parseInt(quantityInput.value, 10);
  if (quantity > 0) {
    validateOutboundQuantity(quantity, currentStock);
  }
}
window.onOutboundProductChange = onOutboundProductChange;

/**
 * onOutboundExitTypeChange — Muestra/oculta el campo de tracking según el tipo.
 */
function onOutboundExitTypeChange() {
  const exitType = document.getElementById("outboundExitType").value;
  const trackingGroup = document.getElementById("outboundTrackingGroup");
  trackingGroup.classList.toggle("hidden", exitType !== "dispatch");
  hideError("outboundError");
}
window.onOutboundExitTypeChange = onOutboundExitTypeChange;

/**
 * onOutboundQuantityChange — Valida que la cantidad no supere el stock disponible.
 * Muestra advertencia en el cliente antes de enviar (salvaguarda de UX).
 */
function onOutboundQuantityChange() {
  const select = document.getElementById("outboundProductSelect");
  const quantityInput = document.getElementById("outboundQuantity");
  const warning = document.getElementById("outboundStockWarning");

  const selectedOption = select.options[select.selectedIndex];
  if (!selectedOption || !selectedOption.value) return;

  const currentStock = parseInt(selectedOption.dataset.stock, 10);
  const quantity = parseInt(quantityInput.value, 10);

  validateOutboundQuantity(quantity, currentStock);
}
window.onOutboundQuantityChange = onOutboundQuantityChange;

function validateOutboundQuantity(quantity, currentStock) {
  const warning = document.getElementById("outboundStockWarning");
  const submitBtn = document.getElementById("btnOutboundSubmit");

  if (quantity > 0 && quantity > currentStock) {
    const msg = _t("inv.outbound.warning_exceeds", "La cantidad supera el stock disponible")
      + ` (${currentStock} ${_t("inv.outbound.units", "unidades")}).`;
    warning.textContent = "⚠️ " + msg;
    warning.classList.remove("hidden");
    submitBtn.disabled = true;
    return false;
  } else {
    warning.classList.add("hidden");
    submitBtn.disabled = false;
    return true;
  }
}

async function handleOutboundSubmit(event) {
  event.preventDefault();
  hideError("outboundError");
  hideError("outboundSuccess");

  const sku_id = parseInt(document.getElementById("outboundProductSelect").value, 10);
  const exit_type = document.getElementById("outboundExitType").value;
  const quantity = parseInt(document.getElementById("outboundQuantity").value, 10);
  const tracking_number = document.getElementById("outboundTracking").value.trim() || null;
  const warehouse = document.getElementById("outboundWarehouse").value;

  // Validación cliente
  if (!sku_id) {
    showError("outboundError", _t("inv.outbound.error_product", "Selecciona un producto."));
    return;
  }
  if (!quantity || quantity < 1) {
    showError("outboundError", _t("inv.outbound.error_quantity", "La cantidad debe ser mayor a 0."));
    return;
  }
  if (exit_type === "dispatch" && !tracking_number) {
    showError("outboundError", _t("inv.outbound.error_tracking", "El número de seguimiento es obligatorio para despachos."));
    return;
  }
  if (!warehouse) {
    showError("outboundError", _t("inv.outbound.error_warehouse", "Selecciona un almacén."));
    return;
  }

  // Doble check de stock antes de enviar
  const select = document.getElementById("outboundProductSelect");
  const selectedOption = select.options[select.selectedIndex];
  const currentStock = parseInt(selectedOption.dataset.stock, 10);
  if (quantity > currentStock) {
    showError("outboundError",
      _t("inv.outbound.warning_exceeds", "La cantidad supera el stock disponible")
      + ` (${currentStock} ${_t("inv.outbound.units", "unidades")}).`);
    return;
  }

  setLoading("btnOutboundSubmit", "btnOutboundSubmitText", "btnOutboundSubmitSpinner", true);

  try {
    await InventoryAPI.createOutboundOrder({
      sku_id,
      quantity,
      exit_type,
      tracking_number: exit_type === "dispatch" ? tracking_number : null,
      warehouse,
    });

    // Éxito
    document.getElementById("outboundForm").reset();
    document.getElementById("outboundStockDisplay").classList.add("hidden");
    document.getElementById("outboundTrackingGroup").classList.add("hidden");
    showSuccess("outboundSuccess", _t("inv.outbound.success", "✅ Salida registrada correctamente"));
    _allProducts = [];
  } catch (err) {
    // Error 400 (stock insuficiente u otros): mostrar mensaje inline
    showError("outboundError", err.message);
  } finally {
    setLoading("btnOutboundSubmit", "btnOutboundSubmitText", "btnOutboundSubmitSpinner", false);
  }
}
window.handleOutboundSubmit = handleOutboundSubmit;

// ──────────────────────────── 4. Vista Historial (Orders) ────────────────────────────

async function loadOrders() {
  const tbody = document.getElementById("ordersTableBody");
  const loading = document.getElementById("ordersLoading");
  const empty = document.getElementById("ordersEmpty");
  const error = document.getElementById("ordersError");
  const table = document.getElementById("ordersTable");

  table.classList.add("hidden");
  empty.classList.add("hidden");
  error.classList.add("hidden");
  loading.classList.remove("hidden");
  tbody.innerHTML = "";

  const warehouse = document.getElementById("filterOrdersWarehouse").value;

  try {
    const orders = await InventoryAPI.listOrders({ warehouse });
    loading.classList.add("hidden");

    if (orders.length === 0) {
      empty.classList.remove("hidden");
      return;
    }

    table.classList.remove("hidden");

    orders.forEach((o) => {
      const isInbound = o.type === "inbound";
      const icon = isInbound ? "📥" : "📤";
      const typeKey = isInbound ? "inv.orders.type_inbound" : "inv.orders.type_outbound";
      const typeDefault = isInbound ? "Entrada" : "Salida";
      const rowBg = isInbound ? "bg-green-50/50" : "bg-orange-50/50";
      const refDisplay = o.reference_or_exit || "—";

      const tr = document.createElement("tr");
      tr.className = `border-b border-gray-100 hover:bg-gray-50 transition ${rowBg}`;

      tr.innerHTML = `
        <td class="px-4 py-3 text-xs text-gray-500 font-mono">${formatDate(o.created_at)}</td>
        <td class="px-4 py-3 text-sm">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
            ${isInbound ? "bg-green-200 text-green-900" : "bg-orange-200 text-orange-900"}">
            ${icon} ${_t(typeKey, typeDefault)}
          </span>
        </td>
        <td class="px-4 py-3 text-sm font-medium text-gray-900">${escapeHtml(o.sku_name || "—")}</td>
        <td class="px-4 py-3 text-xs font-mono text-gray-500">${escapeHtml(o.sku_code || "—")}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(o.warehouse)}</td>
        <td class="px-4 py-3 text-sm font-semibold text-gray-900">${o.quantity}</td>
        <td class="px-4 py-3 text-sm text-gray-500">${escapeHtml(refDisplay)}</td>
        <td class="px-4 py-3 text-xs font-mono text-gray-400">${escapeHtml(o.tracking_number || "—")}</td>
        <td class="px-4 py-3 text-xs font-mono text-gray-400" title="${escapeHtml(o.user_uuid)}">
          ${shortUuid(o.user_uuid)}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    loading.classList.add("hidden");
    showError("ordersError", `${_t("inv.error_load", "Error al cargar los datos.")} ${err.message}`);
  }
}
window.loadOrders = loadOrders;

// ──────────────────────────── Utilidades de formato ────────────────────────────

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return isoString;
  }
}

function shortUuid(uuid) {
  if (!uuid) return "—";
  if (uuid.length > 8) return uuid.slice(0, 8) + "…";
  return uuid;
}

// ──────────────────────────── Init ────────────────────────────

function init() {
  // Activar primer tab por defecto (stock)
  const firstTab = document.querySelector(".tab-btn");
  if (firstTab) {
    switchTab(firstTab.dataset.tab || "stock");
  }
}

// Safe init: check if DOM is already ready before adding listener
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}