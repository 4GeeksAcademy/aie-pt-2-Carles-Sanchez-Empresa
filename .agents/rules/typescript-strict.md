---
title: TypeScript Strict
description: Reglas de tipado estricto en TypeScript para todo el proyecto
alwaysActive: true
appliesTo: "**/*.{ts,tsx}"
---

# TypeScript Strict

## Alcance

Esta regla aplica a **todos los archivos TypeScript** (`.ts`, `.tsx`) del monorepo, incluyendo:
- `src/` — Lógica de dominio
- `uis/` — Interfaces de usuario (Next.js)
- `packages/shared/` — Tipos compartidos
- `services/` — Backend (futuro)
- `agents/` — Agentes de IA
- `workflows/` — Automatizaciones

## Reglas Obligatorias

### 1. `strict: true` en tsconfig

El archivo `tsconfig.json` de cada proyecto debe mantener `"strict": true` habilitado. No se permite desactivar ninguna de las flags que lo componen (`strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, etc.).

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 2. Prohibición de `any`

- **No se permite el uso de `any`** en ninguna circunstancia.
- Si no se conoce el tipo exacto, usar tipos más seguros como:
  - `unknown` — cuando el tipo se determinará en tiempo de ejecución (requiere narrowing)
  - `Partial<T>` — cuando solo algunos campos de un tipo conocido están disponibles
  - `Record<string, T>` — para diccionarios con valores de tipo conocido
  - Tipos unión: `status: 'active' | 'inactive' | 'pending'`

```typescript
// ❌ Incorrecto
function process(data: any): any { ... }

// ✅ Correcto
function process(data: unknown): Record<string, string> { ... }
```

### 3. Tipado explícito de funciones y componentes

Toda función, componente React y hook debe tener **tipado explícito** en sus parámetros y retorno.

```typescript
// ❌ Incorrecto — tipos implícitos
function getProduct(id) { ... }
const ProductCard = ({ product }) => { ... }

// ✅ Correcto — tipos explícitos
function getProduct(id: ProductId): Product | null { ... }

interface ProductCardProps {
  product: Product;
  onSelect: (id: ProductId) => void;
}
const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => { ... }
```

### 4. Interfaces sobre types para objetos

- Usar `interface` para definir la forma de objetos que se extienden o implementan.
- Usar `type` para uniones, tuplas, alias de tipos primitivos y utilidades.

```typescript
// ✅ interface para objetos
interface Product {
  id: ProductId;
  name: string;
  price: number;
}

// ✅ type para uniones y alias
type ProductId = string;
type ProductStatus = 'active' | 'inactive' | 'discontinued';
type ProductFilters = Partial<Pick<Product, 'category' | 'warehouse'>>;
```

### 5. Tipado de retorno en funciones asíncronas

Toda función `async` debe declarar explícitamente el tipo de retorno, no confiar en inferencia.

```typescript
// ❌ Incorrecto
async function fetchProducts() {
  const res = await api.get('/products');
  return res.data;
}

// ✅ Correcto
async function fetchProducts(): Promise<Product[]> {
  const res = await api.get('/products');
  return res.data as Product[];
}
```

### 6. Strict Null Checks

- Declarar explícitamente `null` / `undefined` en tipos donde sea posible.
- Usar optional chaining (`?.`) y nullish coalescing (`??`) para acceder a valores que pueden ser `null` / `undefined`.

```typescript
// ✅ Correcto
function findProduct(sku: string): Product | null { ... }
const price = product?.price ?? 0;
```

### 7. Tipos compartidos centralizados

Los tipos que se usan en múltiples módulos deben definirse en:
- `packages/shared/types/` — para tipos base transversales (`Id`, `BaseEntity`)
- `src/types/models.ts` — para tipos de dominio (Product, Shipment, Carrier)
- `uis/talent-pipeline-tracker/types/` — para tipos específicos de UI
- No duplicar tipos; importar desde su ubicación canónica.

## Validación

Antes de hacer commit, ejecutar:

```bash
# Para el proyecto Next.js
cd uis/talent-pipeline-tracker && npx tsc --noEmit

# Para el módulo src
cd src && npx tsc --noEmit
```

Corregir todos los errores de tipo antes de continuar.