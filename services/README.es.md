# Carpeta `services`

Esta carpeta contiene **todos los servicios backend** (APIs y workers en segundo plano) relacionados con la compañía para el proyecto transversal de AI Engineering.

Cada subcarpeta dentro de `services/` debe corresponder a **un servicio concreto** (por ejemplo `admin-api`, `data-processor-worker`) e incluir su propia documentación técnica y funcional.

- **Propósito principal**: centralizar toda la lógica backend, APIs y consumidores de colas que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) los servicios que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlos.

## Control de trabajos batch

`services/job_runner.py` encapsula la máquina de estados de `job_runs` para el
proceso nocturno. La tabla se crea con `services/migrations/001_create_job_runs.sql`.
La API no ejecuta este trabajo; consulta [`docs/NIGHTLY_EXPORT.md`](../docs/NIGHTLY_EXPORT.md)
para el diseño y la operación.
