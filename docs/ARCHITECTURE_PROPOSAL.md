# Propuesta de Arquitectura Backend — TrackFlow

> **Estado**: ⏳ Pendiente de revisión y aprobación  
> **Versión**: 1.0  
> **Fecha**: 2026-08-12

---

## 1. Contexto

Según la documentación del proyecto (`projectbrief.md`), TrackFlow opera en dos mercados (EE. UU. y España) con almacenes en Los Ángeles y Zaragoza. Es una empresa de logística de última milla y gestión de almacenes que da servicio a marcas de e-commerce.

El equipo de TrackFlow Tech tiene el mandato de construir los sistemas, las integraciones y las automatizaciones que permitan a TrackFlow operar como una empresa logística moderna.

### Problemas documentados

| Área | Problema |
|---|---|
| **Operaciones de Almacén** | Dos sistemas distintos sin visión compartida del inventario |
| **Última Milla y Transportistas** | Gestión manual de 8 transportistas (UPS, FedEx, MRW, SEUR…) |
| **Logística Inversa** | Devoluciones (18–25 % del volumen) requieren revisión humana completa |
| **Atención al Cliente** | Consultas repetitivas respondidas una a una |
| **Dirección Ejecutiva** | Informe semanal ensamblado a mano |
| **Tecnología** | Arquitectura *patchwork*: integraciones rápidas, no documentadas, sin telemetría |

---

## 2. Alternativas consideradas

### 2.1 MVC (Model-View-Controller)

| Aspecto | Descripción |
|---|---|
| **Estructura** | Modelos que acceden a datos, controladores que reciben peticiones HTTP, vistas que renderizan respuesta |
| **Ventaja** | Ampliamente conocido, fácil de prototipar |
| **Riesgo** | La lógica de negocio se mezcla con los controladores; las integraciones externas no tienen un lugar claro; cada nuevo canal (cola, webhook, agente) requiere reestructurar |
| **Valoración para TrackFlow** | No resuelve el problema de las múltiples integraciones externas (8 transportistas, 2 WMS, ERP) |

### 2.2 Arquitectura en Capas (Layered)

| Aspecto | Descripción |
|---|---|
| **Estructura** | Controllers → Services → Repositories → DB, con dependencia descendente |
| **Ventaja** | Separa responsabilidades de forma clara, más ordenada que MVC |
| **Riesgo** | Las integraciones externas (transportistas, almacenes) terminan acopladas a los servicios; el dominio depende de la infraestructura |
| **Valoración para TrackFlow** | Mejora el orden, pero los 8 transportistas, el ERP legacy y los dos WMS seguirían acoplados a la lógica de negocio |

### 2.3 Hexagonal (Ports & Adapters)

| Aspecto | Descripción |
|---|---|
| **Estructura** | El dominio de negocio está en el centro, sin depender de nada externo. Los **puertos** son interfaces que definen contratos. Los **adaptadores** implementan esos contratos (HTTP, bases de datos, APIs externas) |
| **Ventaja** | El negocio se mantiene aislado de los sistemas externos; cambiar un transportista, un WMS o la base de datos no afecta al dominio |
| **Valoración para TrackFlow** | Se alinea con los problemas documentados: integraciones frágiles y múltiples sistemas externos que cambian con el tiempo |

---

## 3. Recomendación: Arquitectura Hexagonal

Basándose en los problemas documentados de TrackFlow, la arquitectura hexagonal es la opción más adecuada por los siguientes motivos:

### 3.1 Aislamiento frente a integraciones externas

TrackFlow depende de múltiples sistemas externos que la documentación menciona explícitamente:

- **8 transportistas** (UPS, FedEx, MRW, SEUR…)
- **2 sistemas de almacén** distintos (Los Ángeles y Zaragoza)
- **ERP de principios de los años 2010**
- **Integraciones construidas con rapidez y sin documentar**

Con hexagonal, cada integración externa se implementa como un **adaptador** que cumple un **puerto** (interfaz). Si cambia un transportista, se unifican los WMS o se sustituye el ERP, solo se modifica el adaptador correspondiente. El núcleo de negocio permanece intacto.

### 3.2 Separación por dominios de negocio

La organización de TrackFlow está dividida en áreas con problemas claramente diferenciados:

- **Operaciones de Almacén** — inventario y stock
- **Última Milla** — envíos y transportistas
- **Logística Inversa** — devoluciones y reacondicionamiento
- **Atención al Cliente** — consultas y notificaciones
- **Dirección Ejecutiva** — informes y métricas

Hexagonal permite modelar cada área como un **dominio independiente** con sus propios puertos y casos de uso, sin que las reglas de un dominio se filtren en otro.

### 3.3 Testabilidad de las reglas de negocio

Las reglas de dominio de TrackFlow (selección de transportista, triaje de devoluciones, validación de inventario) pueden probarse sin necesidad de base de datos, servidor HTTP ni conexiones externas. Esto es crítico para mantener la calidad a medida que el sistema crece.

### 3.4 Adaptación a múltiples canales de entrada

El monorepo ya contempla que el backend reciba peticiones desde distintos frentes:

| Canal | Procedencia |
|---|---|
| **HTTP (REST)** | Backoffice, Talent Pipeline Tracker, website |
| **Agentes de IA** | Carpeta `agents/` del monorepo |
| **Workflows** | Carpeta `workflows/` del monorepo |
| **Integraciones externas** | Transportistas, WMS, ERP |

Hexagonal trata todos estos canales como **adaptadores de entrada**, de modo que añadir uno nuevo no requiere cambios en el dominio.

### 3.5 Correspondencia con la estructura del monorepo

La carpeta `services/` ya está preparada para alojar los servicios backend. La documentación de `services/README.md` indica:

> *"Cada subcarpeta dentro de `services/` debe corresponder a **un servicio concreto** (por ejemplo `admin-api`, `data-processor-worker`) e incluir su propia documentación técnica y funcional."*

El código de dominio existente en `src/` (tipos, validaciones, transformaciones, colecciones, búsqueda) puede servir como base para el núcleo de negocio del servicio, manteniendo `src/` como la fuente de verdad que ya es.

### 3.6 FastAPI como estándar para la capa HTTP

Para la implementación del backend se utilizará **FastAPI** como framework de entrada HTTP por su buen soporte de tipado, validación de datos y documentación automática de contratos.

Dentro de la arquitectura hexagonal, FastAPI se considera un **adaptador de entrada**: recibe peticiones, valida el input y delega en los casos de uso de aplicación. No debe contener reglas de negocio ni acceso directo a sistemas externos.

---

## 4. Estructura de carpetas propuesta

Basándose en la estructura actual del monorepo, se propone la siguiente organización dentro de `services/`:

```
services/
├── README.md
└── tracking-api/                    ← Primer servicio (API de seguimiento)
    ├── pyproject.toml
    ├── app/
    │   ├── main.py                  ← Punto de entrada FastAPI
    │   ├── application/             ← Casos de uso de la aplicación
    │   │   ├── shipments/
    │   │   ├── returns/
    │   │   ├── inventory/
    │   │   └── customer_care/
    │   ├── domain/                  ← Núcleo de negocio
    │   │   ├── entities/            ← Entidades de dominio
    │   │   ├── value_objects/       ← Objetos valor
    │   │   ├── services/            ← Servicios de dominio puros
    │   │   └── ports/               ← Interfaces (puertos)
    │   │       ├── in/
    │   │       └── out/
    │   └── adapters/                ← Implementaciones (adaptadores)
    │       ├── in/
    │       │   ├── http/            ← Routers de FastAPI por dominio
    │       │   ├── events/          ← Consumidores de eventos/webhooks
    │       │   └── schemas/         ← DTOs de entrada/salida
    │       └── out/
    │           ├── repositories/    ← Persistencia (SQL/NoSQL)
    │           ├── carriers/        ← APIs de transportistas
    │           ├── wms/             ← Integración almacenes
    │           ├── erp/             ← Integración ERP legacy
    │           └── notifications/   ← Email, mensajería, alertas
    └── tests/
        ├── unit/
        ├── integration/
        └── e2e/
```

### Descripción de cada capa

| Capa | Propósito |
|---|---|
| **`domain/entities/`** | Entidades del negocio (Shipment, Product, Return, Carrier) con sus invariantes y reglas |
| **`domain/value-objects/`** | Objetos inmutables (TrackingId, Money, Address, Dimensions) |
| **`domain/services/`** | Lógica de negocio pura que no pertenece a una entidad (scoring de transportistas, triaje de devoluciones) |
| **`domain/ports/`** | Interfaces que definen contratos: `in/` (casos de uso), `out/` (repositorios, gateways externos) |
| **`application/`** | Casos de uso que orquestan el flujo: reciben input del adaptador, llaman al dominio, devuelven resultado |
| **`adapters/in/`** | Adaptadores de entrada: controladores HTTP, consumidores de eventos, webhooks |
| **`adapters/out/`** | Adaptadores de salida: repositorios (base de datos), gateways (transportistas), notificaciones |
| **`tests/`** | Tests unitarios (dominio puro), de integración (adaptadores reales) y E2E (API completa) |

### Endpoints propuestos y criterio de organización

Los endpoints HTTP de FastAPI se organizarán por **dominio de negocio** y no por tipo técnico de operación, para que cada router represente una capacidad funcional de TrackFlow.

| Grupo de endpoints | Objetivo de negocio | Endpoints previstos |
|---|---|---|
| **Shipments** | Gestión de envíos y seguimiento de última milla | `GET /shipments`, `GET /shipments/{shipment_id}`, `POST /shipments`, `PATCH /shipments/{shipment_id}/status`, `POST /shipments/{shipment_id}/assign-carrier` |
| **Carriers** | Operación con transportistas y rendimiento | `GET /carriers`, `GET /carriers/{carrier_id}/performance`, `POST /carriers/rate-shipment` |
| **Returns** | Triaje y resolución de devoluciones | `GET /returns`, `GET /returns/{return_id}`, `POST /returns`, `POST /returns/{return_id}/triage`, `PATCH /returns/{return_id}/decision` |
| **Inventory** | Visibilidad unificada de stock entre almacenes | `GET /inventory`, `GET /inventory/{sku}`, `PATCH /inventory/{sku}/adjust`, `POST /inventory/sync` |
| **Customer Care** | Consultas operativas para atención al cliente | `GET /tracking/{tracking_id}`, `GET /customers/{customer_id}/incidents`, `POST /incidents` |
| **Reporting** | Métricas operativas para dirección | `GET /reports/weekly`, `GET /reports/carriers`, `GET /reports/returns` |

**Criterios de organización de endpoints**

- Cada router de FastAPI agrupa casos de uso de un único dominio (shipments, returns, inventory, etc.).
- Los endpoints se diseñan en torno a capacidades del negocio (asignar transportista, triaje de devolución), no alrededor de tablas o servicios internos.
- Los contratos de entrada y salida (DTOs) se definen en adaptadores de entrada y se traducen a comandos/queries del caso de uso.
- La nomenclatura de rutas prioriza recursos estables y acciones explícitas cuando existe un proceso de negocio.

**Criterios de organización de adaptadores**

- Adaptadores de entrada separados por canal: HTTP (FastAPI), eventos y webhooks.
- Adaptadores de salida separados por sistema externo: transportistas, WMS, ERP, repositorios y notificaciones.
- Un puerto de salida por capacidad del dominio; múltiples adaptadores pueden implementar el mismo puerto (por ejemplo, un adaptador por transportista).
- La lógica de resiliencia técnica (reintentos, timeouts, circuit breakers) vive en adaptadores, nunca en el dominio.

---

## 5. Organización de aplicaciones cuando frontend y backend están separados

Para TrackFlow se contemplan dos formas válidas de organización cuando frontend y backend se operan como sistemas independientes: **monorepo** y **repositorios separados**. En ambos casos, la separación lógica entre UI y API se mantiene a nivel de despliegue, ownership y ciclo de vida.

### 5.1 Opción A: Monorepo con sistemas separados

- Frontends en `uis/` y backend en `services/`, cada uno con su propio pipeline de build y release.
- Versionado coordinado en un único repositorio, pero con despliegues desacoplados por aplicación.
- Contratos API compartidos mediante documentación y, cuando aplique, esquemas en `packages/shared/`.
- Ventaja principal: trazabilidad integral de cambios entre producto, API y dominio.

### 5.2 Opción B: Repositorios separados

- Un repositorio dedicado para frontend y otro para backend.
- Cada equipo gestiona su roadmap, versionado y políticas de despliegue de forma independiente.
- La integración se gobierna por contratos API versionados (por ejemplo, versión de ruta o política de compatibilidad hacia atrás).
- Ventaja principal: autonomía de equipos y ciclos de entrega aislados.

### 5.3 Criterio de decisión entre monorepo y repos separados

- Elegir **monorepo** si se prioriza velocidad de coordinación y cambios frecuentes frontend-backend en la misma iniciativa.
- Elegir **repos separados** si se prioriza independencia organizativa, seguridad por perímetro y cadencias de entrega distintas.
- Mantener la misma arquitectura hexagonal del backend en ambos modelos; solo cambia el modelo de gobernanza del código.

### 5.4 Comunicación API entre frontend y backend

- El frontend consume exclusivamente endpoints públicos del backend FastAPI mediante HTTPS.
- Se define un prefijo estable de API (por ejemplo, `/api/v1`) para facilitar versionado y transición sin romper clientes.
- Se recomienda uso de API Gateway o reverse proxy para centralizar enrutado, autenticación transversal, rate limiting y observabilidad.
- Los errores y códigos HTTP deben estar estandarizados para todos los dominios (shipments, returns, inventory, etc.).

### 5.5 Variables de entorno y configuración

- Cada sistema (frontend y backend) mantiene su propio conjunto de variables de entorno por entorno (`dev`, `staging`, `prod`).
- Backend: variables para conexión a base de datos, credenciales de transportistas, integración WMS/ERP y claves de notificación.
- Frontend: variables públicas mínimas para URL base de API y flags de funcionalidades de interfaz.
- Nunca compartir secretos del backend con el frontend; solo exponer configuración pública estrictamente necesaria.
- La estrategia recomendada es gestión centralizada de secretos (vault/secret manager) y rotación periódica.

### 5.6 Política de CORS

- CORS se configura en backend como lista explícita de orígenes permitidos por entorno.
- Se permiten únicamente métodos y cabeceras necesarios para la operación de cada frontend.
- No usar comodines amplios en producción (`*`) cuando existan credenciales o sesiones.
- El contrato CORS debe acompañar el proceso de onboarding de nuevas UIs para evitar bloqueos en despliegues.

### 5.7 Recomendación para TrackFlow

En la etapa actual del proyecto, se recomienda mantener **monorepo con despliegues separados** para frontend y backend: permite colaboración rápida entre equipos y reduce fricción de integración. Si en fases posteriores crecen los equipos o los requisitos de cumplimiento, se puede evolucionar a repositorios separados manteniendo los mismos contratos API y la misma estructura hexagonal en backend.

---

## 6. Estrategia de implementación

Se propone una adopción incremental, priorizando los problemas más urgentes documentados en el proyecto:

| Fase | Prioridad | Dominio | Problema que aborda |
|---|---|---|---|
| **1** | Alta | Última Milla | Gestión manual de 8 transportistas |
| **2** | Alta | Logística Inversa | Devoluciones con revisión humana completa |
| **3** | Media | Operaciones de Almacén | Dos WMS sin visión compartida de inventario |
| **4** | Media | Atención al Cliente / Dirección | Consultas repetitivas e informe manual |

Cada fase produce un servicio o funcionalidad que se integra dentro de `services/`, reutilizando tipos y lógica de `src/` y `packages/shared/` cuando sea posible.

---

## 7. Riesgos y puntos de atención

Aunque la propuesta reduce acoplamiento y mejora escalabilidad, su valor depende de la disciplina de implementación. Si el equipo no sigue la estructura propuesta, pueden aparecer los siguientes riesgos:

### 7.1 Riesgo de volver al acoplamiento con sistemas externos

- Si se coloca lógica de negocio dentro de routers de FastAPI o dentro de adaptadores de salida, el dominio deja de ser independiente.
- Consecuencia: cambiar un transportista, el WMS o el ERP obliga a modificar múltiples capas y aumenta el riesgo de regresiones.

### 7.2 Riesgo de contratos API inconsistentes

- Si cada equipo expone endpoints sin criterio común de versionado, naming y errores HTTP, los frontends tendrán integraciones frágiles.
- Consecuencia: incremento de incidencias en despliegue, retrabajo entre equipos y degradación de la experiencia del cliente.

### 7.3 Riesgo operativo por configuración insegura

- Si no se separan correctamente variables de entorno y secretos entre frontend y backend, existe exposición accidental de credenciales.
- Si CORS se configura con reglas demasiado amplias en producción, se incrementa la superficie de ataque.
- Consecuencia: incidentes de seguridad, incumplimiento de políticas internas y necesidad de respuestas de emergencia.

### 7.4 Riesgo de pérdida de trazabilidad en escalado organizativo

- Si no se respetan límites claros entre dominios y adaptadores, cada cambio transversal requerirá coordinación manual intensiva.
- Consecuencia: caída de velocidad de entrega, más dependencias entre equipos y mayor coste de mantenimiento.

### 7.5 Puntos de atención recomendados

- Revisiones de arquitectura por PR para validar que la lógica de negocio no sale del dominio.
- Checklist de API governance (versionado, contratos de error, naming) antes de publicar endpoints.
- Política obligatoria de secretos y CORS por entorno, auditada en cada despliegue.
- Métricas de calidad técnica por dominio (tiempo de cambio, incidencias por integración, cobertura de tests).

---

## 8. Próximos pasos

1. ✅ **Revisión** de esta propuesta por el equipo técnico.
2. ✏️ **Aprobación** de la arquitectura y la estructura de carpetas.
3. 🚀 **Implementación de la Fase 1**: primer servicio en `services/` centrado en la gestión de envíos y transportistas.

---

> *Propuesta redactada por TrackFlow Tech basada en la documentación del proyecto. Pendiente de revisión y aprobación.*