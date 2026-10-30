# TrackFlow Support Agent: memoria y auto-mejora

## Alcance y límites

La memoria persistente guarda únicamente hechos operativos reutilizables aprobados
explícitamente por el usuario autenticado: reglas de cobertura/asignación de carrier,
patrones recurrentes de incidentes y preferencias de informes B2B. No modifica el
corpus RAG, Qdrant ni colecciones `*_knowledge`; la documentación oficial sigue siendo
la fuente de verdad.

Se excluyen direcciones exactas de cualquier cliente (B2C y B2B), rutas o ubicaciones
internas del almacén, incidencias aisladas de un paquete y contratos activos en
negociación. La validación ocurre antes de insertar una propuesta o una entrada activa.
El mensaje de origen y la decisión se someten además a redacción defensiva antes de
persistirse en auditoría.

## Flujo de consentimiento

1. Una respuesta estructurada puede incluir una propuesta tipada opcional. Los hechos
   que solo estén en documentos y no en el mensaje actual no se proponen.
2. La propuesta queda pendiente en la conversación autenticada y se solicita permiso.
3. En el siguiente turno de la misma conversación, un clasificador JSON distingue
   aprobación, rechazo, edición o ambigüedad. Solo una decisión inequívoca de confianza
   >= 0.8 puede aprobar. Una edición vuelve a validarse; ambigüedad y errores se
   rechazan por defecto.
4. La resolución y el audit log ocurren dentro de una transacción SQLite inmediata.
   Una propuesta solo pendiente no se incluye en recuperación.
5. La memoria activa se consulta por actor, pertinencia textual y límite de cinco
   resultados; se entrega como contexto auxiliar, nunca se concatena íntegramente al
   prompt del sistema. Cada usuario autenticado tiene su espacio separado.

El `conversation_id` es un UUID validado. Backoffice conserva el `thread_id` devuelto
por la API para enlazar la respuesta de consentimiento al turno previo. La identidad
del actor procede del JWT validado por la API; no se acepta identidad suministrada en
el body. Tokens de acceso no se escriben en checkpoints, memoria o auditoría.

## Almacenamiento, retención y consolidación

La base SQLite dedicada es `agent_memory.sqlite3` bajo `SUPPORT_AGENT_STATE_DIR`, con
permisos privados del directorio. No comparte el almacén Qdrant ni el de checkpoints.
Las entradas activas se consolidan por `(actor_id, category, key)` (una corrección
nueva sustituye la versión anterior de esa clave). Caducidades máximas:

| Categoría | Caducidad activa máxima |
| --- | ---: |
| `carrier_rule` | 90 días |
| `recurring_incident` | 30 días |
| `b2b_report_preference` | 180 días |

Las entradas caducadas se eliminan de la tabla activa al consultarla. La auditoría de
propuestas, decisiones y resultados se conserva indefinidamente, según la decisión
de producto para este hito. Incluye el JSON estructurado de la propuesta, resultado,
contenido aprobado si procede, y mensajes de origen/decisión redactados. Las entradas
rechazadas no se convierten en recuerdos activos.

## Autoevaluación de propuestas

### Deben poder generar propuesta (con consentimiento posterior)

1. “En realidad SEUR ya no cubre esa zona rural de Zaragoza, hay que usar el carrier
   local desde el mes pasado.” — regla de cobertura que debe describir carrier y zona.
2. “Esos retrasos en incidencias de Los Ángeles esta semana son por la huelga
   portuaria, no por un problema nuestro — ya van tres tickets sobre lo mismo.” —
   causa común y patrón repetido; vence en 30 días.
3. “El cliente B2B de cosméticos siempre quiere su reporte mensual con el desglose de
   devoluciones primero, antes que el volumen de envíos.” — preferencia recurrente,
   sin registrar identidad/dirección personal.

### No deben generar propuesta

1. “¿Dónde está el paquete con tracking XJ4471?” — consulta de un envío individual.
2. “Perfecto, ya quedó resuelto.” — cierre sin regla reusable.
3. “Tradúceme esto al inglés para el cliente.” — tarea de una sola ocasión.

También se deben rechazar una dirección exacta aunque pertenezca a una marca B2B,
una ruta/pasillo/muelle interno, una queja aislada y cualquier contrato activo en
negociación, aun si el modelo los etiqueta incorrectamente como categoría permitida.

## Evidencia y pruebas

Las pruebas deterministas de `tests/pipelines/test_support_agent_memory.py` cubren
ciclos aprobado/rechazado, ambigüedad, edición inválida, aislamiento por actor,
consolidación, expiración y exclusión de datos prohibidos. Las pruebas no contactan un
LLM real; prueban la política de store con decisiones tipadas. La evaluación semántica
del modelo requiere credenciales/servicio y debe comprobar los ejemplos anteriores en
un harness separado antes de desplegar cambios del prompt o clasificador.

Ejecución focalizada:

```sh
uv run --no-sync python -m pytest tests/pipelines/test_support_agent_memory.py tests/pipelines/test_support_agent.py -q
```