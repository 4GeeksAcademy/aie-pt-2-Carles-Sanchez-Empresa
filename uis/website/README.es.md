# TrackFlow Website (Next.js 16 + React 19 + Tailwind v4)

Aplicación Next.js que sirve la web corporativa de TrackFlow.  
Migrada de React + Vite a Next.js App Router.

Toda la lógica de dominio compartida se importa de `@trackflow/core` (en `src/` de la raíz del monorepo) — sin duplicación de código.

---

## Requisitos

- Node.js 20+
- npm 10+

---

## Ejecutar

```bash
# Desde la raíz del repo, instalar deps de todos los workspaces
npm install

# Iniciar servidor de desarrollo (puerto 3000)
cd uis/website
npm run dev
```

---

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Landing principal |
| `/application` | Formulario de solicitud TrackFlow |

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo (puerto 3000) |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run typecheck` | Validar tipos TypeScript sin emitir archivos |

---

## Arquitectura

```
uis/website/
├── app/
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Layout raíz
│   └── application/
│       └── page.tsx        # Formulario de solicitud
├── components/             # Componentes UI reutilizables
├── public/media/           # Imágenes y recursos
└── next.config.ts          # transpilePackages para @trackflow/core
```

## Paquete compartido (`@trackflow/core`)

El website importa lógica compartida del barrel `src/` del monorepo:

```ts
import { validateProduct, validateShipment, validateCarrier, ... }
  from "@trackflow/core";
import type { Product, Shipment, Carrier, ApplicationFormData, ... }
  from "@trackflow/core";
```

---

## Solución de problemas

### `port already in use`

Next.js sugerirá automáticamente el siguiente puerto disponible. O mata el proceso existente:

```bash
lsof -ti:3000 | xargs kill
npm run dev
```

### `sh: next: not found`

Asegúrate de que las dependencias están instaladas:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa
npm install
cd uis/website
npm run dev
```
