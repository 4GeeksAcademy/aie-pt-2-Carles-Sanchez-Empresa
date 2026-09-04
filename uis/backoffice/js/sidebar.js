/**
 * sidebar.js — Sidebar de navegación ocultable para TrackFlow Backoffice.
 *
 * Genera dinámicamente una barra lateral izquierda con todos los enlaces
 * de navegación. Se oculta/muestra con un botón "☰" en el header.
 *
 * Dependencia: i18n.js (debe cargarse antes).
 *
 * Uso en HTML:
 *   1. <script src="/js/i18n.js"></script>
 *   2. <script src="/js/sidebar.js"></script>
 *   3. Añadir en el header: <button id="sidebarToggle">☰</button>
 */

(function () {
  'use strict';

  const SIDEBAR_ITEMS = [
    { href: '/',              icon: '🏠', labelKey: 'nav.home',    labelDefault: 'Inicio' },
    { href: '/suppliers.html', icon: '📋', labelKey: 'nav.suppliers', labelDefault: 'Proveedores' },
    { href: '/incidents.html', icon: '📊', labelKey: 'nav.incidents',  labelDefault: 'Analizar incidencias' },
    { href: '/incidents-manager.html', icon: '🚨', labelKey: 'nav.incidents_manager', labelDefault: 'Gestor incidencias' },
    { href: '/inventory.html', icon: '📦', labelKey: 'nav.inventory',  labelDefault: 'Inventario' },
  ];

  // ─── Estilos inyectados una sola vez ───

  function injectStyles() {
    if (document.getElementById('sidebar-styles')) return;

    const css = document.createElement('style');
    css.id = 'sidebar-styles';
    css.textContent = `
      /* ── Sidebar layout ── */
      body {
        position: relative;
      }

      .sidebar-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.3);
        z-index: 40;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      body.sidebar-open .sidebar-overlay {
        opacity: 1;
        pointer-events: auto;
      }

      .app-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 260px;
        background: #1e293b;
        color: #e2e8f0;
        z-index: 50;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        overflow-y: auto;
        box-shadow: 4px 0 12px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
      }
      body.sidebar-open .app-sidebar {
        transform: translateX(0);
      }

      .sidebar-header {
        padding: 1.25rem 1rem;
        border-bottom: 1px solid #334155;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .sidebar-header h2 {
        font-size: 1.125rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        margin: 0;
        color: #f1f5f9;
      }
      .sidebar-close {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
      }
      .sidebar-close:hover {
        color: #e2e8f0;
      }

      .sidebar-nav {
        list-style: none;
        margin: 0;
        padding: 0.75rem 0;
        flex: 1;
      }
      .sidebar-nav li {
        margin: 0;
        padding: 0;
      }
      .sidebar-nav a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background 0.15s, color 0.15s;
        border-left: 3px solid transparent;
      }
      .sidebar-nav a:hover {
        background: #334155;
        color: #f1f5f9;
      }
      .sidebar-nav a.active {
        background: #1e3a5f;
        color: #60a5fa;
        border-left-color: #3b82f6;
      }
      .sidebar-nav a .nav-icon {
        font-size: 1.125rem;
        width: 1.5rem;
        text-align: center;
        flex-shrink: 0;
      }

      .sidebar-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid #334155;
      }
      .sidebar-footer a,
      .sidebar-footer button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.5rem 0;
        color: #94a3b8;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 500;
        background: none;
        border: none;
        cursor: pointer;
        transition: color 0.15s;
        text-align: left;
        font-family: inherit;
      }
      .sidebar-footer a:hover,
      .sidebar-footer button:hover {
        color: #e2e8f0;
      }

      /* ── Sidebar toggle button ── */
      #sidebarToggle {
        background: rgba(255,255,255,0.15);
        border: none;
        color: white;
        font-size: 1.25rem;
        padding: 0.375rem 0.5rem;
        border-radius: 0.375rem;
        cursor: pointer;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }
      #sidebarToggle:hover {
        background: rgba(255,255,255,0.25);
      }

      /* Ajuste del header: no perder espacio por la sidebar al abrirse */
      body.sidebar-open {
        /* No desplazamos el contenido */
      }

      @media (min-width: 1024px) {
        .sidebar-overlay {
          display: none;
        }
        /* En desktop se puede mantener cerrada por defecto */
      }
    `;
    document.head.appendChild(css);
  }

  // ─── Construir HTML del sidebar ───

  function buildSidebar() {
    if (document.getElementById('app-sidebar')) return;

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = closeSidebar;
    document.body.appendChild(overlay);

    // Sidebar container
    const sidebar = document.createElement('nav');
    sidebar.id = 'app-sidebar';
    sidebar.className = 'app-sidebar';
    sidebar.setAttribute('aria-label', 'Navegación principal');

    // Header del sidebar
    const sHeader = document.createElement('div');
    sHeader.className = 'sidebar-header';
    sHeader.innerHTML = '<h2>🚚 TrackFlow</h2>' +
      '<button class="sidebar-close" onclick="document.body.classList.remove(\'sidebar-open\')" aria-label="Cerrar menú">✕</button>';
    sidebar.appendChild(sHeader);

    // Lista de navegación
    const ul = document.createElement('ul');
    ul.className = 'sidebar-nav';

    const currentPath = window.location.pathname;

    SIDEBAR_ITEMS.forEach(function (item) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.innerHTML = '<span class="nav-icon">' + item.icon + '</span> <span data-i18n="' + item.labelKey + '">' + item.labelDefault + '</span>';

      // Marcar como activo si coincide la ruta
      if (currentPath === item.href || currentPath.replace(/\/+$/, '') === item.href.replace(/\/+$/, '')) {
        a.classList.add('active');
      }

      li.appendChild(a);
      ul.appendChild(li);
    });

    sidebar.appendChild(ul);

    // Footer con perfil y cerrar sesión
    const sFooter = document.createElement('div');
    sFooter.className = 'sidebar-footer';
    sFooter.innerHTML =
      '<a href="/account/profile">👤 <span data-i18n="nav.profile">Perfil</span></a>' +
      '<button onclick="window.logout ? window.logout() : (function(){try{localStorage.removeItem(\'trackflow_token\')}catch(e){}; window.location.href=\'/login\'})()">🚪 <span data-i18n="nav.logout">Salir</span></button>';
    sidebar.appendChild(sFooter);

    document.body.appendChild(sidebar);

    // Cerrar sidebar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
        closeSidebar();
      }
    });
  }

  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
  }

  // ─── Conectar toggle button ───

  function connectToggle() {
    const btn = document.getElementById('sidebarToggle');
    if (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        document.body.classList.toggle('sidebar-open');
      };
    }
  }

  // ─── Inicializar ───

  function init() {
    injectStyles();
    buildSidebar();
    connectToggle();

    // Re-aplicar traducciones si existen
    if (typeof window.__applyTranslations === 'function') {
      window.__applyTranslations();
    }
  }

  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();