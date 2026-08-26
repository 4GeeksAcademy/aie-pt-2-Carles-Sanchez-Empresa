/**
 * incidents.js — Lógica del Analizador de Incidencias TrackFlow.
 *
 * Dependencias: TailwindCSS (CDN en HTML), app.js (autenticación)
 * La API se sirve desde el mismo origen (FastAPI sirve tanto API como frontend).
 */

// ── Proteger página ──
if (typeof requireAuth !== 'undefined') requireAuth();

// ── API base: rutas relativas (mismo servidor) ──
const API_BASE = "";

// ── API helper con autenticación ──
async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = typeof getToken !== 'undefined' ? getToken() : null;
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    if (typeof clearToken !== 'undefined') clearToken();
    if (typeof logout !== 'undefined') logout();
    else window.location.href = '/login.html?reason=session_expired';
  }
  return res;
}

// ── Estado ──
let _selectedFile = null;
let _lastResult = null;

// ── References DOM (cache) ──
const $ = (id) => document.getElementById(id);
const dropZone = $("dropZone");
const dropContent = $("dropContent");
const fileInfo = $("fileInfo");
const fileName = $("fileName");
const fileSize = $("fileSize");
const fileInput = $("fileInput");
const analyzeBtn = $("analyzeBtn");
const analyzeStatus = $("analyzeStatus");
const resultsSection = $("resultsSection");
const errorAlert = $("errorAlert");

// ─────────────────────────────────────────────
//  MANEJO DE ARCHIVO
// ─────────────────────────────────────────────

function handleFile(file) {
  if (!file) return;

  // Validar extensión
  if (!file.name.toLowerCase().endsWith(".csv")) {
    showError(window.__ ? window.__('incidents.csv_required') : "El archivo debe tener extensión .csv. Selecciona un archivo válido.");
    return;
  }

  _selectedFile = file;
  hideError();

  // Actualizar UI
  dropContent.classList.add("hidden");
  fileInfo.classList.remove("hidden");
  fileName.textContent = `📄 ${file.name}`;
  fileSize.textContent = (window.__ ? window.__('incidents.size_label') : 'Tamaño: ') + formatSize(file.size);

  analyzeBtn.disabled = false;
  analyzeStatus.textContent = window.__ ? window.__('incidents.file_loaded') : "Archivo cargado. Haz clic en «Analizar».";
  analyzeStatus.className = "text-sm text-emerald-600 font-medium";
}

function resetUpload() {
  _selectedFile = null;
  fileInput.value = "";
  dropContent.classList.remove("hidden");
  fileInfo.classList.add("hidden");
  analyzeBtn.disabled = true;
  analyzeStatus.textContent = "";
  analyzeStatus.className = "text-sm text-gray-400 italic";
  resultsSection.classList.add("hidden");
  hideError();
}

function formatSize(bytes) {
  const b = window.__ ? window.__('incidents.bytes') : ' B';
  const kb = window.__ ? window.__('incidents.kb') : ' KB';
  const mb = window.__ ? window.__('incidents.mb') : ' MB';
  if (bytes < 1024) return bytes + b;
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + kb;
  return (bytes / (1024 * 1024)).toFixed(1) + mb;
}

// ─────────────────────────────────────────────
//  ANÁLISIS (POST)
// ─────────────────────────────────────────────

async function runAnalysis() {
  if (!_selectedFile) return;

  analyzeBtn.disabled = true;
  analyzeStatus.textContent = window.__ ? window.__('incidents.analyzing_wait') : "⏳ Analizando incidencias…";
  analyzeStatus.className = "text-sm text-blue-600 font-medium";
  hideError();
  resultsSection.classList.add("hidden");

  const formData = new FormData();
  formData.append("file", _selectedFile);

  try {
    const res = await apiFetch(`${API_BASE}/api/incidents/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      const detail = errBody?.detail || `Error HTTP ${res.status}`;
      throw new Error(detail);
    }

    const result = await res.json();
    _lastResult = result;

    // Mostrar resultados
    renderResults(result);
    resultsSection.classList.remove("hidden");
    analyzeStatus.textContent = `✅ ${window.__ ? window.__('incidents.analysis_complete') : 'Análisis completado'} (${new Date().toLocaleTimeString()})`;
    analyzeStatus.className = "text-sm text-emerald-600 font-medium";

  } catch (err) {
    console.error("Fetch error:", err);
    let msg = err.message;

    // Errores comunes con sugerencias
    if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("NetworkError")) {
      msg = window.__ ? window.__('incidents.connection_error') : "No se pudo conectar con el servidor API. Asegúrate de que el backend esté corriendo (uvicorn en puerto 8000).";
    }

    showError(msg);
    analyzeStatus.textContent = "❌ " + (window.__ ? window.__('incidents.analysis_error') : "Error en el análisis");
    analyzeStatus.className = "text-sm text-red-600 font-medium";
  } finally {
    analyzeBtn.disabled = false;
  }
}

// ─────────────────────────────────────────────
//  RENDERIZADO DE RESULTADOS
// ─────────────────────────────────────────────

function renderResults(result) {
  // ── Totales ──
  $("resTotal").textContent = result.total;
  $("resValid").textContent = result.valid;
  $("resInvalid").textContent = result.invalid;

  // ── Reglas inválidas ──
  const rulesBody = $("rulesBody");
  const rulesSection = $("rulesSection");
  const noRulesMsg = $("noRulesMsg");

  rulesBody.innerHTML = "";

  if (result.rules && result.rules.length > 0) {
    rulesSection.classList.remove("hidden");
    noRulesMsg.classList.add("hidden");

    result.rules.forEach((r) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50";
      tr.innerHTML = `
        <td class="px-4 py-2 text-gray-700">${r.label}</td>
        <td class="px-4 py-2 text-right font-semibold text-red-600">${r.count}</td>
      `;
      rulesBody.appendChild(tr);
    });
  } else {
    rulesSection.classList.add("hidden");
    noRulesMsg.classList.remove("hidden");
  }

  // ── Métricas ──
  renderMetrics(result.metrics, result.valid);
}

function renderMetrics(metrics, validCount) {
  // Categorías
  const catBody = $("metricsCategoryBody");
  catBody.innerHTML = "";
  const cats = Object.entries(metrics.category_counts).sort((a, b) => b[1] - a[1]);

  if (cats.length === 0) {
    catBody.innerHTML = '<tr><td colspan="3" class="px-2 py-3 text-center text-gray-400 italic">' + (window.__ ? window.__('incidents.no_data') : '(sin datos)') + '</td></tr>';
  } else {
    cats.forEach(([cat, count]) => {
      const pct = metrics.category_pcts[cat] || 0;
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50";
      tr.innerHTML = `
        <td class="px-2 py-1.5 text-gray-700">${cat}</td>
        <td class="px-2 py-1.5 text-right font-medium">${count}</td>
        <td class="px-2 py-1.5 text-right text-gray-500">${pct}%</td>
      `;
      catBody.appendChild(tr);
    });
  }

  // Estados
  const statusBody = $("metricsStatusBody");
  statusBody.innerHTML = "";
  ["OPEN", "CLOSED", "DISCARDED"].forEach((s) => {
    const count = metrics.status_counts[s] || 0;
    const pct = metrics.status_pcts[s] || 0;
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50";
    tr.innerHTML = `
      <td class="px-2 py-1.5 text-gray-700">${s}</td>
      <td class="px-2 py-1.5 text-right font-medium">${count}</td>
      <td class="px-2 py-1.5 text-right text-gray-500">${pct}%</td>
    `;
    statusBody.appendChild(tr);
  });

  // Países
  const countryBody = $("metricsCountryBody");
  countryBody.innerHTML = "";
  ["US", "ES"].forEach((c) => {
    const count = metrics.country_counts[c] || 0;
    const pct = metrics.country_pcts[c] || 0;
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50";
    tr.innerHTML = `
      <td class="px-2 py-1.5 text-gray-700">${c}</td>
      <td class="px-2 py-1.5 text-right font-medium">${count}</td>
      <td class="px-2 py-1.5 text-right text-gray-500">${pct}%</td>
    `;
    countryBody.appendChild(tr);
  });

  // Satisfacción
  const satContent = $("satisfactionContent");
  if (metrics.avg_satisfaction !== null) {
    let satHtml = `
      <div class="mb-3">
        <span class="text-lg font-bold text-gray-800">${metrics.avg_satisfaction.toFixed(2)}</span>
        <span class="text-gray-500 text-sm"> / 5</span>
        <span class="text-gray-400 text-xs ml-2">(${window.__ ? window.__('incidents.over_records') : 'sobre'} ${metrics.closed_with_score_count} ${window.__ ? window.__('incidents.records') : 'registros'})</span>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-400 uppercase text-xs">
            <th class="text-left px-2 py-1 font-medium">${window.__ ? window.__('incidents.score_label') : 'Puntuación'}</th>
            <th class="text-right px-2 py-1 font-medium">${window.__ ? window.__('incidents.quantity_label') : 'Cantidad'}</th>
            <th class="text-right px-2 py-1 font-medium">%</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
    `;
    for (let score = 1; score <= 5; score++) {
      const count = metrics.score_distribution[score] || 0;
      const pct = metrics.score_pcts[score] || 0;
      satHtml += `
        <tr class="hover:bg-gray-50">
          <td class="px-2 py-1 text-gray-700">${window.__ ? window.__('incidents.score_label') : 'Score'} ${score}</td>
          <td class="px-2 py-1 text-right font-medium">${count}</td>
          <td class="px-2 py-1 text-right text-gray-500">${pct}%</td>
        </tr>
      `;
    }
    satHtml += "</tbody></table>";
    satContent.innerHTML = satHtml;
  } else {
    satContent.innerHTML = '<p class="italic text-gray-400">' + (window.__ ? window.__('incidents.no_data') : '(no hay datos disponibles)') + '</p>';
  }
}

// ─────────────────────────────────────────────
//  DESCARGA CSV (GET /results/export)
// ─────────────────────────────────────────────

$("downloadBtn").addEventListener("click", async function (e) {
  if (!_lastResult) {
    showError(window.__ ? window.__('incidents.export_no_results') : "No hay resultados que exportar. Realiza un análisis primero.");
    return;
  }
  try {
    const res = await apiFetch(`${API_BASE}/api/incidents/results/export`);
    if (!res.ok) throw new Error("Error " + res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "incident-analysis-results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    showError((window.__ ? window.__('incidents.download_error') : "Error al descargar") + ": " + err.message);
  }
});

// ─────────────────────────────────────────────
//  ERRORES
// ─────────────────────────────────────────────

function showError(msg) {
  errorAlert.classList.remove("hidden");
  errorAlert.textContent = "❌ " + msg;
}

function hideError() {
  errorAlert.classList.add("hidden");
}

// ─────────────────────────────────────────────
//  HEALTH-CHECK (silencioso — no bloquea ni muestra error)
// ─────────────────────────────────────────────

(async function healthCheck() {
  try {
    const res = await apiFetch(`/api/health`);
    if (res.ok) {
      analyzeStatus.textContent = "✅ " + (window.__ ? window.__('incidents.server_connected') : "Servidor API conectado. Sube un archivo CSV para empezar.");
      analyzeStatus.className = "text-sm text-emerald-600 font-medium";
    }
  } catch {
    // Silencio — si falla no pasa nada, lo detectará al intentar analizar
  }
})();