# TrackFlow Backoffice (HTML + bundle TypeScript)

Este proyecto contiene el panel manual de backoffice de TrackFlow servido como HTML estático y alimentado por un bundle de navegador generado desde el código fuente TypeScript del monorepo.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Python 3.10+ con `uv` instalado

Comprobación rápida:

```bash
node -v
npm -v
uv --version
```

## Estructura relevante

- `index.html` — interfaz estática del backoffice
- `js/app.js` — bundle de navegador consumido por la página
- `package.json` — scripts de build y watch para la UI
- `../../src/` — fuente de verdad de la lógica de negocio, datos de ejemplo y handlers de interfaz

## Fuente de verdad

La lógica de negocio no se mantiene dentro de `uis/backoffice/`.

- `src/utils/` contiene la lógica de negocio
- `src/types/` contiene los tipos de dominio
- `src/data/sampleData.ts` contiene los datos de ejemplo
- `src/ui/handlers.ts` es el entrypoint de navegador que se empaqueta para el backoffice

---

## Puesta en marcha — paso a paso (con servidor FastAPI)

Esta es la forma recomendada, ya que el backoffice se sirve a través del mismo servidor FastAPI.

### 1. Compilar el bundle TypeScript

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
npm run build
```

### 2. Iniciar el servidor FastAPI (con uv)

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/services/api
uv sync          # si no lo has hecho aún
uv run seed      # opcional: sembrar proveedores de ejemplo
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Abrir en el navegador

[http://localhost:8000](http://localhost:8000)

El servidor FastAPI sirve:
- `/` → `index.html`
- `/incidents.html` → analizador de incidencias
- `/suppliers.html` → directorio de proveedores
- `/js/app.js` → bundle TypeScript compilado

---

## Opción alternativa: servidor HTTP estático

Si solo quieres ver el HTML estático (sin conectar con la API), puedes usar un servidor HTTP simple:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
python3 -m http.server 8126
```

[http://127.0.0.1:8126](http://127.0.0.1:8126)

> ⚠️ Con esta opción las páginas de proveedores (`suppliers.html`) e incidencias no se conectarán a la API.

---

## Desarrollo: recompilar automáticamente

Mantén este comando corriendo en una terminal mientras editas `src/`:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build:watch
```

Esto regenera `js/app.js` al detectar cualquier cambio en los archivos fuente TypeScript.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run build` | Empaqueta `../../src/ui/handlers.ts` en `js/app.js` |
| `npm run build:watch` | Recompila el bundle automáticamente al detectar cambios |

---

## Estado esperado

Si todo está correcto:

- `npm run build` termina sin errores
- `js/app.js` se genera correctamente
- El servidor FastAPI arranca sin errores
- Las páginas del backoffice cargan correctamente en `http://localhost:8000`
- Los resultados de la lógica de negocio son visibles en la UI, no solo en consola

---

## Solución de problemas

### La página abre pero los botones no hacen nada

Normalmente `js/app.js` todavía no se ha generado.

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
```

Recarga el navegador.

### Error `sh: esbuild: not found`

Faltan dependencias locales.

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
```

### Los cambios en `src/` no se reflejan

Reconstruye el bundle:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
```

O mantén el watcher activo: `npm run build:watch`

### Error `bash: uv: command not found`

```bash
pip install uv
```

### El servidor no arranca por puerto ocupado

```bash
# Cambia el puerto en el servidor FastAPI
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```