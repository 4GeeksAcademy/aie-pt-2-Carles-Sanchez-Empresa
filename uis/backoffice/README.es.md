# TrackFlow Backoffice (Next.js 16 + React 19 + Tailwind v4)

Aplicación Next.js que sirve el panel operativo de TrackFlow.  
Reemplaza las páginas HTML estáticas legacy con una estructura moderna de App Router usando React Server Components y Client Components.

Toda la lógica de dominio compartida se importa de `@trackflow/core` (en `src/` de la raíz del monorepo) — sin duplicación de código.

---

## Requisitos

- Node.js 20+
- npm 10+
- Backend FastAPI corriendo en puerto 8000 (`services/api`)

---

## Ejecutar

```bash
# Desde la raíz del repo, instalar deps de todos los workspaces
npm install

# Iniciar servidor de desarrollo (puerto 3000)
cd uis/backoffice
npm run dev
```

---

## Proxy API (rewrites)

El backoffice usa **rewrites** de Next.js (`next.config.ts`) para redirigir las llamadas API al backend FastAPI, manteniendo todo en el mismo origen:

```
/api/*       → http://localhost:8000/*  (elimina el prefijo /api)
/auth/*      → http://localhost:8000/auth/*
/users/*     → http://localhost:8000/users/*
/profiles/*  → http://localhost:8000/profiles/*
```

> 💡 El frontend usa `API_BASE = "/api"` en `lib/constants.ts`, por lo que todas las llamadas fetch (ej. `fetch("/api/suppliers")`) se redirigen al backend sin el prefijo `/api`.

Esto evita problemas de CORS en desarrollo y Codespaces.

---

## Rutas

| Ruta | Auth | Descripción |
|---|---|---|
| `/login` | No | Formulario de login (email + password → JWT) |
| `/register` | No | Formulario de registro |
| `/` | JWT | Dashboard — inventario, envíos y carriers |
| `/suppliers` | JWT | CRUD de proveedores |
| `/incidents` | JWT | Analizador CSV de incidencias |
| `/account/profile` | JWT | Gestión de perfil de usuario |

> Las rutas protegidas requieren un JWT válido en `localStorage` (`trackflow_token`).

---

## Cómo lanzar (full stack)

### 1. Backend FastAPI (puerto 8000)

```bash
cd services/api
source venv/bin/activate
uv run seed                # opcional: datos de ejemplo
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Backoffice (puerto 3000)

```bash
cd uis/backoffice
npm run dev
```

> ⚠️ El backoffice usa el puerto 3000 por defecto. Si el website ya ocupa ese puerto, Next.js asignará automáticamente el puerto 3001.

### 3. Abrir en navegador

- **Login**: `http://localhost:3001/login`
- **Registro**: `http://localhost:3001/register`
- **Dashboard**: `http://localhost:3001/` (tras login)

---

## Arquitectura

```
uis/backoffice/
├── app/                    # Páginas Next.js App Router
│   ├── login/page.tsx      # Login (envuelto en Suspense)
│   ├── register/page.tsx   # Registro
│   ├── page.tsx            # Dashboard (protegido)
│   ├── suppliers/page.tsx  # CRUD proveedores (protegido)
│   ├── incidents/page.tsx  # Analizador incidencias (protegido)
│   └── account/profile/page.tsx  # Perfil (protegido)
├── components/             # Componentes UI compartidos
├── hooks/                  # Custom hooks (useDashboard, useSuppliers, useIncidentAnalyzer)
├── services/api.ts         # Wrapper fetch API (usa API_BASE + rewrites)
├── lib/constants.ts        # Config (API_BASE, categorías, etc.)
├── next.config.ts          # Rewrites + transpilePackages
└── tsconfig.json           # Alias de ruta
```

## Paquete compartido (`@trackflow/core`)

El backoffice importa toda la lógica compartida del barrel `src/` del monorepo:

```ts
import { login, register, getToken, getAuthMe, getProfile, updateProfile }
  from "@trackflow/core";
import { filterProductsByWarehouse, sortCarriersByReliability, selectBestCarrier, ... }
  from "@trackflow/core";
import type { Product, Shipment, Carrier, User, ... }
  from "@trackflow/core";
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo (puerto 3001) |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor de producción |

---

## Solución de problemas

### `another next dev server is already running`

Mata el servidor existente:

```bash
lsof -ti:3001 | xargs kill
npm run dev
```

### Las peticiones API devuelven 404

Asegúrate de que FastAPI está corriendo en puerto 8000 y que los rewrites en `next.config.ts` apuntan a la URL correcta. Verifica con:

```bash
curl http://localhost:8000/api/health
```

### Error de login

Asegúrate de haberte registrado primero. El backend FastAPI debe estar corriendo en puerto 8000.
