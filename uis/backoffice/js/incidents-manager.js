/**
 * incidents-manager.js — Gestor Centralizado de Incidencias TrackFlow.
 *
 * Tres vistas en un solo HTML (tabs):
 *   1. Formulario de creación
 *   2. Listado con filtros y cambio de estado inline
 *   3. Resumen de métricas agregadas
 *
 * Dependencias: Tailwind CSS CDN (cargado en HTML).
 * Autenticación: JWT en localStorage (trackflow_token).
 */

"use strict";

// ──────────────────────────── Constantes ────────────────────────────

const API_BASE = "/api/incidents";

const STATUS_LABELS = {
  open: "Abierta",
  in_progress: "En progreso",
  resolved: "Resuelta",
  discarded: "Descartada",
};

function statusLabel(status) {
  const labels = {
    open: window.__ ? window.__('incmgr.status_open') : STATUS_LABELS.open,
    in_progress: window.__ ? window.__('incmgr.status_in_progress') : STATUS_LABELS.in_progress,
    resolved: window.__ ? window.__('incmgr.status_resolved') : STATUS_LABELS.resolved,
    discarded: window.__ ? window.__('incmgr.status_discarded') : STATUS_LABELS.discarded,
  };
  return labels[status] || status;
}

const STATUS_COLORS = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  discarded: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABELS = {
  lost_parcel: "📦 Paquete perdido",
  delivery_failure: "🚚 Fallo de entrega",
  inventory_discrepancy: "📋 Discrepancia inventario",
  carrier_issue: "🚛 Problema carrier",
  returns_issue: "🔄 Problema devolución",
  warehouse_incident: "🏭 Incidencia almacén",
  system_failure: "💻 Falla sistema",
  client_complaint: "📞 Queja cliente",
  other: "❓ Otro",
};

function categoryLabel(key) {
  const labels = {
    lost_parcel: window.__ ? window.__('incmgr.cat_lost_parcel') : CATEGORY_LABELS.lost_parcel,
    delivery_failure: window.__ ? window.__('incmgr.cat_delivery_failure') : CATEGORY_LABELS.delivery_failure,
    inventory_discrepancy: window.__ ? window.__('incmgr.cat_inventory_discrepancy') : CATEGORY_LABELS.inventory_discrepancy,
    carrier_issue: window.__ ? window.__('incmgr.cat_carrier_issue') : CATEGORY_LABELS.carrier_issue,
    returns_issue: window.__ ? window.__('incmgr.cat_returns_issue') : CATEGORY_LABELS.returns_issue,
    warehouse_incident: window.__ ? window.__('incmgr.cat_warehouse_incident') : CATEGORY_LABELS.warehouse_incident,
    system_failure: window.__ ? window.__('incmgr.cat_system_failure') : CATEGORY_LABELS.system_failure,
    client_complaint: window.__ ? window.__('incmgr.cat_client_complaint') : CATEGORY_LABELS.client_complaint,
    other: window.__ ? window.__('incmgr.cat_other') : CATEGORY_LABELS.other,
  };
  return labels[key] || key;
}

const ORIGIN_LABELS = {
  customer: "👤 Cliente",
  branch: "🏢 Sede",
  internal: "🔧 Interno",
};

function originLabel(key) {
  const labels = {
    customer: window.__ ? window.__('incmgr.origin_customer') : ORIGIN_LABELS.customer,
    branch: window.__ ? window.__('incmgr.origin_branch') : ORIGIN_LABELS.branch,
    internal: window.__ ? window.__('incmgr.origin_internal') : ORIGIN_LABELS.internal,
  };
  return labels[key] || key;
}

const BRANCH_LABELS = {
  central: "🏢 Central (Madrid)",
  la_warehouse: "🏭 Almacén LA",
  la_office: "🏢 Oficina LA",
  zaragoza_warehouse: "🏭 Almacén Zaragoza",
  zaragoza_office: "🏢 Oficina Zaragoza",
};

function branchLabel(key) {
  const labels = {
    central: window.__ ? window.__('incmgr.branch_central') : BRANCH_LABELS.central,
    la_warehouse: window.__ ? window.__('incmgr.branch_la_wh') : BRANCH_LABELS.la_warehouse,
    la_office: window.__ ? window.__('incmgr.branch_la_off') : BRANCH_LABELS.la_office,
    zaragoza_warehouse: window.__ ? window.__('incmgr.branch_z_wh') : BRANCH_LABELS.zaragoza_warehouse,
    zaragoza_office: window.__ ? window.__('incmgr.branch_z_off') : BRANCH_LABELS.zaragoza_office,
  };
  return labels[key] || key;
}

// ──────────────────────────── Utilidades ────────────────────────────

function getToken() {
  try {
    return localStorage.getItem("trackflow_token");
  } catch (e) {
    console.warn("[incmgr] localStorage no disponible al leer token", e);
    return null;
  }
}

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
    const err = new Error(data?.detail || `Error ${res.status}`);
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

// ──────────────────────────── Tabs ────────────────────────────

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add("active");
  document.getElementById(`panel-${tab}`).classList.add("active");

  if (tab === "list") loadList();
  if (tab === "summary") loadSummary();
}
window.switchTab = switchTab;

// ──────────────────────────── Formulario ────────────────────────────

function onOriginChange() {
  const origin = document.getElementById("fieldOrigin").value;
  const branchEl = document.getElementById("fieldBranch");

  if (origin === "branch") {
    branchEl.classList.add("origin-branch-highlight");
  } else {
    branchEl.classList.remove("origin-branch-highlight");
  }
}
window.onOriginChange = onOriginChange;

function showFieldError(fieldId, message) {
  const el = document.getElementById(`field${fieldId}Error`);
  if (el) {
    el.textContent = message;
    el.classList.remove("hidden");
  }
}

function clearFieldErrors() {
  document.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });
}

function setFormLoading(loading) {
  const btn = document.getElementById("btnSubmit");
  const text = document.getElementById("btnSubmitText");
  const spinner = document.getElementById("btnSubmitSpinner");

  btn.disabled = loading;
  text.classList.toggle("hidden", loading);
  spinner.classList.toggle("hidden", !loading);
}

async function handleSubmit(event) {
  event.preventDefault();
  clearFieldErrors();

  const successEl = document.getElementById("formSuccess");
  const errorEl = document.getElementById("formError");
  successEl.classList.add("hidden");
  errorEl.classList.add("hidden");

  const payload = {
    title: document.getElementById("fieldTitle").value.trim(),
    description: document.getElementById("fieldDescription").value.trim(),
    category: document.getElementById("fieldCategory").value,
    origin: document.getElementById("fieldOrigin").value,
    branch: document.getElementById("fieldBranch").value,
  };

  // Validación rápida del lado cliente
  if (!payload.title) {
    showFieldError("Title", window.__ ? window.__('incmgr.error_title_required') : "El título es obligatorio");
    return;
  }
  if (payload.description.length < 5) {
    showFieldError("Description", window.__ ? window.__('incmgr.error_desc_length') : "La descripción debe tener al menos 5 caracteres");
    return;
  }
  if (!payload.category) {
    showFieldError("Category", window.__ ? window.__('incmgr.error_category_required') : "Selecciona una categoría");
    return;
  }
  if (!payload.origin) {
    showFieldError("Origin", window.__ ? window.__('incmgr.error_origin_required') : "Selecciona un origen");
    return;
  }
  if (!payload.branch) {
    showFieldError("Branch", window.__ ? window.__('incmgr.error_branch_required') : "Selecciona una sede");
    return;
  }

  setFormLoading(true);

  try {
    await apiFetch(API_BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Éxito: limpiar formulario y mostrar mensaje
    document.getElementById("incidentForm").reset();
    document.getElementById("fieldBranch").classList.remove("origin-branch-highlight");

    successEl.textContent = window.__ ? window.__('incmgr.success_created') : "✅ Incidencia registrada correctamente";
    successEl.classList.remove("hidden");

    // Ocultar mensaje tras 4 segundos
    setTimeout(() => successEl.classList.add("hidden"), 4000);
  } catch (err) {
    if (err.data && Array.isArray(err.data)) {
      // Errores de validación por campo
      err.data.forEach((item) => {
        const fieldName = item.field.charAt(0).toUpperCase() + item.field.slice(1);
        showFieldError(fieldName, item.error);
      });
    } else if (err.data && err.data.detail) {
      errorEl.textContent = `❌ ${err.data.detail}`;
      errorEl.classList.remove("hidden");
    } else {
      errorEl.textContent = window.__ ? window.__('incmgr.error_save') : "❌ Error al guardar la incidencia. Inténtalo de nuevo.";
      errorEl.classList.remove("hidden");
    }
  } finally {
    setFormLoading(false);
  }

  return false;
}
window.handleSubmit = handleSubmit;

// ──────────────────────────── Listado ────────────────────────────

function statusBadge(status) {
  const label = statusLabel(status);
  const color = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return `<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}">${label}</span>`;
}

async function updateStatusInline(id, newStatus, rowEl) {
  const oldHtml = rowEl.innerHTML;

  try {
    rowEl.innerHTML = `<td colspan="7" class="py-3 text-center text-gray-500"><span class="spinner mr-2"></span>${window.__ ? window.__('incmgr.updating_status') : 'Actualizando...'}</td>`;

    await apiFetch(`${API_BASE}/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });

    // Recargar la lista para reflejar cambios
    loadList();
  } catch (err) {
    // Rollback visual
    rowEl.innerHTML = oldHtml;
    let msg = window.__ ? window.__('incmgr.error_updating') : "Error al actualizar el estado";
    if (err.data && Array.isArray(err.data)) {
      msg = err.data.map((e) => e.error).join("; ");
    } else if (err.data && err.data.detail) {
      msg = err.data.detail;
    }
    showErrorToast(msg);
  }
}

/** Muestra un toast de error con auto-ocultación */
function showErrorToast(message) {
  let toast = document.getElementById("errorToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "errorToast";
    toast.className = "fixed bottom-4 right-4 z-50 max-w-md rounded-lg border border-red-300 bg-red-50 p-4 shadow-lg";
    toast.style.cssText = "position:fixed;bottom:1rem;right:1rem;z-index:9999;max-width:24rem;border-radius:0.5rem;border:1px solid #fca5a5;background:#fef2f2;padding:1rem;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<div style="display:flex;align-items:flex-start;gap:0.75rem;">
    <span style="flex-shrink:0;color:#ef4444;">❌</span>
    <div style="flex:1;min-width:0;">
      <p style="margin:0;font-size:0.875rem;font-weight:600;color:#991b1b;">Error</p>
      <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#b91c1c;">${message}</p>
    </div>
    <button onclick="this.closest('#errorToast').style.display='none'" style="flex-shrink:0;border:none;background:transparent;color:#f87171;cursor:pointer;" aria-label="Cerrar">✕</button>
  </div>`;
  toast.style.display = "block";

  // Auto-ocultar tras 6 segundos
  if (window._errorToastTimer) clearTimeout(window._errorToastTimer);
  window._errorToastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 6000);
}

async function loadList() {
  const loadingEl = document.getElementById("listLoading");
  const errorEl = document.getElementById("listError");
  const emptyEl = document.getElementById("listEmpty");
  const wrapper = document.getElementById("listTableWrapper");
  const body = document.getElementById("listBody");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  wrapper.classList.add("hidden");

  const params = new URLSearchParams();
  const status = document.getElementById("listFilterStatus").value;
  const origin = document.getElementById("listFilterOrigin").value;
  const branch = document.getElementById("listFilterBranch").value;
  if (status) params.set("status", status);
  if (origin) params.set("origin", origin);
  if (branch) params.set("branch", branch);

  try {
    const data = await apiFetch(`${API_BASE}?${params.toString()}`);

    if (!data || data.length === 0) {
      emptyEl.classList.remove("hidden");
      loadingEl.classList.add("hidden");
      return;
    }

    body.innerHTML = data
      .map((inc) => {
        const catLabel = categoryLabel(inc.category);
        const originLabelText = originLabel(inc.origin);
        const branchLabelText = branchLabel(inc.branch);

        // Opciones de transición de estado
        let statusActions = "";
        if (inc.status === "open") {
          statusActions = `
            <button onclick="updateStatusInline(${inc.id}, 'in_progress', this.closest('tr'))"
                    class="text-blue-600 hover:text-blue-800 text-xs font-medium mr-2">${window.__ ? window.__('incmgr.action_start') : 'Iniciar'}</button>
            <button onclick="updateStatusInline(${inc.id}, 'discarded', this.closest('tr'))"
                    class="text-red-600 hover:text-red-800 text-xs font-medium">${window.__ ? window.__('incmgr.action_discard') : 'Descartar'}</button>
          `;
        } else if (inc.status === "in_progress") {
          statusActions = `
            <button onclick="updateStatusInline(${inc.id}, 'resolved', this.closest('tr'))"
                    class="text-green-600 hover:text-green-800 text-xs font-medium mr-2">${window.__ ? window.__('incmgr.action_resolve') : 'Resolver'}</button>
            <button onclick="updateStatusInline(${inc.id}, 'discarded', this.closest('tr'))"
                    class="text-red-600 hover:text-red-800 text-xs font-medium">${window.__ ? window.__('incmgr.action_discard') : 'Descartar'}</button>
          `;
        } else {
          statusActions = `<span class="text-xs text-gray-400 italic">${window.__ ? window.__('incmgr.final_status') : 'Estado final'}</span>`;
        }

        return `<tr class="border-b border-gray-100 hover:bg-gray-50">
          <td class="py-3 pr-3 text-gray-400 font-mono text-xs">#${inc.id}</td>
          <td class="py-3 pr-3">
            <div class="font-medium text-gray-800">${escHtml(inc.title)}</div>
            <div class="text-xs text-gray-400 truncate max-w-xs">${escHtml(inc.description)}</div>
          </td>
          <td class="py-3 pr-3 text-xs text-gray-600">${catLabel}</td>
          <td class="py-3 pr-3">${statusBadge(inc.status)}</td>
          <td class="py-3 pr-3 text-xs text-gray-600">${originLabelText}</td>
          <td class="py-3 pr-3 text-xs text-gray-600">${branchLabelText}</td>
          <td class="py-3 whitespace-nowrap">${statusActions}</td>
        </tr>`;
      })
      .join("");

    wrapper.classList.remove("hidden");
  } catch (err) {
    let friendlyMsg = err.message;
    if (friendlyMsg === "Failed to fetch" || friendlyMsg.includes("NetworkError")) {
      friendlyMsg = window.__ ? window.__('incmgr.error_network') : "No se pudo conectar con el servidor. Verifica tu conexión.";
    }
    errorEl.innerHTML = `
      ❌ Error al cargar incidencias: ${escHtml(friendlyMsg)}
      <button onclick="loadList()" class="ml-3 text-sm font-medium text-blue-600 hover:text-blue-800 underline">
        Reintentar
      </button>
    `;
    errorEl.classList.remove("hidden");
  } finally {
    loadingEl.classList.add("hidden");
  }
}
window.loadList = loadList;
window.updateStatusInline = updateStatusInline;

function escHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ──────────────────────────── Resumen ────────────────────────────

async function loadSummary() {
  const loadingEl = document.getElementById("summaryLoading");
  const errorEl = document.getElementById("summaryError");
  const content = document.getElementById("summaryContent");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  content.classList.add("hidden");

  try {
    const data = await apiFetch(`${API_BASE}/summary`);

    document.getElementById("summaryTotal").textContent = data.total || 0;

    // Por estado
    renderSummaryGrid("summaryByStatus", data.by_status || {}, statusLabel);
    // Por categoría
    renderSummaryGrid("summaryByCategory", data.by_category || {}, categoryLabel);
    // Por origen
    renderSummaryGrid("summaryByOrigin", data.by_origin || {}, originLabel);
    // Por sede
    renderSummaryGrid("summaryByBranch", data.by_branch || {}, branchLabel);

    content.classList.remove("hidden");
  } catch (err) {
    let friendlyMsg = err.message;
    if (friendlyMsg === "Failed to fetch" || friendlyMsg.includes("NetworkError")) {
      friendlyMsg = window.__ ? window.__('incmgr.error_network') : "No se pudo conectar con el servidor. Verifica tu conexión.";
    }
    errorEl.innerHTML = `❌ ${window.__ ? window.__('incmgr.error_load_summary') : 'Error al cargar resumen'}: ${escHtml(friendlyMsg)}
      <button onclick="loadSummary()" class="ml-3 text-sm font-medium text-blue-600 hover:text-blue-800 underline">
        Reintentar
      </button>
    `;
    errorEl.classList.remove("hidden");
  } finally {
    loadingEl.classList.add("hidden");
  }
}
window.loadSummary = loadSummary;

function renderSummaryGrid(containerId, data, labelFn) {
  const container = document.getElementById(containerId);
  if (!container || !data) return;
  const keys = Object.keys(data);

  if (keys.length === 0) {
    container.innerHTML = `<p class="text-sm text-gray-400 col-span-full">${window.__ ? window.__('incmgr.no_data') : 'Sin datos'}</p>`;
    return;
  }

  container.innerHTML = keys
    .map((key) => {
      const label = typeof labelFn === 'function' ? labelFn(key) : (labelFn[key] || key);
      return `<div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
        <p class="text-lg font-bold text-gray-800">${data[key]}</p>
        <p class="text-xs text-gray-500 mt-0.5">${label}</p>
      </div>`;
    })
    .join("");
}