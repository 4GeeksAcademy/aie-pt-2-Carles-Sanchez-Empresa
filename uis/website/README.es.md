# TrackFlow Website (React + TypeScript + Tailwind)

Este proyecto contiene la migración de la web estática de TrackFlow a componentes reutilizables en React con TypeScript y estilos con Tailwind.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

Comprobación rápida:

```bash
node -v
npm -v
```

## Estructura relevante

- `src/` componentes y páginas React
- `public/media/` imágenes y recursos visuales
- `src/utils/applicationValidation.ts` validaciones del formulario

## Instalación

Desde la carpeta del proyecto:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/website
npm install --no-package-lock
```

Nota:
- Se usa `--no-package-lock` para evitar generar `package-lock.json` en este repositorio.

## Ejecutar en desarrollo

```bash
npm run dev
```

Vite mostrará una URL local (normalmente `http://localhost:5173`).

## Comprobar tipado TypeScript

```bash
npm run typecheck
```

## Generar build de producción

```bash
npm run build
```

## Previsualizar build

```bash
npm run preview
```

## Scripts disponibles

- `npm run dev`: levanta servidor de desarrollo
- `npm run typecheck`: valida tipos sin emitir archivos
- `npm run build`: compila para producción
- `npm run preview`: sirve la build generada

## Rutas de la aplicación

- `/` landing principal
- `/application` formulario de solicitud

## Solución de problemas

### Error `sh: vite: not found` o exit code `127`

Suele ocurrir cuando faltan dependencias locales.

1. Asegura que estás en la carpeta correcta:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/website
```

2. Reinstala dependencias:

```bash
npm install --no-package-lock
```

3. Ejecuta de nuevo:

```bash
npm run dev
```

### Puerto ocupado

Si el puerto por defecto está ocupado, Vite propondrá otro automáticamente.

## Estado esperado

Si todo está correcto:

- `npm run typecheck` termina sin errores
- `npm run build` genera `dist/` sin fallos
- `npm run dev` sirve la app en local
