# Ejemplo reproducible: revisión humana final de una RFP

Este ejemplo cubre el recorrido desde el intake hasta el documento aprobado. Es determinista y no llama a servicios externos: el conversor, clasificador, workers de análisis, generador y evaluador se simulan dentro del test. El almacenamiento usa una base SQLite temporal.

## RFP de entrada (texto extraído del PDF simulado)

> ModaViva solicita almacenamiento y preparación de pedidos en Estados Unidos. Necesitamos cobertura de entregas y un volumen mensual por confirmar.

La clasificación simulada detecta cliente `ModaViva`, país `US`, servicios `warehousing` y `delivery`, volumen todavía no indicado y departamentos `warehouse` y `lastmile`.

## Aprobaciones departamentales simuladas

1. **Last Mile — Carlos Vega:** `approve`, sin comentario. La sección queda aprobada de forma independiente; el ticket continúa `waiting_for_approval` porque Warehouse sigue pendiente.
2. **Warehouse — Ana Whitfield:** `approve`, sin comentario. Con ambas secciones aprobadas y sin conflictos, el sistema compone la propuesta y deja el ticket en `needs_human_review` (no lo marca como terminado).
3. **Revisión humana final — usuario simulado `simulated-reviewer`:** edita el volumen a `12000` y el borrador de Warehouse a “Almacenamiento en USD; capacidad para 12.000 pedidos mensuales.”; después ejecuta `approve`. El estado final es `done` y se escribe el Markdown en `RAW_DATA_DIR/final/{ticket_id}.md`.

## Documento final generado

El test compara el contenido exacto devuelto con el almacenado en el archivo descargable. El identificador del ticket es dinámico y no forma parte del documento.

```markdown
# Propuesta final RFP

## Datos de la solicitud
- Cliente: ModaViva
- País: US
- Servicios: warehousing, delivery
- Volumen mensual: 12000
- Fecha límite: No especificada
- Presupuesto: No especificado

---

## warehouse

Almacenamiento en USD; capacidad para 12.000 pedidos mensuales.

---

## lastmile

Entregas en USD; SLA y cobertura por confirmar.
```

## Reproducir

Desde la raíz del repositorio:

```bash
.venv/bin/python -m pytest 'tests/pipelines/test_rfp_end_to_end.py::test_rfp_ticket_runs_from_intake_to_independent_final_approval' -q
```

La integración está en [`tests/pipelines/test_rfp_end_to_end.py`](../tests/pipelines/test_rfp_end_to_end.py), en `test_rfp_ticket_runs_from_intake_to_independent_final_approval`. Valida el intake, generación, aprobaciones fuera de orden e independencia de departamentos, gate de revisión humana, edición antes de aprobar y persistencia del documento final.
