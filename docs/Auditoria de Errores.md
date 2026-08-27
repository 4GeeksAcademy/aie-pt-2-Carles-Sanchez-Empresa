# Auditoría de Gestión de Errores — TrackFlow

> **Fecha:** 2026-08-27
> **Alcance:** Repositorio completo (src/, services/api/, uis/, scripts/, skills/, packages/, agents/)
> **Propósito:** Identificar problemas de manejo de errores: try/catch ausentes, catch amplios, fallos silenciosos, exposición de errores, filtrado de datos sensibles, estados de UI faltantes, ausencia de acciones para el usuario, y falta de `sys.exit` en scripts.

---

## Resumen de hallazgos por severidad

| Severidad | Conteo |
|-----------|--------|
| CRÍTICO   | 4      |
| ALTO      | 8      |
| MEDIO     | 7      |
| BAJO      | 5      |
| **Total** | **24** |

---

## CRÍTICO

### C-1. Fallo silencioso en envío de email de restablecimiento
- **Archivo:** `services/api/routes/auth.py` — línea 160
- **Categoría:** 3 · Fallo silencioso
- **Problema:** El bloque `except: pass` dentro de `forgot_password` silencia completamente cualquier error al enviar el email, incluyendo errores de configuración (API key inválida, red caída, etc.). El usuario siempre ve un mensaje de éxito aunque el email nunca se haya enviado.
- **Corrección sugerida:** Registrar el error con `logging.error()` y, en producción, notificar al administrador. Nunca silenciar completamente la excepción.

### C-2. Exposición de errores en crudo vía formato `.format(e)`
- **Archivo:** `services/api/main.py` — líneas 118 y 123
- **Categoría:** 4 · Exposición de errores en crudo
- **Problema:** Los mensajes de error se construyen con `.format(e)`, lo que inserta la representación textual de la excepción (`str(e)`) directamente en la respuesta HTTP. Esto puede exponer trazas internas, rutas de archivos del servidor o detalles de implementación al cliente.
- **Corrección sugerida:** Usar mensajes genéricos y registrar el error completo con `logging.exception()`.

### C-3. Sin estados de carga/error en la web corporativa
- **Archivo:** `uis/website/src/components/application/ApplicationForm.tsx` — líneas 163-173
- **Categoría:** 6 · Estados de carga/error ausentes en UI
- **Problema:** `handleSubmit` llama a `validateApplicationForm()` y muestra errores de validación locales, pero NO hay ninguna llamada a una API real. No hay estado de carga (`loading`), ni manejo de errores de red. Si en el futuro se conecta a un backend, la UI no tendrá protección contra errores.
- **Corrección sugerida:** Añadir estados `loading` y `error` con renderizado condicional, y envolver la lógica asíncrona en try/catch.

### C-4. Filtración de datos sensibles en log de errores de API
- **Archivo:** `uis/talent-pipeline-tracker/services/api.ts` — líneas 49-50
- **Categoría:** 5 · Filtración de datos sensibles
- **Problema:** `console.error("API Error ...:", body)` imprime el cuerpo completo de la respuesta en la consola del navegador. Si el backend devuelve datos personales (emails, teléfonos, IDs internos) en el cuerpo del error, estos quedarán expuestos en la consola del cliente.
- **Corrección sugerida:** Registrar solo el código de estado y un mensaje genérico. Nunca volcar el cuerpo completo.

---

## ALTO

### A-1. TRY/CATCH ausente en operación asíncrona de login
- **Archivo:** `src/services/auth.ts` — líneas 72-78
- **Categoría:** 1 · Try/catch ausente
- **Problema:** Las funciones `login()`, `register()` y `getAuthMe()` no tienen ningún try/catch. Un error de red (`Failed to fetch`), DNS o timeout propagará la excepción sin control hasta el llamante, que puede no estar preparado.
- **Corrección sugerida:** Envolver el `fetch` en try/catch, reconociendo errores de red y lanzando errores con mensajes legibles.

### A-2. TRY/CATCH ausente en operación asíncrona de registro
- **Archivo:** `src/services/auth.ts` — líneas 92-115
- **Categoría:** 1 · Try/catch ausente
- **Problema:** `register()` no captura errores de red en ninguna de las dos llamadas fetch (creación de usuario y login automático). Una falla de red a mitad del flujo dejará al usuario con un error no controlado.
- **Corrección sugerida:** Envolver cada fetch en try/catch o unificar en un único try/catch que maneje errores de red y HTTP.

### A-3. TRY/CATCH ausente en auth proxy de Next.js
- **Archivo:** `uis/talent-pipeline-tracker/app/api/auth-proxy/[...path]/route.ts` — líneas 20-32
- **Categoría:** 1 · Try/catch ausente
- **Problema:** La función `proxy()` no tiene try/catch. Si `fetch()` al backend falla (backend caído, timeout, DNS), la excepción llega sin control a Next.js, que devolverá un error 500 genérico sin mensaje útil y sin logging.
- **Corrección sugerida:** Envolver el upstream fetch en try/catch, registrar el error y devolver un 502 con mensaje amigable.

### A-4. Fallo silencioso en parseo de JSON en login
- **Archivo:** `src/services/auth.ts` — líneas 77-79, 103-105, 129-131
- **Categoría:** 3 · Fallo silencioso
- **Problema:** En tres lugares, el bloque `catch { // ignore }` silencia errores de parseo de JSON al intentar leer `body.detail`. Si el cuerpo no es JSON válido, el error se ignora y se usa el mensaje genérico, pero no se registra en ningún lado.
- **Corrección sugerida:** Al menos registrar el error con `console.warn()`. Considerar asumir formato JSON y eliminar el try/catch anidado.

### A-5. Exposición de errores en crudo en la API de incidencias legacy
- **Archivo:** `services/api/analyzer/_core.py` — líneas 29-55
- **Categoría:** 4 · Exposición de errores en crudo
- **Problema:** (DUPLICADO en `packages/shared-py/trackflow_shared/legacy/validation.py`) — Los mensajes de validación que viajan en la respuesta JSON incluyen nombres de reglas internas (`country_invalid`, `carrier_invalid`) que pueden ser confusos para el cliente. Además, `compute_metrics()` expone nombres de campos del CSV.
- **Corrección sugerida:** Usar etiquetas amigables (`RULE_LABELS`) en las respuestas API y mantener los nombres internos solo para logs.

### A-6. Sin sys.exit en fallo crítico de seed_incidents.py
- **Archivo:** `scripts/seed_incidents.py` — línea 45
- **Categoría:** 8 · Sin `sys.exit` en fallo de script
- **Problema:** Cuando el archivo CSV no existe, el script llama `sys.exit(1)`, lo cual es correcto. Sin embargo, las demás condiciones de error (registros inválidos, errores de parseo) no provocan salida con código distinto de 0. El script termina con código 0 incluso si hay errores.
- **Corrección sugerida:** Usar `sys.exit(1)` cuando hay registros inválidos o errores de transformación, no solo cuando falta el archivo.

### A-7. Sin sys.exit en fallo crítico de seed.py
- **Archivo:** `services/api/seed.py` — líneas 154-161
- **Categoría:** 8 · Sin `sys.exit` en fallo de script
- **Problema:** El script `seed.py` solo imprime mensajes en consola, incluso en condiciones de error. Si la tabla ya tiene datos, imprime un aviso pero termina con código 0, lo que puede dar una falsa sensación de éxito en automatizaciones.
- **Corrección sugerida:** Devolver código de salida adecuado según el resultado de la operación.

### A-8. Exposición de errores en crudo en el auth proxy
- **Archivo:** `uis/talent-pipeline-tracker/services/auth.ts` — líneas 117-118 (función `parseError`)
- **Categoría:** 4 · Exposición de errores en crudo
- **Problema:** `parseError()` intenta leer `body.detail` del backend, pero si el backend devuelve un error no JSON, se cae al mensaje genérico `Error ${res.status}`. Ese mensaje genérico llega directamente al usuario (ej. en formularios de login). No hay sanitización.
- **Corrección sugerida:** Mapear códigos de estado HTTP a mensajes amigables (ej. 401 → "Credenciales incorrectas").

---

## MEDIO

### M-1. Catch demasiado amplio en global_exception_handler
- **Archivo:** `services/api/main.py` — líneas 68-80
- **Categoría:** 2 · Catch demasiado amplio
- **Problema:** El manejador global captura `Exception` (todas las excepciones), lo que es correcto para un último recurso. Sin embargo, filtra `HTTPException` para relanzarla. El resto de excepciones se traducen a un mensaje genérico sin registrar el error real en logs/sentry.
- **Corrección sugerida:** Añadir `logging.exception(exc)` antes de devolver el error 500 para poder depurar.

### M-2. Catch demasiado amplio en tabla de listado de incidencias
- **Archivo:** `uis/backoffice/js/incidents-manager.js` — líneas 335-342
- **Categoría:** 2 · Catch demasiado amplio
- **Problema:** `loadList()` captura genéricamente en el `catch(err)` y muestra `err.message` al usuario. El mensaje de error de red (`Failed to fetch`) se muestra directamente al usuario sin procesar.
- **Corrección sugerida:** Detectar errores de red específicamente y mostrar mensajes amigables. Mantener `err.message` para errores de validación conocidos.

### M-3. Estados de carga/error ausentes en perfil de cuenta
- **Archivo:** `uis/talent-pipeline-tracker/app/account/profile/page.tsx` — líneas 19-29
- **Categoría:** 6 · Estados de carga/error ausentes en UI
- **Problema:** El perfil tiene un estado `loading` simple con texto "Cargando perfil...", pero no usa el componente `LoadingSpinner` disponible en el proyecto. En error, muestra el mensaje pero no ofrece acción al usuario.
- **Corrección sugerida:** Usar `LoadingSpinner` y `ErrorMessage` con `onRetry`.

### M-4. Catch demasiado amplio en carga de resumen de incidencias
- **Archivo:** `uis/backoffice/js/incidents-manager.js` — líneas 385-393 (función `loadSummary`)
- **Categoría:** 2 · Catch demasiado amplio
- **Problema:** Similar a M-2, el error de API se muestra directamente al usuario sin procesar. Errores de red genéricos aparecen como texto técnico.
- **Corrección sugerida:** Procesar el error según su tipo antes de mostrarlo.

### M-5. Sin llamada a la acción para el usuario en errores de incidencias
- **Archivo:** `uis/backoffice/js/incidents-manager.js` — líneas 338-341
- **Categoría:** 7 · Sin llamada a la acción para el usuario
- **Problema:** Cuando falla la carga de incidencias, se muestra un mensaje de error pero no hay botón de "Reintentar" ni enlace de soporte. El usuario queda bloqueado.
- **Corrección sugerida:** Añadir botón "Reintentar" que llame a `loadList()` de nuevo.

### M-6. Sin llamada a la acción para el usuario en errores de resumen
- **Archivo:** `uis/backoffice/js/incidents-manager.js` — líneas 389-393
- **Categoría:** 7 · Sin llamada a la acción para el usuario
- **Problema:** Ídem M-5, pero para el resumen de incidencias. No hay forma de reintentar.
- **Corrección sugerida:** Añadir botón "Reintentar" que llame a `loadSummary()`.

### M-7. Fallo silencioso en manejo de error de download CSV
- **Archivo:** `uis/backoffice/js/incidents.js` — líneas 215-216
- **Categoría:** 3 · Fallo silencioso
- **Problema:** En el catch de la descarga del CSV, el error se captura pero el cuerpo del catch está vacío (solo `if (err) {}`). El usuario nunca sabe que la descarga falló.
- **Corrección sugerida:** Mostrar un mensaje de error al usuario cuando la descarga falla.

---

## BAJO

### B-1. Fallo silencioso en parseo de JSON en getAuthMe
- **Archivo:** `src/services/auth.ts` — líneas 129-131
- **Categoría:** 3 · Fallo silencioso
- **Problema:** El bloque `catch { // ignore }` en `getAuthMe()` es idéntico al de login/register. El error de parseo se ignora sin registro.
- **Corrección sugerida:** Registrar con `console.warn()` el error de parseo.

### B-2. Sin manejo de errores en `applyDataChanges` para JSON inválido
- **Archivo:** `src/ui/handlers.ts` — líneas 60-64
- **Categoría:** 1 · Try/catch ausente
- **Problema:** `applyDataChanges()` tiene un try/catch, pero solo captura errores de JSON.parse. Si `state.products.push(...newProducts)` falla (por ejemplo, `newProducts` no es un array), la excepción no está controlada.
- **Corrección sugerida:** Añadir validación de tipos antes de hacer push, o envolver toda la lógica en un solo try/catch.

### B-3. Sin manejo de errores en `getToken()` del gestor de incidencias
- **Archivo:** `uis/backoffice/js/incidents-manager.js` — líneas 137-140
- **Categoría:** 1 · Try/catch ausente
- **Problema:** La función `getToken()` tiene un try/catch que captura cualquier error de `localStorage.getItem`, lo cual es correcto. Sin embargo, no distingue entre `localStorage` no disponible y un token inválido. En ambos casos retorna `null`.
- **Corrección sugerida:** Es aceptable como está, pero se podría mejorar registrando el error si `localStorage` no está disponible.

### B-4. Exposición de ruta interna en error de analizador CSV
- **Archivo:** `scripts/analyze.py` — línea 35
- **Categoría:** 5 · Filtración de datos sensibles
- **Problema:** `sys.path.insert(0, os.path.abspath(_SHARED_DIR))` expone rutas absolutas del sistema de archivos en el path de Python. Si un error de importación ocurre, la traza mostrará rutas internas del servidor.
- **Corrección sugerida:** Usar rutas relativas o configurar el path mediante variable de entorno. Es un riesgo menor porque es un script CLI.

### B-5. Fallo silencioso en `pandas_clean.py`
- **Archivo:** `skills/data-analysis/scripts/pandas_clean.py` — líneas 7-11
- **Categoría:** 1 · Try/catch ausente
- **Problema:** `pd.read_csv("data.csv")` no tiene try/catch. Si el archivo no existe o tiene formato incorrecto, la excepción termina el script sin mensaje amigable.
- **Corrección sugerida:** Envolver en try/catch y mostrar mensaje de error claro.

---

## Hallazgos adicionales (observaciones)

### O-1. Duplicación de lógica `analyze_rows` y `build_results_csv`
- **Archivos:** `services/api/analyzer/_core.py` + `packages/shared-py/trackflow_shared/legacy/validation.py`
- **Problema:** Las funciones `analyze_rows()` y `build_results_csv()` están duplicadas en ambos archivos. La versión en `_core.py` ya no es necesaria y puede causar inconsistencias si se modifican independientemente.
- **Corrección sugerida:** Eliminar la duplicación importando desde `trackflow_shared.legacy`.

### O-2. Error tipográfico en README para ruta de API
- **Archivo:** `README.es.md` — línea 111
- **Problema:** La ruta `GET /sup` parece estar truncada. Probablemente debería ser `GET /suppliers`.
- **Corrección sugerida:** Completar la ruta correcta.

---

## Estadísticas por categoría

| Categoría | Conteo |
|-----------|--------|
| 1 · Try/catch ausente | 6 |
| 2 · Catch demasiado amplio | 3 |
| 3 · Fallo silencioso | 5 |
| 4 · Exposición de errores en crudo | 3 |
| 5 · Filtración de datos sensibles | 2 |
| 6 · Estados de carga/error ausentes en UI | 2 |
| 7 · Sin llamada a la acción para el usuario | 2 |
| 8 · Sin `sys.exit` en fallo de script | 2 |

---

## Conclusiones

1. **El backend (FastAPI) está bien protegido** con un manejador global de excepciones y manejo de errores de validación Pydantic traducidos. Sin embargo, los errores de archivo CSV exponen mensajes de excepción en crudo (C-2), lo cual es crítico.

2. **El frontend Next.js (Talent Pipeline Tracker)** es el más robusto, con componentes `ErrorMessage`, `LoadingSpinner` y `SuccessToast` reutilizables. Sin embargo, el proxy de autenticación no tiene manejo de errores (A-3).

3. **El backoffice HTML/JS** tiene una mezcla: buen manejo en el gestor de incidencias (con errores por campo), pero carece de acciones de reintento (M-5, M-6) y tiene fallos silenciosos en descarga CSV (M-7).

4. **Los scripts Python** carecen de `sys.exit` adecuado en condiciones de error (A-6, A-7), lo que puede causar problemas en automatizaciones CI/CD.

5. **La web corporativa (React+Vite)** no tiene conexión a API real, pero tampoco preparación para ello (C-3).

6. **El módulo compartido auth.ts** tiene múltiples fallos silenciosos en parseo de JSON (A-4) que deberían al menos registrarse.

---

*Fin del informe de auditoría.*
