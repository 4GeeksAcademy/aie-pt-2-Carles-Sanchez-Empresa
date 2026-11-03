# Evidencia de ciclos de memoria

Tipo: pruebas deterministas locales de `MemoryStore` (no es una E2E desplegada ni
invoca un LLM). Base de pruebas: `tests/pipelines/test_support_agent_memory.py`.

## Ciclo aprobado

- Actor `user-1`, conversación UUID nueva.
- Propuesta: `carrier_rule`, clave `SEUR-ZGZ-rural`, regla reutilizable sobre cobertura
  de carrier, caducidad 90 días.
- Mensaje: “Sí, recuérdalo.”; decisión estructurada approve, confianza 0.99.
- Resultado verificado: evento `proposed` seguido de `approve`; la entrada aparece al
  recuperar “cobertura SEUR Zaragoza”; el JSON completo de propuesta está en auditoría.

## Ciclo rechazado

- Actor `user-1`, conversación UUID nueva, misma clase de propuesta.
- Mensaje: “No, no lo guardes.”; decisión reject, confianza 0.99.
- Resultado verificado: evento `proposed` seguido de `reject`; `active("user-1")` queda
  vacío.

## Comando reproducible

```sh
uv run --no-sync python -m pytest tests/pipelines/test_support_agent_memory.py -q
```

Las pruebas comprueban comportamiento y aislamiento; no son capturas de datos de
producción ni demuestran calidad semántica de un modelo externo.