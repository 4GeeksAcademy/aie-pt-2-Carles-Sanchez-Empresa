# Auditoría de Gestión de Errores — TrackFlow

> **Fecha:** 2026-08-27
> **Alcance:** Repositorio completo (src/, services/api/, uis/, scripts/, skills/, packages/, agents/)
> **Propósito:** Identificar problemas de manejo de errores: try/catch ausentes, catch amplios, fallos silenciosos, exposición de errores, filtrado de datos sensibles, estados de UI faltantes, ausencia de acciones para el usuario, y falta de `sys.exit` en scripts.

---

## Resumen de hallazgos por severidad

| Severidad | Conteo |
|-----------|--------|
| CRÍTICO   | 5      |
| ALTO      | 11     |
| MEDIO     | 12     |
| BAJO      | 8      |
| **Total** | **36** |

---

## CRÍTICO

### C-1. Fallo silencioso en envío de email de restablecimiento
- **Archivo:** `services/api/routes/auth.py` — línea 160
- **Categoría:** 3 · Fallo silencioso
- **Problema:** El bloque `except: pass` dentro de `forgot_password` silencia completamente cualquier error al enviar el email, incluyendo errores de configuración (API key inválida, red caída, etc.). El usuario siempre ve un mensaje de éxito aunque el email nunca se haya enviado.
- **Corrección aplicada:** `2026-08-27` — Se reemplazó `except: pass` por `logger.exception(...)` que registra la traza completa del error sin exponerla al usuario. Se añadió `import logging` y se creó el logger del módulo. El flujo sigue sin romperse (el usuario siempre ve confirmación), pero ahora hay trazabilidad del error cuando falla el envío. ✅

### C-2. Exposición de errores en crudo vía formato `.format(e)`
- **Archivo:** `services/api/main.py` — líneas 164 y 175
- **Categoría:** 4 · Exposición de errores en crudo
- **Problema:** Los mensajes de error se construyen con `.format(e)`, lo que inserta la representación textual de la excepción (`str(e)`) directamente en la respuesta HTTP. Esto puede exponer trazas internas, rutas de archivos del servidor o detalles de implementación al cliente.
- **Corrección aplicada:** `2026-08-27` — Se reemplazó `.format(e)` en ambas líneas (csv_read_error y csv_parse_error) por `logger.exception()` para registrar la traza completa en servidor, mientras que las traducciones i18n se cambiaron a mensajes genéricos sin placeholder `{}`. Se añadió `import logging` y `logger = logging.getLogger(__name__)` en el módulo. Las claves `csv_read_error` y `csv_parse_error` en los ficheros `en.py` y `es.py` se actualizaron eliminando el `{}` y usando texto descriptivo genérico. ✅

### C-3. Sin estados de carga/error en la web corporativa
- **Archivo:** `uis/website/src/components/application/ApplicationForm.tsx` — líneas 163-173
- **Categoría:** 6 · Estados de carga/error ausentes en UI
- **Problema:** `handleSubmit` llama a `validateApplicationForm()` y muestra errores de validación locales, pero NO hay ninguna llamada a una API real. No hay estado de carga (`loading`), ni manejo de errores de red. Si en el futuro se conecta a un backend, la UI no tendrá protección contra errores.
- **Corrección aplicada:** `2026-08-27` — Se añadieron estados `submitting` (booleano) y `submitError` (string | null) en el componente. El `handleSubmit` se volvió `async` con patrón `try/catch/finally`. Durante el envío, el botón se deshabilita (`disabled`) con opacidad reducida y muestra un spinner SVG animado + texto "Enviando…". Si ocurre un error, se muestra un banner con borde rojo, título descriptivo, mensaje del error y botón "Descartar". Se añadieron 4 nuevas claves de traducción (`enviando`, `errorTitle`, `errorUnexpected`, `dismissError`) en `es.ts` y `en.ts`. La función `clearForm` también resetea `submitError`. ✅

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

---

## SEGUNDA PASADA — Auditoría adicional

> A continuación se detallan los hallazgos de la segunda revisión, que cubre:
> chequeo de fetch/try/catch por llamada, patrón 3-estados (loading/success/error),
> errores en crudo, optional chaining, safe defaults, bloques finally, alcance de
> excepciones, códigos HTTP, datos sensibles, llamadas a APIs externas, operaciones
> de fichero, sys.exit, comprobaciones defensivas, y barrido de console.error/print.

---

## ALTO (adicionales)

### A-9. Uso de `alert()` nativo para errores en lugar de componentes de UI
- **Archivos:**
  - `uis/talent-pipeline-tracker/app/candidates/[id]/page.tsx` — líneas 266, 281, 295, 308
  - `uis/backoffice/js/incidents-manager.js` — línea 306
- **Categoría:** 6 · Estados de carga/error ausentes en UI
- **Problema:** Cinco operaciones asíncronas utilizan `alert()` del navegador para notificar errores al usuario. Esto impide usar el estilo visual de la aplicación, no permite reintento estructurado, y la experiencia es pobre comparada con el componente `ErrorMessage` (que sí ofrece botón `Reintentar`). El usuario recibe unmodal del sistema operativo sin contexto visual de la aplicación.
  - `handleQuickChange`: `alert(err.message)` si falla el PATCH de estado/etapa
  - `handleAddNote`: `alert(err.message)` si falla crear nota
  - `handleDeleteNote`: `alert(err.message)` si falla eliminar nota
  - `handleDeleteRecord`: `alert(err.message)` si falla eliminar candidatura
  - `updateStatusInline` (backoffice): `alert("❌ ...")` si falla cambio de estado inline
- **Corrección sugerida:** Reemplazar `alert()` por el componente `ErrorMessage` con `onRetry` o un `SuccessToast` con estilo de error. El componente `ErrorMessage` ya existe en el proyecto.

### A-10. Operaciones CRUD sin estado `loading` ni bloque `finally`
- **Archivo:** `uis/talent-pipeline-tracker/app/candidates/[id]/page.tsx`
  - `handleQuickChange` (línea 254)
  - `handleDeleteNote` (línea 286)
  - `handleAddNote` (línea 270, carece de `finally` para resetear `savingNote`)
- **Categoría:** 6 · Estados de carga/error ausentes en UI
- **Problema:** Estas tres operaciones no gestionan un estado `loading` intermedio ni tienen bloque `finally` que garantice la limpieza del estado. Aunque `handleDeleteRecord` sí tiene `setDeleting(false)` en el catch, ninguna operación usa el patrón `try/catch/finally`. El usuario no recibe feedback visual durante la operación y, si ocurre un error después de cambios locales, el estado puede quedar inconsistente.
- **Corrección sugerida:** Añadir estado booleano de carga por operación (ej. `patching`, `deletingNote`, `addingNote`), deshabilitar botones durante la operación, y mover la limpieza a un bloque `finally`.

### A-11. `change_password` no verifica existencia del usuario
- **Archivo:** `services/api/routes/auth.py` — líneas 241-243
- **Categoría:** 1 · Try/catch ausente (comprobación defensiva)
- **Problema:** El endpoint `change_password` obtiene el usuario con `users_table.get(doc_id=user_id)` pero no comprueba que el resultado no sea `None`. Si por algún motivo el usuario autenticado no existe en la tabla (estado inconsistente de la BD), el acceso a `user.get("hashed_password", "")` lanzaría un `AttributeError: 'NoneType' object has no attribute 'get'`.
- **Corrección sugerida:** Añadir comprobación `if user is None:` y devolver 404 con mensaje traducido antes de acceder a sus campos.

---

## MEDIO (adicionales)

### M-8. Errores de cambio de estado y notas sin cobertura de tests de integración
- **Archivo:** `uis/talent-pipeline-tracker/app/candidates/[id]/page.tsx` — handlers `handleQuickChange`, `handleAddNote`, `handleDeleteNote`, `handleDeleteRecord`
- **Categoría:** 7 · Sin llamada a la acción para el usuario
- **Problema:** Cuando falla `patchRecord`, `createNote`, `deleteNote` o `deleteRecord`, el error mostrado se descarta tras el `alert()`. El usuario no tiene cómo reintentar la operación sin recargar manualmente la página. Tampoco hay logging que permita al desarrollador diagnosticar errores intermitentes.
- **Corrección sugerida:** Integrar con `onRetry` del componente `ErrorMessage` o añadir botón de reintento dentro del mensaje de error. Registrar el error con `console.error()` para depuración.

### M-9. `console.log` de depuración en producción (api.ts)
- **Archivo:** `uis/talent-pipeline-tracker/services/api.ts` — línea 21
- **Categoría:** 5 · Filtración de datos sensibles (bajo)
- **Problema:** `console.log(\`🌐 ${options?.method || "GET"} ${url}\`)` imprime en consola del navegador todas las URLs de API solicitadas, incluyendo tokens en query parameters si los hubiera y exponiendo la estructura interna de la API. No debería estar activo en producción.
- **Corrección sugerida:** Eliminar el `console.log` o envolverlo en un flag de depuración (`if (process.env.NODE_ENV !== "production")`).

### M-10. `email_service.py` imprime errores con `print()` en lugar de `logging`
- **Archivo:** `services/api/email_service.py` — líneas 48, 52
- **Categoría:** 5 · Filtración de datos sensibles
- **Problema:** El servicio de email utiliza `print(f"[email_service] Error al enviar email a {to_email}: {e}")` que imprime en stdout la dirección de email del destinatario junto con el mensaje de excepción. En entornos donde stdout es capturado por un servicio de logs (systemd, Docker, CloudWatch), estos datos quedarán registrados sin estructura ni nivel de severidad.
- **Corrección sugerida:** Usar `logging.error(...)` con formato estructurado y nivel de severidad. No imprimir el email del destinatario en logs no estructurados.

### M-11. `SuccessToast` sin timeout de auto-ocultación en detalle de candidato
- **Archivo:** `uis/talent-pipeline-tracker/app/candidates/[id]/page.tsx`
- **Categoría:** 6 · Estados de carga/error ausentes en UI
- **Problema:** El componente `SuccessToast` usado en la página de detalle recibe el mensaje pero no tiene un `setTimeout` que lo oculte automáticamente tras unos segundos. El backoffice de incidencias sí implementa este patrón correctamente con `setTimeout(() => successEl.classList.add("hidden"), 4000)`. En el detalle de candidato, el mensaje de éxito persiste hasta la siguiente interacción del usuario.
- **Corrección sugerida:** Añadir `useEffect` o `setTimeout` que limpie `setSuccessMessage(null)` tras 3-4 segundos.

### M-12. Bloque `finally` ausente en `handleQuickChange` y `handleDeleteNote`
- **Archivo:** `uis/talent-pipeline-tracker/app/candidates/[id]/page.tsx`
  - `handleQuickChange` — sin estado loading, sin finally
  - `handleDeleteNote` — sin estado loading, sin finally
  - `handleDeleteRecord` — tiene `setDeleting(false)` en catch pero no finally
- **Categoría:** 1 · Try/catch ausente (extensión)
- **Problema:** En los tres handlers, si ocurre una excepción después de una mutación de estado local (ej. `setNotes` se ejecuta antes de que termine la operación asíncrona), el estado puede quedar inconsistente. Aunque el catch maneje la UI, no hay garantía de limpieza post-operación mediante `finally`.
- **Corrección sugerida:** Usar el patrón `try/catch/finally` en todos los handlers asíncronos, moviendo la limpieza de estados de carga y la restauración de UI al bloque `finally`.

### M-13. Auth proxy no sanitiza errores del backend
- **Archivo:** `uis/talent-pipeline-tracker/app/api/auth-proxy/[...path]/route.ts` — líneas 38-45
- **Categoría:** 4 · Exposición de errores en crudo
- **Problema:** La función `proxy()` captura el body del backend con `await upstream.text()` y lo reenvía sin sanitización en `new NextResponse(body, { status: upstream.status })`. Si el backend devuelve HTML de error (ej. error 502 de nginx, o traceback de debug), ese HTML se propagará al frontend tal cual, pudiendo exponer información interna del backend.
- **Corrección sugerida:** Verificar el `content-type` de la respuesta upstream. Si es JSON, reenviar tal cual. Si no es JSON y el status es >= 400, devolver un JSON genérico con mensaje seguro.

---

## BAJO (adicionales)

### B-6. `renderSummaryGrid` no chequea que `data` no sea null/undefined
- **Archivo:** `uis/backoffice/js/incidents-manager.js` — línea 400
- **Categoría:** 1 · Try/catch ausente (comprobación defensiva)
- **Problema:** La función `renderSummaryGrid(containerId, data, labelFn)` recibe `data` del objeto de métricas y llama a `Object.keys(data)`. Si el backend devuelve `null` o `undefined` para alguna de las métricas (ej. `by_status: null`), la función lanzará un `TypeError: Cannot convert undefined or null to object`.
- **Corrección sugerida:** Añadir guarda al inicio: `if (!data) return;` o `data = data || {};`

### B-7. `seed.py` usa `sys.path.insert(0, ...)` con rutas absolutas
- **Archivo:** `services/api/seed.py` — líneas 17-20
- **Categoría:** 5 · Filtración de datos sensibles
- **Problema:** Similar a B-4 en `scripts/analyze.py`, `seed.py` añade rutas absolutas al `sys.path`. Aunque es un script de carga inicial y no expone directamente datos al usuario, en entornos de CI/CD las rutas absolutas pueden aparecer en logs de error.
- **Corrección sugerida:** Usar rutas relativas o paquete instalable. Similar a la solución de B-4.

### B-8. `pandas_clean.py` hardcodea "data.csv" y no usa `sys.argv`
- **Archivo:** `skills/data-analysis/scripts/pandas_clean.py` — línea 8
- **Categoría:** 8 · Sin `sys.exit` en fallo de script (ext.)
- **Problema:** El script usa `pd.read_csv("data.csv")` sin recibir la ruta como argumento. Además, no tiene manejo de errores (ya registrado como B-5) ni usa `sys.exit(1)` si el archivo no existe.
- **Corrección sugerida:** Usar `sys.argv[1]` para el path y añadir try/except con `sys.exit(1)`.

### B-9. Sin comprobación defensiva de `doc` en `get_summary()` de incidencias
- **Archivo:** `services/api/routes/incidents.py` — líneas 81-104
- **Categoría:** 1 · Try/catch ausente (comprobación defensiva)
- **Problema:** El bucle en `get_summary()` itera sobre `docs` y accede a `doc.get("status", "unknown")`. Aunque TinyDB siempre devuelve documentos con estos campos si se almacenaron correctamente, no hay verificación de que `doc` sea un diccionario. Si algún documento está corrupto en la BD, el bucle fallará.
- **Corrección sugerida:** Añadir verificación `if not isinstance(doc, dict): continue` al inicio del bucle.

---

## ACTUALIZACIÓN DE CONCLUSIONES (Segunda Pasada)

La segunda pasada ha identificado **12 hallazgos adicionales** (1 ALTO, 5 MEDIOS y 4 BAJOS nuevos, más algunos que refuerzan hallazgos existentes), elevando el total a **36 hallazgos**.

Las áreas más críticas detectadas en esta segunda revisión son:

1. **Uso generalizado de `alert()`** para errores en el frontend (A-9) — 5 ocurrencias que deberían migrarse al componente `ErrorMessage` existente.

2. **Operaciones CRUD sin estados de carga ni `finally`** (A-10, M-12) — 3 handlers en el detalle de candidato que no siguen el patrón correcto `try/catch/finally` con loading state.

3. **Exposición de información interna** vía `print()` en `email_service.py` (M-10), `console.log` de depuración en api.ts (M-9), y auth proxy sin sanitización (M-13).

4. **Comprobaciones defensivas faltantes** (A-11, B-6, B-9) — tres lugares donde un valor `None` o inesperado puede causar crash.

5. **Falta de auto-limpieza** en `SuccessToast` (M-11) comparado con el backoffice que sí implementa `setTimeout`.

---

## BAJO (originales)

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
| 1 · Try/catch ausente | 8 |
| 2 · Catch demasiado amplio | 3 |
| 3 · Fallo silencioso | 5 |
| 4 · Exposición de errores en crudo | 4 |
| 5 · Filtración de datos sensibles | 5 |
| 6 · Estados de carga/error ausentes en UI | 6 |
| 7 · Sin llamada a la acción para el usuario | 3 |
| 8 · Sin `sys.exit` en fallo de script | 3 |

---

## Conclusiones

1. **El backend (FastAPI) está bien protegido** con un manejador global de excepciones y manejo de errores de validación Pydantic traducidos. Sin embargo, los errores de archivo CSV exponen mensajes de excepción en crudo (C-2), lo cual es crítico. Se han identificado dos nuevos problemas en backend: `email_service.py` imprime direcciones de email con `print()` (M-10) y `change_password` no comprueba existencia del usuario (A-11).

2. **El frontend Next.js (Talent Pipeline Tracker)** es el más robusto, con componentes `ErrorMessage`, `LoadingSpinner` y `SuccessToast` reutilizables. Sin embargo, la segunda pasada reveló uso extensivo de `alert()` en lugar de estos componentes (A-9), operaciones CRUD sin estados `loading` ni bloques `finally` (A-10, M-12), y `console.log` de depuración dejado en producción (M-9).

3. **El backoffice HTML/JS** tiene una mezcla: buen manejo en el gestor de incidencias (con errores por campo), pero carece de acciones de reintento (M-5, M-6), tiene fallos silenciosos en descarga CSV (M-7), y adolece de comprobaciones defensivas en `renderSummaryGrid` (B-6).

4. **Los scripts Python** carecen de `sys.exit` adecuado en condiciones de error (A-6, A-7), lo que puede causar problemas en automatizaciones CI/CD. `pandas_clean.py` hardcodea "data.csv" y no usa `sys.argv` (B-8). `seed.py` expone rutas absolutas (B-7).

5. **La web corporativa (React+Vite)** no tiene conexión a API real, pero tampoco preparación para ello (C-3) — sin cambios en esta segunda pasada.

6. **El módulo compartido auth.ts** tiene múltiples fallos silenciosos en parseo de JSON (A-4) que deberían al menos registrarse.

7. **El auth proxy de Next.js** reenvía errores del backend sin sanitización (M-13), pudiendo exponer HTML de error o tracebacks internos al frontend.

---

*Fin del informe de auditoría. Total: 36 hallazgos (5 CRÍTICOS, 11 ALTOS, 12 MEDIOS, 8 BAJOS).*
