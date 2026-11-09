# Implementación Parte 3 — aprobación RFP

## Estado verificado

Este slice implementa la aprobación humana por sección sobre el intake y generación existentes. El motor SQL es fuente de verdad de negocio y LangGraph aporta pausa/reanudación por rama; no se añade un servicio.

- Contrato y persistencia: estados `waiting_for_approval`/`done`, decisión, aprobador, comentario, iteración y thread por sección, propuesta final y trazas `rfp_node_traces`/`RfpApprovalTrace`. La migración `services/migrations/004_rfp_approval.sql` incluye la columna de request id y los estados legacy se convierten antes del nuevo constraint.
- Pausa/reanudación: `rfp_approval_graph.py` usa `interrupt()`/`Command(resume=...)` y `SqliteSaver`. Namespace: `rfp-{ticket_id}:{department_id}:approval-{iteration}`; la prueba usa SQLite temporal.
- Decisiones: `approve`, `reject`, `request_changes`. Esta última reejecuta el ciclo acotado de Parte 2 solo para la sección afectada y crea nueva iteración/checkpoint si vuelve a ser aprobable.
- Aprobadores configurados: Ana Whitfield (Warehouse), Carlos Vega (Last Mile), Sofía Ramos (Reverse); Miguel Torres arbitra conflictos transversales.
- Conflictos: moneda, promesa de devolución inferior a 48 horas y `volume-vs-capacity` desde `evaluation_results.conflict_triggers` estructurados. Los conflictos bloquean la publicación.
- Trazas: instrumentación seleccionada de intake, generación y aprobación; serialización acotada. La conversión registra ruta/métricas, no el texto completo del PDF.
- Backoffice: etiquetas para `waiting_for_approval` y `done`, y `request_id` por envío HTTP.

## Comportamiento implementado en el slice

- IDs de rama con forma `rfp-{ticket_id}:{department_id}` y estado de pausa almacenado por departamento.
- Aprobadores de sección configurados: Ana Whitfield (Warehouse), Carlos Vega (Last Mile), Sofía Ramos (Reverse). Miguel Torres queda como árbitro de conflictos transversales.
- Decisiones soportadas: `approve`, `reject`, `request_changes`; la regeneración reutiliza el ciclo acotado de Parte 2 y no vuelve a generar las demás secciones.
- Detección determinista de `currency-mismatch`, promesas de devoluciones inferiores a 48 horas y triggers estructurados `volume-vs-capacity`.
- La propuesta se persiste solo al estar aprobadas todas las secciones activas y no haber conflictos.
- La migración debe aplicarse antes de desplegar el código nuevo.
- `tests/pipelines/test_rfp_end_to_end.py` recorre intake de PDF (con conversor, clasificador y workers fake), generación/evaluación Parte 2 (fakes), gate y aprobación fuera de orden de dos departamentos. Comprueba que una rama aprobada no desbloquea la pendiente y que la propuesta final/traza aparecen solo al cerrar ambas.
- `tests/pipelines/test_rfp_api.py` cubre inicio y decisión por HTTP, rechazo de usuarios sin rol admin, validación del aprobador asignado, independencia entre departamentos y respuesta con propuesta/trazas.
- Los casos HTTP verifican que una decisión desconocida y una decisión duplicada devuelvan conflicto, que un rechazo bloquee la publicación, que una moneda discordante quede bajo arbitraje y que Reverse no publique si promete devoluciones en menos de 48 horas.
- El ciclo HTTP de `request_changes` regenera únicamente el departamento solicitado, pasa el comentario del aprobador como feedback inicial, vuelve a dejar la sección pendiente y permite publicar después de la nueva aprobación junto con las demás secciones. La prueba verifica que el borrador e iteraciones de la otra sección no cambian.

## Revisión humana final y documento

- Cuando se aprueban todas las secciones y no hay conflictos, el ticket queda en `needs_human_review`; las aprobaciones departamentales no lo completan automáticamente.
- El endpoint `POST /tickets/{ticket_id}/human-review` permite editar metadata y borradores con lista blanca, devolver el ticket al cliente, aprobar o archivar/descartar. Las decisiones humanas guardan actor, comentario, fecha y traza.
- La aprobación compone el Markdown desde los valores actuales (incluidos los editados), lo guarda en `RAW_DATA_DIR/final/{ticket_id}.md` y cambia el estado a `done`. `GET /tickets/{ticket_id}/final-document` entrega el archivo aprobado.
- El caso completo reproducible, la RFP de ejemplo, las aprobaciones simuladas y el Markdown resultante están documentados en [`RFP_HUMAN_REVIEW_PR_EXAMPLE.md`](RFP_HUMAN_REVIEW_PR_EXAMPLE.md). La integración verifica además que una edición de volumen y borrador se refleja en el documento final persistido.
- No hay todavía transición de reanudación del flujo tras `returned_to_client`; esa respuesta debe considerarse un estado de espera manual, no una resubmission automatizada.

## Validación ejecutada en esta revisión

- `.venv/bin/python -m pytest tests/pipelines/test_rfp_*.py -q`: **83 passed, 1 warning** (deprecación Starlette/AnyIO en TestClient).
- `.venv/bin/python -m compileall -q` sobre módulos de aprobación, grafo, trazas, intake, generación y tests RFP afectados: correcto.
- `git diff --check`: correcto.
- `npm run build --workspace @trackflow/backoffice`: Next.js compiló, pero el build no pasó el type-check global. Los errores reportados incluyen `EnsureStatic` en `.next/dev/types`, `LayoutShift`, `durationThreshold` y un formatter en `app/telemetry/page.tsx`. No se afirma que el build completo del backoffice esté validado.

## Ocho controles auditados y límites

1. **Migración/esquema:** definida y alineada con modelos/fixtures, pero no ejecutada contra PostgreSQL/Supabase; revisar constraints y datos existentes en staging antes de desplegar.
2. **Checkpoint:** probado con SQLite local; `RFP_CHECKPOINT_DB` permite configurar la ruta y el default es `data/rfp_approval_checkpoints.sqlite`. No se verificó almacenamiento compartido durable para Docker/multi-instancia.
3. **Identidad:** requiere rol admin y valida el nombre asignado, pero la identidad todavía no está ligada a SSO/actor autenticado y no debe confiarse en el nombre del navegador en producción.
4. **Idempotencia:** `request_id` permite replay secuencial de la última solicitud por sección. No existe ledger durable de claves/respuestas ni locking/claim transaccional; no está demostrado ante decisiones concurrentes.
5. **Arbitraje:** volumen/capacidad requiere el contrato estructurado del productor; no se infiere desde prosa. Hay prueba de un caso de arbitraje/bloqueo, no de todos los escenarios del BRIEFING.
6. **Trazas:** funcionalmente instrumentadas y acotadas, pero faltan validaciones de privacidad, retención, volumen y rendimiento de producción.
7. **UI:** cambios realizados, pero el type-check global del backoffice está bloqueado por los errores descritos arriba; no hay prueba de navegador reportada.
8. **Cobertura/despliegue:** pasan todos los tests `tests/pipelines/test_rfp_*.py`; no se ejecutó la suite total del repositorio, prueba de carga, migración real PostgreSQL ni restart/multi-instancia.

## Requisitos antes de producción

- Vincular el usuario autenticado/SSO al aprobador permitido y eliminar la confianza en `approver_name` enviado por el navegador.
- Añadir deduplicación persistente y serialización/locking por sección/ticket, junto con una prueba concurrente.
- Configurar y probar un checkpointer durable compartido o un volumen persistente con garantías operativas adecuadas.
- Aplicar migración en staging PostgreSQL; completar regresión, carga y revisión de privacidad/retención de trazas.
- Resolver los errores globales de type-check del backoffice y repetir build.
