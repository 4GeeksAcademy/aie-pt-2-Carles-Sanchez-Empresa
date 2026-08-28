# Contexto Técnico — TrackFlow

## Stack Tecnológico

### Frontend — Talent Pipeline Tracker (Next.js)

| Tecnología | Versión | Propósito |
|---|---|---|
| **Next.js** | 16.3.0 | Framework React con App Router (enrutamiento basado en sistema de archivos) |
| **React** | 19.2.8 | Biblioteca de interfaz de usuario |
| **TypeScript** | ^5 | Tipado estático para todo el código de la aplicación |
| **Tailwind CSS** | ^4 | Framework CSS utilitario (vía `@tailwindcss/postcss`) |
| **PostCSS** | — | Procesador de estilos (configurado con plugin de Tailwind) |
| **ESLint** | ^9 | Análisis estático de código (configuración `eslint-config-next` con `core-web-vitals` y `typescript`) |
| **next/image** | — | Optimización de imágenes nativa de Next.js |
| **next/link + next/navigation** | — | Navegación SPA sin recargas completas de página |

### Lógica de negocio — Módulo `src/` (TypeScript)

| Tecnología | Versión | Propósito |
|---|---|---|
| **TypeScript** | ^7.0.2 | Tipado y lógica de dominio (colecciones, búsqueda, transformaciones, validaciones) |

### Paquete compartido — `packages/shared/`

| Tecnología | Propósito |
|---|---|
| **TypeScript** | Tipos base compartidos (`Id`, `BaseEntity`) para uso transversal entre proyectos |

### Website corporativo — `uis/website/` (React + Vite)

| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | ^19.2.0 | Biblioteca de interfaz de usuario |
| **TypeScript** | ^5.9.2 | Tipado estático |
| **Vite** | ^7.1.3 | Bundler y servidor de desarrollo |
| **Tailwind CSS** | ^3.4.17 | Framework CSS utilitario (Tailwind v3 con PostCSS) |
| **React Router DOM** | ^7.9.1 | Ruteo SPA entre landing y formulario |
| **PostCSS + Autoprefixer** | — | Procesamiento de estilos |

### Backoffice operacional — `uis/backoffice/` (HTML estático + bundle desde `src`)

| Tecnología | Versión | Propósito |
|---|---|---|
| **HTML5 + Tailwind CDN** | — | Render del panel manual del backoffice |
| **TypeScript** | ^7.0.2 | Fuente única de lógica y handlers reutilizados desde `src/` |
| **esbuild** | ^0.28.1 | Bundling de navegador en un único archivo `js/app.js` |

### Paquete compartido — `packages/shared/`

| Tecnología | Propósito |
|---|---|
| **TypeScript** | Tipos base compartidos (`Id`, `BaseEntity`) para uso transversal entre proyectos |

### Estructura del Monorepo

```
aie-pt-2-Carles-Sanchez-Empresa/
├── src/                    # Lógica de dominio (TypeScript)
│   ├── types/models.ts     # Interfaces de dominio (Product, Shipment, Carrier…)
│   └── utils/              # Colecciones, búsqueda, transformaciones, validaciones
├── packages/shared/        # Tipos compartidos (@repo/shared-types)
├── uis/                    # Interfaces de usuario
│   ├── talent-pipeline-tracker/  # Next.js App Router
│   ├── backoffice/         # HTML estático con bundle generado desde src/
│   └── website/            # React + Vite (landing corporativa y formulario)
├── services/               # Backend (estructura preparada, sin implementación aún)
├── agents/                 # Agentes de IA (estructura preparada)
├── workflows/              # Automatizaciones y workflows (estructura preparada)
├── skills/                 # Habilidades: code-review, data-analysis, research
├── scripts/                # Scripts auxiliares
├── infra/                  # Infraestructura
├── mcps/                   # MCPs
├── data/                   # Datos
├── docs/                   # Documentación
├── internal/               # Documentación interna
└── media/                  # Recursos multimedia (logos, imágenes)
```

---

## Decisiones de Arquitectura

### 1. Monorepo con separación por dominios

Se ha optado por una estructura de monorepo donde cada área funcional tiene su propia carpeta raíz (`src/`, `uis/`, `services/`, `agents/`, `workflows/`, etc.). Esto permite:

- Desarrollo independiente de cada módulo.
- Tipos compartidos centralizados en `packages/shared/`.
- Visibilidad clara de la arquitectura general del proyecto.

### 2. Next.js con App Router para la UI principal

- **App Router** (enrutamiento basado en sistema de archivos con carpetas `app/`).
- **Rutas dinámicas**: `app/candidates/[id]/page.tsx` para el detalle de cada candidatura.
- **Navegación SPA**: uso de `next/link` y `next/navigation` (`useRouter`, `useSearchParams`) para transiciones sin recarga completa.
- **Estados de UI obligatorios**: toda operación asíncrona implementa los tres estados — carga (`LoadingSpinner`), éxito (renderizado de datos) y error (`ErrorMessage`).

### 3. Proxy API para evitar CORS

Configurado en `next.config.ts` mediante `async rewrites()`:

```typescript
source: "/api/proxy/:path*",
destination: "https://playground.4geeks.com/tracker/api/v1/:path*",
```

Todas las llamadas a la API externa se realizan a través de `/api/proxy/`, evitando problemas de CORS y manteniendo la URL base centralizada en `lib/constants.ts`.

### 4. Estado local con hooks (sin librerías externas)

- No se usan **Redux, Zustand, Jotai** ni ninguna otra biblioteca de gestión de estado.
- El estado se gestiona exclusivamente con hooks de React (`useState`, `useEffect`, `useCallback`) a nivel de componente.
- No hay _prop drilling_; cada componente consume sus propios datos mediante llamadas a la API.

### 5. Paleta de colores personalizada (sin Tailwind theme extend)

El diseño utiliza colores fijos directamente en las clases de Tailwind (no se extiende el archivo de configuración). Paleta definida:

| Variable | Color | Uso |
|---|---|---|
| `#c6dced` | Azul claro | Fondo general |
| `#2f4a62` | Azul oscuro | Texto principal |
| `#f3ddba` | Beige / dorado claro | Fondos de header, footer, modales |
| `#c89d66` | Dorado | Bordes y acentos |
| `#14263a` | Azul petróleo | Títulos y botones principales |
| `#1d4f7a` | Azul medio | Hover de botones |
| `#f8fbff` | Blanco azulado | Input fields |

### 6. Mobile-first responsive

- Diseño adaptable con `md:` breakpoints.
- Navegación inferior fija en móvil (`md:hidden`).
- Layout flexible con `flex-col` en móvil y `flex-row` en escritorio.

### 7. Capa de servicio desacoplada

Todas las llamadas a la API están centralizadas en `services/api.ts`, que expone funciones asíncronas tipadas (`getRecords`, `createRecord`, `updateRecord`, `patchRecord`, `deleteRecord`, `getNotes`, `createNote`, `deleteNote`). El _helper_ interno `request<T>()` unifica la gestión de errores y el tipado de respuestas.

### 8. Mapeo de valores API a etiquetas

Los valores crudos de la API (ej. `received`, `in_progress`) se mapean a etiquetas legibles en español mediante archivos `lib/constants.ts`. Esto evita que términos técnicos aparezcan en la interfaz de usuario.

### 9. Backoffice con fuente única y bundle de navegador

- La lógica de negocio del backoffice no se mantiene en `uis/backoffice/` como fuente independiente.
- `src/` es la única fuente de verdad para tipos, utilidades, datos de ejemplo y handlers de UI.
- `uis/backoffice/` solo contiene:
  - `index.html` para el render estático
  - `package.json` con scripts de build/watch
  - `js/app.js` como artefacto final consumido por el navegador
- El build del backoffice se realiza bundlando `../../src/ui/handlers.ts` con `esbuild`, evitando árboles duplicados de salida por módulo.
- `src/tsconfig.json` usa `noEmit` para separar claramente validación TypeScript y salida de navegador.

---

## Restricciones Técnicas

### API externa (playground.4geeks.com)

- **URL base**: `https://playground.4geeks.com/tracker/api/v1/`
- **Proxy local**: `/api/proxy/`
- **No modificar ni adaptar la API**: el frontend debe consumirla tal cual está.
- **Autenticación**: no requiere autenticación explícita (API pública del playground).
- **Endpoints consumidos**:
  - `GET /records` — listado paginado de candidaturas
  - `GET /records/:id` — detalle de candidatura
  - `POST /records` — crear candidatura
  - `PUT /records/:id` — actualizar candidatura completa
  - `PATCH /records/:id` — actualización parcial (estado/etapa)
  - `DELETE /records/:id` — eliminar candidatura
  - `GET /records/:id/notes` — notas de una candidatura
  - `POST /records/:id/notes` — crear nota
  - `DELETE /records/:id/notes/:note_id` — eliminar nota

### TypeScript estricto

- `tsconfig.json` tiene `"strict": true` habilitado.
- Obligatorio tipar todas las funciones, componentes y hooks.
- No se permite `any` implícito.

### Sin librerías de estado externas

- Prohibido usar Redux, Zustand, Jotai, MobX, etc.
- Solo hooks nativos de React.

### Sin recargas de página completas

- La navegación entre listado y detalle debe ser SPA, usando el sistema de rutas de Next.js App Router.
- `useSearchParams` para filtros por query parameters sin recargar.

### Validación de formularios

- Validación manual (sin librerías externas como Formik o React Hook Form).
- Teléfono: entre 7 y 15 dígitos (expresión regular en `lib/validation.ts`).
- Campos obligatorios: nombre completo, email, teléfono, puesto.

### Estados de UI obligatorios

Toda operación de obtención de datos debe contemplar tres estados visuales:

1. **Cargando**: mostrar `LoadingSpinner`.
2. **Éxito**: mostrar los datos.
3. **Error**: mostrar `ErrorMessage` con el mensaje del error.

### Actualización optimista tras escrituras

Tras un `POST`, `PUT`, `PATCH` o `DELETE`, la interfaz debe reflejar los cambios sin requerir recarga manual ni navegación adicional.

### Organización de carpetas (Talent Pipeline Tracker)

```
uis/talent-pipeline-tracker/
├── app/
│   ├── layout.tsx          # Layout raíz (Header + Footer)
│   ├── page.tsx            # Listado de candidaturas
│   └── candidates/[id]/page.tsx  # Detalle de candidatura
├── components/             # Componentes reutilizables
│   ├── Header.tsx
│   ├── StatusBadge.tsx
│   ├── StageBadge.tsx
│   ├── LoadingSpinner.tsx
│   ├── ErrorMessage.tsx
│   └── SuccessToast.tsx
├── lib/                    # Constantes, validaciones, helpers
│   ├── constants.ts
│   └── validation.ts
├── services/               # Capa de API
│   └── api.ts
└── types/                  # Tipos TypeScript
    └── index.ts
```

---

## Dependencias del Proyecto

### Talent Pipeline Tracker (`uis/talent-pipeline-tracker/`)

```json
{
  "dependencies": {
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### Lógica de dominio (`src/`)

```json
{
  "scripts": {
    "build": "npx tsc -p tsconfig.json --noEmit",
    "typecheck": "npx tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "typescript": "^7.0.2"
  }
}
```

### Backoffice (`uis/backoffice/`)

```json
{
  "scripts": {
    "build": "esbuild ../../src/ui/handlers.ts --bundle --platform=browser --format=iife --target=es2020 --outfile=./js/app.js",
    "build:watch": "esbuild ../../src/ui/handlers.ts --bundle --platform=browser --format=iife --target=es2020 --outfile=./js/app.js --watch"
  },
  "devDependencies": {
    "esbuild": "^0.28.1"
  }
}
```

### Paquete compartido (`packages/shared/`)

- `@repo/shared-types` v0.0.1 (privado, sin dependencias externas)