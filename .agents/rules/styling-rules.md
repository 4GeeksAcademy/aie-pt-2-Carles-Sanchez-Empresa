---
title: Estilizado con Tailwind CSS
description: Reglas de estilizado con la paleta de colores TrackFlow y Tailwind CSS
alwaysActive: true
appliesTo: "**/*.{tsx,html,css}"
---

# Estilizado con Tailwind CSS

## Alcance

Esta regla aplica a:
- Todos los componentes de interfaz en `uis/` (ficheros `.tsx` y `.css`)
- Las landing pages estáticas en la raíz (`index.html`, `application.html`)
- Cualquier nuevo proyecto de UI que se añada al monorepo

## Reglas Obligatorias

### 1. Framework exclusivo: Tailwind CSS

Todo el estilado debe realizarse con **Tailwind CSS**. No se permite CSS tradicional en archivos separados ni librerías de componentes externas (Material UI, Chakra, Bootstrap, etc.), salvo para casos excepcionales autorizados en el README del proyecto.

```tsx
// ✅ Correcto — clases Tailwind directamente en el JSX
<div className="bg-[#c6dced] text-[#2f4a62] p-4 rounded-lg">
  Contenido
</div>

// ❌ Incorrecto — CSS en archivo separado
// styles.css: .my-container { background: #c6dced; ... }
```

### 2. Paleta de colores TrackFlow

Usar los colores fijos directamente en las clases de Tailwind (no extender `tailwind.config` ni crear variables CSS). La paleta oficial es:

| Color | Hex | Uso |
|---|---|---|
| Azul claro | `#c6dced` | Fondo general de la aplicación |
| Azul oscuro | `#2f4a62` | Texto principal y contenido |
| Beige / dorado claro | `#f3ddba` | Fondos de header, footer, modales y contenedores destacados |
| Dorado | `#c89d66` | Bordes, separadores y acentos decorativos |
| Azul petróleo | `#14263a` | Títulos principales, botones primarios y elementos de alta jerarquía |
| Azul medio | `#1d4f7a` | Hover de botones y elementos interactivos |
| Blanco azulado | `#f8fbff` | Fondos de inputs, tarjetas y áreas de contenido |

Para aplicar estos colores en Tailwind:

```tsx
<!-- Fondo general -->
<div className="bg-[#c6dced]">

<!-- Texto principal -->
<p className="text-[#2f4a62]">

<!-- Header o footer -->
<header className="bg-[#f3ddba]">

<!-- Botón primario -->
<button className="bg-[#14263a] hover:bg-[#1d4f7a] text-white">

<!-- Borde decorativo -->
<div className="border border-[#c89d66]">

<!-- Input field -->
<input className="bg-[#f8fbff] border border-[#c89d66]">
```

### 3. Mobile-first responsive

Todo el diseño debe concebirse primero para móvil y adaptarse a pantallas mayores con `md:` breakpoints.

```tsx
// ✅ Correcto — mobile-first
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/2">...</div>
  <div className="w-full md:w-1/2">...</div>
</div>
```

**Reglas específicas para móvil:**
- Navegación inferior fija en móvil: usar `md:hidden` para ocultar en escritorio
- Layout flexible en columna para móvil (`flex-col`) y fila para escritorio (`md:flex-row`)
- Padding generoso en móvil (`p-4`) que puede aumentar en escritorio (`md:p-6` o `md:p-8`)

### 4. Componentes reutilizables con estilos TrackFlow

Los componentes de UI ya existentes deben usarse siempre que sea posible:

| Componente | Ruta | Estilo |
|---|---|---|
| `Header.tsx` | `uis/talent-pipeline-tracker/components/Header.tsx` | Fondo `bg-[#f3ddba]`, texto `text-[#14263a]` |
| `StatusBadge.tsx` | `uis/talent-pipeline-tracker/components/StatusBadge.tsx` | Etiqueta de estado con color semántico |
| `StageBadge.tsx` | `uis/talent-pipeline-tracker/components/StageBadge.tsx` | Etiqueta de etapa del pipeline |
| `LoadingSpinner.tsx` | `uis/talent-pipeline-tracker/components/LoadingSpinner.tsx` | Indicador de carga animado |
| `ErrorMessage.tsx` | `uis/talent-pipeline-tracker/components/ErrorMessage.tsx` | Mensaje de error con estilo TrackFlow |
| `SuccessToast.tsx` | `uis/talent-pipeline-tracker/components/SuccessToast.tsx` | Notificación de éxito |

### 5. Estados visuales obligatorios

Toda operación asíncrona debe mostrar tres estados visuales:

1. **Cargando** → `LoadingSpinner`
2. **Error** → `ErrorMessage` con el mensaje
3. **Éxito** → Renderizado de datos (y opcionalmente `SuccessToast` tras escrituras)

```tsx
// ✅ Correcto — patrón de tres estados
function ProductList() {
  const { data, loading, error } = useProducts();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  return <div className="bg-[#c6dced]">...productos...</div>;
}
```

### 6. Prohibido: CSS-in-JS, módulos CSS, frameworks UI externos

- ❌ **Styled Components**, **Emotion**, **CSS Modules** — no usar
- ❌ **Material UI**, **Chakra UI**, **Ant Design**, **Bootstrap** — no instalar
- ❌ **Inline styles** (`style={{}}`) — evitar, salvo para valores dinámicos imposibles con Tailwind
- ✅ Solo clases `className` con Tailwind

### 7. Responsive sin JavaScript

No usar JavaScript para cambios de layout responsivos. Todo el responsive debe lograrse exclusivamente con clases Tailwind:

```tsx
// ✅ Correcto — responsive con Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Incorrecto — JS para detectar tamaño de pantalla
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
```

## Validación

- Verificar visualmente que los colores coinciden con la paleta TrackFlow
- Asegurar que no hay clases CSS ni imports de librerías de UI externas
- Comprobar que todos los estados de carga (loading/error/success) están implementados