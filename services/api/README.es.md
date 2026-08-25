# TrackFlow API (FastAPI)

Backend unificado de TrackFlow. Este servicio expone APIs de negocio y también sirve las páginas del backoffice.

Incluye:

- Analizador de incidencias (`/api/incidents/*`)
- Directorio de proveedores (`/suppliers/*`)
- Autenticación y usuarios (`/auth/*`, `/users/*`, `/profiles/*`)
- Frontend del backoffice (`/`, `/login`, `/register`, `/account/profile`, etc.)

---

## Requisitos

- Python 3.10+
- `uv`
- Node.js + npm (solo para compilar `uis/backoffice/js/app.js`)

```bash
pip install uv
```

---

## Proceso de arranque completo

### 1. Compilar el bundle del backoffice

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
npm run build
```

### 2. Instalar dependencias de la API

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/services/api
uv sync
```

### 3. Seed opcional (datos de ejemplo de proveedores)

```bash
uv run seed
```

### 4. Iniciar el servidor

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Abrir y usar la aplicación

1. Abre `http://localhost:8000/register` para crear un usuario.
2. Inicia sesión en `http://localhost:8000/login`.
3. Entra al backoffice en `http://localhost:8000/`.

---

## Rutas de navegador

| Ruta | Uso | Acceso |
|---|---|---|
| `/register` | Crear cuenta de usuario | Público |
| `/login` | Iniciar sesión y guardar sesión en navegador | Público |
| `/` | Panel principal del backoffice | Protegido |
| `/suppliers.html` | UI de proveedores | Protegido |
| `/incidents.html` | UI de analizador de incidencias | Protegido |
| `/incidents-manager.html` | UI de gestor centralizado de incidencias | Protegido |
| `/account/profile` | UI de perfil del usuario actual | Protegido |

Alias legacy también disponibles:

- `/register.html`
- `/login.html`
- `/profile.html`

---

## Rutas de API

### Públicas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/users` | Registro de usuario |
| `POST` | `/auth/login` | Login (devuelve token JWT) |
| `POST` | `/auth/forgot-password` | Solicitar enlace de restablecimiento de contraseña |
| `POST` | `/auth/reset-password` | Restablecer contraseña con token |

### Protegidas (requieren token Bearer)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/auth/me` | Usuario autenticado actual |
| `POST` | `/auth/change-password` | Cambiar contraseña (autenticado) |
| `GET` | `/profiles/me` | Perfil del usuario autenticado |
| `PUT` | `/profiles/me` | Actualizar perfil propio |
| `GET` | `/users` | Listar usuarios (solo admin) |
| `GET` | `/users/{id}` | Obtener usuario por id |
| `PUT` | `/users/{id}` | Actualizar usuario |
| `DELETE` | `/users/{id}` | Eliminar usuario (solo admin) |
| `POST` | `/api/incidents/analyze` | Analizar CSV subido |
| `GET` | `/api/incidents/results/export` | Exportar último análisis en CSV |
| `POST` | `/api/incidents` | Crear nueva incidencia (gestor) |
| `GET` | `/api/incidents` | Listar incidencias (`?status=&origin=&branch=`) |
| `GET` | `/api/incidents/{id}` | Detalle de incidencia por ID |
| `PATCH` | `/api/incidents/{id}/status` | Actualizar estado (con validación de transiciones) |
| `GET` | `/api/incidents/summary` | Métricas agregadas (por estado, categoría, origen, sede) |
| `POST` | `/suppliers` | Crear proveedor |
| `GET` | `/suppliers` | Listar proveedores (`?country=...&category=...`) |
| `GET` | `/suppliers/{id}` | Obtener proveedor por ID |
| `PATCH` | `/suppliers/{id}/rate` | Actualizar tarifa de proveedor |
| `PATCH` | `/suppliers/{id}/status` | Actualizar estado de proveedor |
| `DELETE` | `/suppliers/{id}` | Eliminar proveedor |

---

## Prueba rápida con curl

```bash
# Health (público)
curl -s http://localhost:8000/api/health | python3 -m json.tool

# Registro (público)
curl -s -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@trackflow.com","password":"secret123"}' | python3 -m json.tool

# Login (público)
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@trackflow.com","password":"secret123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Ejemplo protegido
curl -s http://localhost:8000/suppliers \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## Codespaces

Usa la URL del puerto `8000`, por ejemplo:

- `https://<codespace-name>-8000.app.github.dev/login`

---

## Solución de problemas

### Puedes abrir páginas pero las llamadas API fallan con 401

Inicia sesión de nuevo en `/login`. Los endpoints protegidos exigen JWT válido.

### `GET /js/app.js` devuelve 404

El bundle del backoffice no se ha compilado. Ejecuta:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
```

### `uv: command not found`

Instala `uv`:

```bash
pip install uv
```
