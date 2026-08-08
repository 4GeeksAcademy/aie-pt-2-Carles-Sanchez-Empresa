# TrackFlow Backoffice (HTML + bundle TypeScript)

Este proyecto contiene el panel manual de backoffice de TrackFlow servido como HTML estático y alimentado por un bundle de navegador generado desde el código fuente TypeScript del monorepo.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Python 3 disponible en el entorno

Comprobación rápida:

```bash
node -v
npm -v
python3 --version
```

## Estructura relevante

- `index.html` interfaz estática del backoffice
- `js/app.js` bundle de navegador consumido por la página
- `package.json` scripts de build y watch para la UI
- `../../src/` fuente de verdad de la lógica de negocio, datos de ejemplo y handlers de interfaz

## Fuente de verdad

La lógica de negocio no se mantiene dentro de `uis/backoffice/`.

- `src/utils/` contiene la lógica de negocio
- `src/types/` contiene los tipos de dominio
- `src/data/sampleData.ts` contiene los datos de ejemplo
- `src/ui/handlers.ts` es el entrypoint de navegador que se empaqueta para el backoffice

## Instalación

Desde la carpeta del proyecto:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
```

## Generar la build del backoffice

```bash
npm run build
```

Esto genera:

- `js/app.js`

## Recompilar automáticamente mientras editas

```bash
npm run build:watch
```

Úsalo cuando edites archivos dentro de `src/` consumidos por el backoffice.

## Servir en local

Después de compilar, sirve la carpeta con un servidor HTTP estático:

```bash
python3 -m http.server 8126
```

Después abre:

```bash
http://127.0.0.1:8126
```

## Flujo recomendado para el futuro

Terminal 1:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build:watch
```

Terminal 2:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
python3 -m http.server 8126
```

## Scripts disponibles

- `npm run build`: empaqueta `../../src/ui/handlers.ts` en `js/app.js`
- `npm run build:watch`: recompila el bundle automáticamente al detectar cambios

## Estado esperado

Si todo está correcto:

- `npm run build` termina sin errores
- `js/app.js` se genera correctamente
- `python3 -m http.server 8126` sirve el panel en local
- Los resultados de la lógica de negocio son visibles en la UI, no solo en consola

## Solución de problemas

### La página abre pero los botones no hacen nada

Normalmente `js/app.js` todavía no se ha generado.

1. Asegura que estás en la carpeta correcta:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
```

2. Compila de nuevo:

```bash
npm run build
```

3. Recarga el navegador.

### Error `sh: esbuild: not found`

Faltan dependencias locales.

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
```

### Los cambios en `src/` no se reflejan

Reconstruye el bundle:

```bash
npm run build
```

O mantén el watcher activo:

```bash
npm run build:watch
```