# TrackFlow Backoffice (HTML + bundle TypeScript)

Esta carpeta contiene las páginas estáticas del backoffice (`index.html`, `suppliers.html`, `incidents.html`, `login.html`, `register.html`, `profile.html`) y el bundle de navegador (`js/app.js`) generado desde `src/ui/handlers.ts`.

El backoffice está pensado para servirse desde la app FastAPI en `services/api`, no desde un servidor frontend independiente.

---

## Requisitos

- Node.js 20+
- npm 10+
- Python 3.10+
- `uv`

Comprobación rápida:

```bash
node -v
npm -v
uv --version
```

---

## Rutas para abrir en el navegador

Cuando la API está corriendo en el puerto `8000`, tienes disponibles estas páginas:

- `/login` → inicio de sesión
- `/register` → registro de cuenta
- `/` → panel principal del backoffice (protegido)
- `/suppliers.html` → directorio de proveedores (protegido)
- `/incidents.html` → analizador de incidencias (protegido)
- `/incidents-manager.html` → gestor centralizado de incidencias (protegido, NUEVO)
- `/account/profile` → perfil del usuario actual (protegido)

Las rutas legacy (`/login.html`, `/register.html`, `/profile.html`) se mantienen como alias.

Las rutas protegidas requieren un token JWT válido guardado en `localStorage` (`trackflow_token`).

---

## Proceso recomendado de arranque (de principio a fin)

### 1. Compilar el bundle del backoffice

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
npm run build
```

### 2. Iniciar la API (que también sirve esta UI)

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/services/api
uv sync
uv run seed   # opcional: datos de ejemplo para proveedores
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Abrir y autenticarse

1. Abre `http://localhost:8000/register` para crear una cuenta.
2. Luego inicia sesión en `http://localhost:8000/login`.
3. Tras el login se redirige a `http://localhost:8000/`.
4. Navega a proveedores e incidencias desde la barra superior.

---

## Flujo de desarrollo

Usa recompilación automática mientras editas `src/`:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build:watch
```

Mantén el servidor FastAPI corriendo en otra terminal.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run build` | Empaqueta `../../src/ui/handlers.ts` en `js/app.js` |
| `npm run build:watch` | Recompila automáticamente al detectar cambios |

---

## Acceso en Codespaces

Si ejecutas esto en GitHub Codespaces, usa la URL del puerto `8000`:

- `https://<codespace-name>-8000.app.github.dev/login`

Puedes ver la URL exacta en el panel Ports de VS Code.

---

## Solución de problemas

### La UI carga pero las acciones no hacen nada

El bundle puede estar desactualizado. Recompila:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
```

### 401 Unauthorized o redirección automática al login

El token falta o expiró. Inicia sesión de nuevo en `/login`.

### `sh: esbuild: not found`

Instala dependencias en backoffice:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
```

### No se puede conectar con la API

Inicia/reinicia FastAPI en `services/api`:

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
