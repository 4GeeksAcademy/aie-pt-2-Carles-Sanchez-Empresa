# Plan de Telemetría — TrackFlow

> **Versión:** 1.0
> **Fecha:** 2026-09-10
> **Autor:** Plan de Telemetría — TrackFlow Tech
> **Estado:** Borrador para revisión

---

## Índice

1. [Introducción](#1-introducción)
2. [Fase 1 — Catálogo exhaustivo de oportunidades de datos](#2-fase-1--catálogo-exhaustivo-de-oportunidades-de-datos)
   - [2.1 Métricas obligatorias (desde CONTEXT-empresa.md)](#21-métricas-obligatorias-desde-context-empresamd)
   - [2.2 Oportunidades identificadas — Inventario](#22-oportunidades-identificadas--inventario)
   - [2.3 Oportunidades identificadas — Autenticación](#23-oportunidades-identificadas--autenticación)
   - [2.4 Oportunidades identificadas — Rendimiento](#24-oportunidades-identificadas--rendimiento)
   - [2.5 Oportunidades identificadas — Errores](#25-oportunidades-identificadas--errores)
   - [2.6 Oportunidades identificadas — Navegación](#26-oportunidades-identificadas--navegación)
   - [2.7 Resumen del catálogo](#27-resumen-del-catálogo)
3. [Fase 2 — Diseño del Event Envelope](#3-fase-2--diseño-del-event-envelope)
   - [3.1 Event Envelope estándar](#31-event-envelope-estándar)
   - [3.2 Esquemas de eventos — Inventario (obligatorios)](#32-esquemas-de-eventos--inventario-obligatorios)
   - [3.3 Esquemas de eventos — Inventario (oportunidades)](#33-esquemas-de-eventos--inventario-oportunidades)
   - [3.4 Esquemas de eventos — Autenticación](#34-esquemas-de-eventos--autenticación)
   - [3.5 Esquemas de eventos — Rendimiento](#35-esquemas-de-eventos--rendimiento)
   - [3.6 Esquemas de eventos — Errores](#36-esquemas-de-eventos--errores)
   - [3.7 Esquemas de eventos — Navegación](#37-esquemas-de-eventos--navegación)
   - [3.8 Eventos descartados y su justificación](#38-eventos-descartados-y-su-justificación)
4. [Fase 3 — Estrategia de entrega](#4-fase-3--estrategia-de-entrega)
   - [4.1 Decisión stream vs. batch](#41-decisión-stream-vs-batch)
   - [4.2 Estrategia de throttle/debounce](#42-estrategia-de-throttledebounce)
   - [4.3 Riesgos y exclusiones](#43-riesgos-y-exclusiones)
5. [Fase 4 — Actualización del Memory Bank](#5-fase-4--actualización-del-memory-bank)

---

## 1. Introducción

TrackFlow gestiona almacenes y última milla para marcas de moda, electrónica y cosmética, operando entre Los Ángeles y Zaragoza. El sistema de inventario es el corazón operativo de la compañía.

Tras semanas con el sistema de inventario en producción, el equipo de operaciones necesita respuestas a preguntas que hoy no se pueden responder: volumen de órdenes, errores de validación, intentos de modificación directa de stock, alertas de stock mínimo, y comportamiento de los usuarios en el backoffice.

Este plan de telemetría identifica de forma exhaustiva qué datos vale la pena capturar —hoy y en el futuro— antes de escribir una sola línea de instrumentación. Está estructurado en tres fases: (1) catálogo de oportunidades, (2) diseño del Event Envelope y esquemas, y (3) estrategia de entrega.

### Regla de oro aplicada

Cada evento incluido en este plan completa la frase:

> *"Capturamos `[event_type]` porque necesitamos saber `[hipótesis]`, lo que nos permite tomar la decisión `[decisión concreta]`."*

Si un evento candidato no puede completar esta frase, se descarta.

---

## 2. Fase 1 — Catálogo exhaustivo de oportunidades de datos

### 2.1 Métricas obligatorias (desde CONTEXT-empresa.md)

Estas 5 métricas son el **piso mínimo** del plan. Vienen exigidas por el RFI del equipo de gestión y deben instrumentarse sin falta.

| # | `event_type` | Tipo | Categoría | Hipótesis | Decisión |
|---|---|---|---|---|---|
| **M1** | `inbound_order_created` | **Obligatorio** | Inventario / Negocio | Necesitamos saber cuánto volumen de mercancía entra, por cliente y por almacén | Planificar capacidad de almacén y personal según el volumen entrante (Ana) |
| **M2** | `outbound_order_created` | **Obligatorio** | Inventario / Negocio | Necesitamos saber cuántos pedidos se procesan, por cliente y almacén, y a qué ritmo | Detectar cuellos de botella operativos antes de que afecten el SLA de entrega (Ana) |
| **M3** | `stock_threshold_triggered` | **Obligatorio** | Inventario / Negocio | Necesitamos saber con qué frecuencia un cliente se queda sin stock disponible de un SKU | Alertar al cliente y al equipo comercial antes de un quiebre de stock (Miguel) |
| **M4** | `direct_stock_edit_rejected` | **Obligatorio** | Inventario / Cumplimiento | Necesitamos saber si el personal de almacén intenta saltarse el control de trazabilidad | Reforzar capacitación o permisos en el almacén donde esto ocurra con más frecuencia |
| **M5** | `inventory_discrepancy_detected` | **Obligatorio** | Inventario / Auditoría | Necesitamos saber en qué SKUs y almacenes ocurren más discrepancias entre el stock del sistema y el stock real | Priorizar auditorías de inventario en los SKUs con mayor tasa de discrepancia (Ana) |

**Campos `properties` mínimos comunes** (además del envelope estándar):
- `warehouse` (`los_angeles` / `zaragoza`)
- `client_id`
- `product_id` (SKU)
- `product_category`
- `quantity`

> ⚠️ No incluir datos personales del consumidor final (destinatario del paquete).

---

### 2.2 Oportunidades identificadas — Inventario

Eventos adicionales en el dominio de inventario, identificados tras analizar la implementación actual (`routes/inventory.py`, `models.py`, `schemas.py`).

| # | `event_type` | Tipo | Categoría | Hipótesis | Decisión |
|---|---|---|---|---|---|
| **O1** | `inbound_order_cancelled` | Oportunidad | Inventario / Negocio | Necesitamos saber con qué frecuencia las recepciones se cancelan después de creadas | Identificar problemas con proveedores o errores administrativos recurrentes en cada almacén |
| **O2** | `outbound_order_cancelled` | Oportunidad | Inventario / Negocio | Necesitamos saber cuántos despachos se cancelan y por qué motivo | Medir la eficiencia del picking y reducir pedidos fallidos por almacén |
| **O3** | `stock_validation_failed` | Oportunidad | Inventario / Operaciones | Necesitamos saber cuántas veces se intenta crear una orden de salida sin stock suficiente | Identificar SKUs con rotura recurrente y ajustar umbrales mínimos por cliente |
| **O4** | `product_stock_queried` | Oportunidad | Inventario / Operaciones | Necesitamos saber qué SKUs consultan más los operadores durante su jornada | Optimizar la ubicación física en el almacén de los productos más consultados |
| **O5** | `picking_item_not_found` | Oportunidad | Inventario / Auditoría | Necesitamos saber con qué frecuencia un SKU esperado en estantería no se encuentra durante el picking | Investigar discrepancias de ubicación, errores de inventario o posibles pérdidas |

---

### 2.3 Oportunidades identificadas — Autenticación

Identificados tras analizar `routes/auth.py`, `routes/users.py` y los mecanismos de JWT.

| # | `event_type` | Tipo | Categoría | Hipótesis | Decisión |
|---|---|---|---|---|---|
| **O6** | `login_attempted` | Oportunidad | Autenticación / Seguridad | Necesitamos saber el volumen total de intentos de acceso al sistema | Detectar picos de actividad anómalos y posibles ataques de fuerza bruta |
| **O7** | `login_succeeded` | Oportunidad | Autenticación / Uso | Necesitamos saber qué usuarios acceden al sistema y con qué frecuencia | Identificar cuentas inactivas que deberían desactivarse y medir adopción |
| **O8** | `login_failed` | Oportunidad | Autenticación / Seguridad | Necesitamos saber cuántos intentos fallidos de login ocurren por usuario | Bloquear cuentas bajo ataque y reforzar políticas de contraseñas |
| **O9** | `session_expired` | Oportunidad | Autenticación / UX | Necesitamos saber con qué frecuencia las sesiones expiran por inactividad | Ajustar el tiempo de expiración del token JWT si está afectando la productividad |
| **O10** | `password_reset_requested` | Oportunidad | Autenticación / UX | Necesitamos saber cuántos usuarios olvidan su contraseña cada mes | Evaluar si la UX de login es confusa o si hay un problema de retención |
| **O11** | `password_changed` | Oportunidad | Autenticación / Compliance | Necesitamos saber con qué frecuencia los usuarios cambian su contraseña | Medir cumplimiento con políticas de rotación de credenciales |
| **O12** | `account_locked` | Oportunidad | Autenticación / Seguridad | Necesitamos saber qué cuentas quedan bloqueadas por múltiples intentos fallidos | Identificar ataques dirigidos y contactar proactivamente a los usuarios afectados |

---

### 2.4 Oportunidades identificadas — Rendimiento

| # | `event_type` | Tipo | Categoría | Hipótesis | Decisión |
|---|---|---|---|---|---|
| **O13** | `api_latency_recorded` | Oportunidad | Rendimiento / Técnico | Necesitamos saber qué endpoints de la API responden más lento y en qué momentos | Optimizar consultas lentas o escalar infraestructura antes de que afecte a los operadores |
| **O14** | `page_load_timed` | Oportunidad | Rendimiento / UX | Necesitamos saber qué páginas del backoffice cargan más lento para los operadores | Priorizar optimizaciones de frontend donde más impacto tengan |
| **O15** | `slow_query_detected` | Oportunidad | Rendimiento / Técnico | Necesitamos saber qué consultas a Supabase superan los 500ms | Añadir índices o reescribir queries antes de que degraden el rendimiento general |
| **O16** | `api_dependency_failed` | Oportunidad | Rendimiento / Técnico | Necesitamos saber si Supabase, el servicio de email o alguna dependencia externa falla | Alertar al equipo técnico antes de que los operadores reporten el problema por WhatsApp |

---

### 2.5 Oportunidades identificadas — Errores

| # | `event_type` | Tipo | Categoría | Hipótesis | Decisión |
|---|---|---|---|---|---|
| **O17** | `frontend_error_captured` | Oportunidad | Errores / Técnico | Necesitamos saber qué errores JavaScript no capturados ocurren en el frontend | Corregir bugs que los operadores no reportan formalmente |
| **O18** | `api_error_returned` | Oportunidad | Errores / Técnico | Necesitamos saber qué errores 4xx/5xx devuelve la API y con qué frecuencia | Identificar endpoints frágiles o malos usos del sistema por parte de los usuarios |
| **O19** | `validation_error_occurred` | Oportunidad | Errores / UX | Necesitamos saber qué campos del sistema generan más errores de validación | Simplificar formularios o mejorar la documentación de los campos problemáticos |
| **O20** | `unauthorized_access_attempted` | Oportunidad | Errores / Seguridad | Necesitamos saber cuántas veces un usuario intenta acceder a un recurso sin permisos | Detectar intentos de escalada de privilegios o configuraciones incorrectas de roles |

---

### 2.6 Oportunidades identificadas — Navegación

| # | `event_type` | Tipo | Categoría | Hipótesis | Decisión |
|---|---|---|---|---|---|
| **O21** | `page_viewed` | Oportunidad | Navegación / UX | Necesitamos saber qué secciones del backoffice visitan más los operadores | Priorizar mejoras en las páginas más usadas y retirar secciones que nadie visita |
| **O22** | `flow_abandoned` | Oportunidad | Navegación / UX | Necesitamos saber qué flujos (crear orden, registrar incidencia) se abandonan antes de completarse | Identificar fricciones en la UX del backoffice y reducirlas |

---

### 2.7 Resumen del catálogo

| Grupo | Obligatorias | Oportunidades | Total |
|---|---|---|---|
| 🏭 Inventario | 5 | 5 | 10 |
| 🔐 Autenticación | 0 | 7 | 7 |
| ⚡ Rendimiento | 0 | 4 | 4 |
| ❌ Errores | 0 | 4 | 4 |
| 🧭 Navegación | 0 | 2 | 2 |
| **Total** | **5** | **22** | **27** |

**Nota:** Ninguno de estos eventos captura datos personales de consumidores finales (destinatarios de paquetes). Los datos de usuarios del sistema (operadores) se limitan a `userId` y `sessionId` — sin nombres, emails ni direcciones en los eventos de telemetría.

---

## 3. Fase 2 — Diseño del Event Envelope

### 3.1 Event Envelope estándar

Todo evento de telemetría en TrackFlow debe incluir obligatoriamente los siguientes campos en su estructura base. Ningún evento puede emitirse sin completar todos los campos del envelope.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `eventId` | `string (UUID v4)` | Sí | Identificador único del evento. Generado en el punto de emisión. Permite deduplicación. |
| `timestamp` | `string (ISO 8601)` | Sí | Momento exacto en que ocurrió el evento. Formato: `2026-09-10T14:30:00.000Z`. |
| `sessionId` | `string (UUID v4)` | Sí | Identificador de la sesión del usuario. Permite agrupar eventos de una misma interacción. |
| `userId` | `string` | Sí* | Identificador del usuario autenticado que originó el evento. `"anonymous"` si no hay sesión activa. |
| `event_type` | `string` | Sí | Tipo de evento en taxonomía `entidad_acción` (ej. `order_submitted`). Ver tabla de eventos permitidos. |
| `schemaVersion` | `string (SemVer)` | Sí | Versión del esquema del evento. Este plan usa `"1.0"`. Al modificar el schema, se incrementa. |
| `requestId` | `string (UUID v4)` | Sí | Identificador de correlación extremo a extremo. Se genera en el frontend y se propaga al backend y logs. Permite unir frontend ↔ backend ↔ base de datos para un mismo request. |
| `properties` | `object` | Sí | Payload específico del evento. Contenido definido por un allowlist por cada `event_type`. Nada fuera del allowlist debe incluirse. |

> `userId` es obligatorio excepto para eventos que ocurren antes de la autenticación (ej. `login_attempted`), donde se usa `"anonymous"`.

**Ejemplo de envelope completo:**

```json
{
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-09-10T14:30:00.000Z",
  "sessionId": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "userId": "42",
  "event_type": "inbound_order_created",
  "schemaVersion": "1.0",
  "requestId": "b7c8d9e0-f1a2-3456-bcde-f01234567890",
  "properties": {
    "warehouse": "los_angeles",
    "client_id": "fashion_co",
    "product_id": 101,
    "product_category": "fashion",
    "quantity": 500
  }
}
```

---

### 3.2 Esquemas de eventos — Inventario (obligatorios)

#### M1 — `inbound_order_created`

- **Descripción:** Se dispara cuando un almacén registra la recepción de mercancía de un cliente. Corresponde a la creación de un `StockEntry` en el sistema.
- **Contiene PII:** No. Solo identificadores de negocio (SKU, cliente, almacén).
- **Taxonomía:** `entidad_acción` correcta.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén receptor. Valores: `"los_angeles"`, `"zaragoza"`. |
| `client_id` | `string` | Sí | Identificador del cliente (marca B2B) propietaria del SKU. |
| `product_id` | `integer` | Sí | ID del SKU recibido. |
| `product_category` | `string` | Sí | Categoría del producto. Valores: `"fashion"`, `"electronics"`, `"cosmetics"`. |
| `quantity` | `integer` | Sí | Unidades recibidas. Debe ser > 0. |
| `reference` | `string` | No | Referencia de despacho del cliente para trazabilidad externa. |

---

#### M2 — `outbound_order_created`

- **Descripción:** Se dispara cuando un almacén completa el picking y despacho de un pedido. Corresponde a la creación de un `StockExit` con `exit_type = "dispatch"`.
- **Contiene PII:** No.
- **Nota:** No incluir datos del destinatario del paquete (dominio de última milla).

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén de salida. Valores: `"los_angeles"`, `"zaragoza"`. |
| `client_id` | `string` | Sí | Identificador del cliente (marca B2B). |
| `product_id` | `integer` | Sí | ID del SKU despachado. |
| `product_category` | `string` | Sí | Categoría del producto. |
| `quantity` | `integer` | Sí | Unidades despachadas. Debe ser > 0. |
| `exit_type` | `string` | Sí | Tipo de salida. Valores: `"dispatch"`, `"loss"`. |
| `tracking_number` | `string` | No | Número de tracking del transportista (solo si `exit_type` es `"dispatch"`). |

---

#### M3 — `stock_threshold_triggered`

- **Descripción:** Se dispara cuando el stock de un SKU cae por debajo del mínimo configurado para ese cliente, después de una orden de salida.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén donde se disparó el umbral. |
| `client_id` | `string` | Sí | Cliente propietario del SKU. |
| `product_id` | `integer` | Sí | ID del SKU por debajo del umbral. |
| `product_category` | `string` | Sí | Categoría del producto. |
| `current_stock` | `integer` | Sí | Stock actual después de la orden. |
| `threshold_min` | `integer` | Sí | Umbral mínimo configurado para ese cliente/SKU. |
| `quantity_sold` | `integer` | Sí | Unidades de la orden que dispararon el umbral. |

---

#### M4 — `direct_stock_edit_rejected`

- **Descripción:** Se dispara cuando un usuario intenta modificar el stock directamente (fuera de una orden de entrada o salida) y el sistema lo rechaza.
- **Contiene PII:** No. El `userId` en el envelope identifica al infractor.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén donde se intentó la edición. |
| `client_id` | `string` | No | Cliente del SKU afectado, si aplica. |
| `product_id` | `integer` | No | ID del SKU que se intentó modificar, si aplica. |
| `product_category` | `string` | No | Categoría del producto, si aplica. |
| `attempted_new_stock` | `integer` | Sí | Valor de stock que el usuario intentó establecer. |
| `current_stock` | `integer` | Sí | Stock real actual del SKU en el sistema. |
| `method` | `string` | Sí | Método o sección desde donde se intentó. Valores: `"api"`, `"backoffice"`, `"database_tool"`. |
| `rejection_reason` | `string` | Sí | Motivo del rechazo. Texto estático: `"direct_stock_edit_not_allowed"`. |

---

#### M5 — `inventory_discrepancy_detected`

- **Descripción:** Se dispara cuando un conteo físico o una auditoría detecta una diferencia entre el stock registrado en el sistema y el stock real.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén donde se realizó el conteo. |
| `client_id` | `string` | Sí | Cliente propietario del SKU. |
| `product_id` | `integer` | Sí | ID del SKU con discrepancia. |
| `product_category` | `string` | Sí | Categoría del producto. |
| `system_stock` | `integer` | Sí | Stock registrado en el sistema antes del conteo. |
| `physical_stock` | `integer` | Sí | Stock real contado físicamente. |
| `difference` | `integer` | Sí | Diferencia absoluta: `system_stock - physical_stock`. |
| `audit_reference` | `string` | No | Referencia interna de la auditoría o conteo. |

---

### 3.3 Esquemas de eventos — Inventario (oportunidades)

#### O1 — `inbound_order_cancelled`

- **Descripción:** Se dispara cuando una orden de entrada previamente creada es cancelada antes de completarse.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén donde se canceló la entrada. |
| `client_id` | `string` | Sí | Cliente de la orden cancelada. |
| `product_id` | `integer` | Sí | ID del SKU asociado. |
| `product_category` | `string` | Sí | Categoría del producto. |
| `quantity` | `integer` | Sí | Unidades de la orden cancelada. |
| `reason` | `string` | No | Motivo de la cancelación proporcionado por el operador. |
| `original_entry_id` | `integer` | Sí | ID de la entrada original cancelada. |

---

#### O2 — `outbound_order_cancelled`

- **Descripción:** Se dispara cuando un despacho previamente creado es cancelado.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén donde se canceló la salida. |
| `client_id` | `string` | Sí | Cliente de la orden cancelada. |
| `product_id` | `integer` | Sí | ID del SKU asociado. |
| `product_category` | `string` | Sí | Categoría del producto. |
| `quantity` | `integer` | Sí | Unidades de la orden cancelada. |
| `exit_type` | `string` | Sí | Tipo de salida. Valores: `"dispatch"`, `"loss"`. |
| `reason` | `string` | No | Motivo de la cancelación. |
| `original_exit_id` | `integer` | Sí | ID de la salida original cancelada. |

---

#### O3 — `stock_validation_failed`

- **Descripción:** Se dispara cuando el sistema rechaza una orden de salida por stock insuficiente (el endpoint `POST /inventory/orders/outbound` devuelve HTTP 400).
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén donde se intentó la salida. |
| `client_id` | `string` | Sí | Cliente del SKU. |
| `product_id` | `integer` | Sí | ID del SKU sin stock suficiente. |
| `product_category` | `string` | Sí | Categoría del producto. |
| `requested_quantity` | `integer` | Sí | Unidades solicitadas. |
| `available_stock` | `integer` | Sí | Stock disponible en el momento del intento. |

---

#### O4 — `product_stock_queried`

- **Descripción:** Se dispara cada vez que un operador consulta el stock de un SKU (endpoint `GET /inventory/products/{id}` o listado con filtros).
- **Contiene PII:** No.
- **Nota:** Este evento puede ser de alta frecuencia. Aplicar throttle (ver sección 4.2).

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | No | Almacén por el que se filtró la consulta, si aplica. |
| `client_id` | `string` | No | Cliente por el que se filtró, si aplica. |
| `product_id` | `integer` | No | ID del SKU consultado específicamente, si aplica. |
| `product_category` | `string` | No | Categoría por la que se filtró, si aplica. |
| `query_type` | `string` | Sí | Tipo de consulta. Valores: `"detail"`, `"list"`, `"search"`. |
| `results_count` | `integer` | No | Número de resultados devueltos (solo para listados y búsquedas). |

---

#### O5 — `picking_item_not_found`

- **Descripción:** Se dispara durante el proceso de picking cuando un operador no encuentra un SKU en su ubicación esperada.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `warehouse` | `string` | Sí | Almacén donde ocurrió el incidente de picking. |
| `client_id` | `string` | Sí | Cliente del SKU no encontrado. |
| `product_id` | `integer` | Sí | ID del SKU no encontrado. |
| `product_category` | `string` | Sí | Categoría del producto. |
| `expected_location` | `string` | No | Ubicación esperada del SKU en el almacén. |
| `outbound_order_id` | `integer` | Sí | ID de la orden de salida que estaba en proceso. |
| `resolved` | `boolean` | Sí | Si el item fue encontrado después (true) o no (false). |

---

### 3.4 Esquemas de eventos — Autenticación

#### O6 — `login_attempted`

- **Descripción:** Se dispara en cada intento de login, tanto exitoso como fallido, antes de validar las credenciales.
- **Contiene PII:** No se captura la contraseña ni el email completo. Solo `userId` (o `"anonymous"` si el login aún no ocurrió) y metadatos de la request.
- **Anonimización:** No se almacena la IP completa. Se almacena una versión truncada (ej. primeros 3 octetos) o un hash de la IP.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `login_method` | `string` | Sí | Método de autenticación. Valores: `"password"`, `"oauth2"`, `"token"`. |
| `ip_hash` | `string` | Sí | Hash SHA-256 truncado de la IP del cliente. Se almacena en lugar de la IP real. |
| `user_agent` | `string` | No | User-Agent del navegador o cliente. Se sanitiza: se extrae solo browser y OS, se descarta la versión completa. |

---

#### O7 — `login_succeeded`

- **Descripción:** Se dispara cuando un intento de login es exitoso.
- **Contiene PII:** No. `userId` en el envelope identifica al usuario.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `ip_hash` | `string` | Sí | Hash SHA-256 truncado de la IP. |
| `previous_session_id` | `string` | No | ID de la sesión anterior si el usuario tenía una sesión activa. |

---

#### O8 — `login_failed`

- **Descripción:** Se dispara cuando un intento de login es rechazado por credenciales incorrectas o cuenta desactivada.
- **Contiene PII:** No se captura la contraseña intentada. No se expone si el email existe o no (el endpoint `POST /auth/login` ya normaliza el mensaje de error).
- **Anonimización:** Se almacena un hash de la IP, no la IP real.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `failure_reason` | `string` | Sí | Motivo del fallo. Valores: `"invalid_credentials"`, `"account_disabled"`. |
| `ip_hash` | `string` | Sí | Hash SHA-256 truncado de la IP. |
| `attempt_number` | `integer` | Sí | Número de intentos fallidos consecutivos detectados desde esa misma IP. |
| `user_agent` | `string` | No | Browser/OS sanitizado. |

---

#### O9 — `session_expired`

- **Descripción:** Se dispara cuando un usuario intenta usar un token JWT expirado y el sistema rechaza la operación.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `expired_at` | `string (ISO 8601)` | Sí | Timestamp de expiración del token. |
| `token_age_minutes` | `integer` | Sí | Edad del token en minutos en el momento de expirar. |
| `operation_attempted` | `string` | No | Endpoint o acción que el usuario intentaba realizar cuando expiró la sesión. |

---

#### O10 — `password_reset_requested`

- **Descripción:** Se dispara cuando un usuario solicita un restablecimiento de contraseña (endpoint `POST /auth/forgot-password`).
- **Contiene PII:** El sistema no expone si el email existe o no (el endpoint siempre devuelve 200). `userId` puede no estar disponible si el usuario no recuerda su email. En ese caso se omite del envelope.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `ip_hash` | `string` | Sí | Hash truncado de la IP desde la que se solicitó el reset. |

---

#### O11 — `password_changed`

- **Descripción:** Se dispara cuando un usuario cambia su contraseña exitosamente, ya sea mediante `POST /auth/change-password` (autenticado) o `POST /auth/reset-password` (mediante token de reseteo).
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `change_type` | `string` | Sí | Tipo de cambio. Valores: `"self_change"`, `"reset_via_token"`. |

---

#### O12 — `account_locked`

- **Descripción:** Se dispara cuando una cuenta es bloqueada automáticamente por superar el límite de intentos fallidos de login.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `failed_attempts` | `integer` | Sí | Número de intentos fallidos que provocaron el bloqueo. |
| `lock_duration_minutes` | `integer` | Sí | Duración del bloqueo en minutos. |
| `ip_hash` | `string` | Sí | Hash truncado de la IP desde donde se originaron los intentos. |

---

### 3.5 Esquemas de eventos — Rendimiento

#### O13 — `api_latency_recorded`

- **Descripción:** Se dispara al finalizar cada request a la API, registrando el tiempo de respuesta. Se samplea (1 de cada N requests para alta frecuencia, ver 4.2).
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `endpoint` | `string` | Sí | Ruta del endpoint (ej. `/inventory/products`, `/auth/login`). Sin query params. |
| `method` | `string` | Sí | Método HTTP. Valores: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`. |
| `status_code` | `integer` | Sí | Código de respuesta HTTP. |
| `latency_ms` | `integer` | Sí | Tiempo de respuesta en milisegundos. |
| `db_queries_count` | `integer` | No | Número de consultas a base de datos que requirió el request. |

---

#### O14 — `page_load_timed`

- **Descripción:** Se dispara desde el frontend al completar la carga de una página del backoffice. Mide la percepción de carga del operador.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `page` | `string` | Sí | Identificador de la página. Valores: `"dashboard"`, `"inventory"`, `"incidents"`, `"suppliers"`, `"settings"`. |
| `load_time_ms` | `integer` | Sí | Tiempo de carga total desde inicio de navegación hasta DOM listo. |
| `ttfb_ms` | `integer` | No | Time to First Byte en milisegundos. |
| `api_calls_count` | `integer` | No | Número de llamadas a la API que hizo la página al cargar. |

---

#### O15 — `slow_query_detected`

- **Descripción:** Se dispara cuando una consulta a Supabase supera el umbral de 500ms.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `query_duration_ms` | `integer` | Sí | Duración de la consulta en ms. |
| `table` | `string` | Sí | Tabla consultada (`skus`, `stock_entries`, `stock_exits`, `users`, etc.). |
| `operation` | `string` | Sí | Tipo de operación. Valores: `"SELECT"`, `"INSERT"`, `"UPDATE"`, `"DELETE"`. |
| `endpoint` | `string` | No | Endpoint que originó la consulta lenta. |

---

#### O16 — `api_dependency_failed`

- **Descripción:** Se dispara cuando una dependencia externa (Supabase, servicio de email) falla o devuelve un error.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `dependency` | `string` | Sí | Nombre de la dependencia. Valores: `"supabase"`, `"email_service"`. |
| `error_type` | `string` | Sí | Tipo de error. Valores: `"connection_timeout"`, `"connection_refused"`, `"http_error"`. |
| `http_status` | `integer` | No | Código HTTP si aplica. |
| `endpoint` | `string` | No | Endpoint de la API que falló. |

---

### 3.6 Esquemas de eventos — Errores

#### O17 — `frontend_error_captured`

- **Descripción:** Se dispara cuando el frontend captura un error JavaScript no manejado (`window.onerror` o `unhandledrejection`).
- **Contiene PII:** El mensaje de error podría contener accidentalmente datos de usuario. Se sanitiza: se extrae el tipo de error y se descarta el mensaje completo si excede 200 caracteres o contiene patrones de email/teléfono.
- **Sanitización:** Se aplica regex de emails y números de teléfono para enmascararlos con `[REDACTED]`.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `error_type` | `string` | Sí | Tipo de error JS (ej. `"TypeError"`, `"ReferenceError"`, `"SyntaxError"`). |
| `error_message_safe` | `string` | Sí | Mensaje sanitizado. Máximo 200 caracteres. Emails y teléfonos enmascarados con `[REDACTED]`. |
| `page` | `string` | Sí | Página donde ocurrió el error. |
| `component` | `string` | No | Componente o sección donde se produjo, si se puede identificar. |
| `stack_trace` | `boolean` | Sí | Si se incluyó stack trace (`true`) o no (`false`). El stack trace nunca se almacena en texto completo. |

---

#### O18 — `api_error_returned`

- **Descripción:** Se dispara cuando la API devuelve un error 4xx o 5xx.
- **Contiene PII:** No se incluye el `detail` del error si contiene datos del usuario.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `endpoint` | `string` | Sí | Ruta del endpoint que devolvió el error. |
| `method` | `string` | Sí | Método HTTP. |
| `status_code` | `integer` | Sí | Código de error HTTP. |
| `error_detail` | `string` | No | Mensaje de error. Se omite si contiene datos que podrían ser PII. El backend decide si incluirlo o no. |

---

#### O19 — `validation_error_occurred`

- **Descripción:** Se dispara cuando un formulario o endpoint rechaza datos por errores de validación (HTTP 422 de Pydantic o validación manual).
- **Contiene PII:** No se incluyen los valores rechazados que puedan contener datos personales.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `endpoint` | `string` | Sí | Ruta del endpoint que rechazó la validación. |
| `field` | `string` | Sí | Nombre del campo que falló la validación. |
| `validation_rule` | `string` | Sí | Regla de validación incumplida (ej. `"min_length"`, `"regex"`, `"category_not_valid"`, `"insufficient_stock"`). |
| `field_type` | `string` | No | Tipo del campo (ej. `"email"`, `"string"`, `"integer"`). Se omite si expone información sensible. |

---

#### O20 — `unauthorized_access_attempted`

- **Descripción:** Se dispara cuando un usuario autenticado intenta acceder a un recurso para el que no tiene permisos (rol insuficiente).
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `endpoint` | `string` | Sí | Ruta del endpoint al que se intentó acceder. |
| `method` | `string` | Sí | Método HTTP. |
| `required_role` | `string` | Sí | Rol mínimo requerido para el endpoint. Valores: `"admin"`, `"manager"`, `"user"`. |
| `user_role` | `string` | Sí | Rol actual del usuario. |

---

### 3.7 Esquemas de eventos — Navegación

#### O21 — `page_viewed`

- **Descripción:** Se dispara cuando un operador navega a una sección del backoffice.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `page` | `string` | Sí | Identificador de la página visitada. |
| `referrer` | `string` | No | Página desde la que se navegó (ej. `"inventory"` → `"dashboard"`). |
| `duration_seconds` | `integer` | No | Tiempo estimado que el usuario pasó en la página (se envía al salir). |

---

#### O22 — `flow_abandoned`

- **Descripción:** Se dispara cuando un usuario inicia un flujo multi-paso (crear orden, registrar incidencia) pero no lo completa.
- **Contiene PII:** No.

| Property | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `flow_type` | `string` | Sí | Tipo de flujo abandonado. Valores: `"create_inbound_order"`, `"create_outbound_order"`, `"register_incident"`, `"create_supplier"`. |
| `current_step` | `string` | Sí | Paso en el que se abandonó el flujo. |
| `total_steps` | `integer` | Sí | Número total de pasos del flujo. |
| `time_spent_seconds` | `integer` | Sí | Tiempo invertido antes de abandonar. |
| `partial_data` | `boolean` | Sí | Si se había introducido algún dato antes de abandonar (`true`) o no (`false`). |

---

### 3.8 Eventos descartados y su justificación

Durante la fase de diseño se consideraron eventos adicionales que fueron descartados:

| Evento candidato | Razón del descarte |
|---|---|
| `user_registered` | Demasiado infrecuente para justificar telemetría. El registro de usuarios es una operación administrativa que ocurre pocas veces al mes. |
| `supplier_created` / `supplier_updated` | El directorio de proveedores cambia con poca frecuencia. Los datos están en TinyDB y se pueden consultar directamente si es necesario. No responde a una pregunta recurrente. |
| `incident_resolved_time` | La duración de resolución de incidencias es valiosa, pero ya se puede calcular con los timestamps de creación y actualización en la base de datos. No necesita un evento de telemetría separado. |
| `geolocation_of_operator` | Capturar la ubicación GPS de los operadores sería PII sensible sin un caso de uso claro de negocio. No hay decisión que se tome basada en dónde está físicamente un operador. |

---

## 4. Fase 3 — Estrategia de entrega

### 4.1 Decisión stream vs. batch

Para cada evento, se decide si debe procesarse en **stream** (tiempo real, segundos) o **batch** (lotes periódicos, minutos/horas). La justificación se basa en la urgencia de la decisión que alimenta, no en preferencia técnica.

| # | `event_type` | Procesamiento | Justificación |
|---|---|---|---|
| M1 | `inbound_order_created` | **Stream** | Ana necesita ver el volumen entrante en tiempo real para planificar personal del día. Una demora de horas puede significar operarios insuficientes. |
| M2 | `outbound_order_created` | **Stream** | Detectar cuellos de botella requiere visibilidad en minutos, no en lotes diarios. Si los pedidos se acumulan, se necesita reasignar personal inmediatamente. |
| M3 | `stock_threshold_triggered` | **Stream** | Un quiebre de stock requiere alertar al cliente y a Miguel en minutos. El valor del evento decae rápidamente si llega con retraso. |
| M4 | `direct_stock_edit_rejected` | **Batch** (diario) | Es un evento de auditoría y cumplimiento. La decisión (reforzar capacitación) se toma semanalmente. No hay urgencia operativa en detectarlo en tiempo real. |
| M5 | `inventory_discrepancy_detected` | **Batch** (diario) | Las auditorías son programadas. La decisión de priorizar SKUs se toma en la planificación semanal de Ana. |
| O1 | `inbound_order_cancelled` | **Batch** (diario) | Las cancelaciones se revisan en reuniones operativas diarias o semanales. No requieren acción inmediata. |
| O2 | `outbound_order_cancelled` | **Batch** (diario) | Similar a O1. Las cancelaciones se analizan de forma agregada. |
| O3 | `stock_validation_failed` | **Stream** | Cada fallo de stock insuficiente es una oportunidad de venta perdida. Miguel necesita saber en el momento qué SKUs están fallando para contactar al cliente. |
| O4 | `product_stock_queried` | **Batch** (horario) | Es un evento de alta frecuencia. La decisión (reubicar productos) se basa en tendencias, no en consultas individuales. |
| O5 | `picking_item_not_found` | **Stream** | Un item no encontrado durante el picking puede retrasar un pedido completo. El supervisor de almacén necesita saberlo para intervenir antes de que el transportista se vaya sin el paquete. |
| O6 | `login_attempted` | **Stream** | Para detectar ataques de fuerza bruta o picos anómalos, se necesita visibilidad en tiempo real (minutos). |
| O7 | `login_succeeded` | **Batch** (horario) | El análisis de patrones de uso no requiere inmediatez. Se consolida por hora para medir adopción. |
| O8 | `login_failed` | **Stream** | Ídem O6. Los fallos de login repetitivos son la señal más temprana de un ataque. |
| O9 | `session_expired` | **Batch** (diario) | El ajuste del tiempo de expiración del token es una decisión de configuración que se toma tras revisar datos agregados. No hay urgencia. |
| O10 | `password_reset_requested` | **Batch** (diario) | Es un evento de baja frecuencia. La decisión (mejorar UX de login) se basa en tendencias mensuales. |
| O11 | `password_changed` | **Batch** (diario) | El cumplimiento con políticas de rotación se mide mensualmente. No necesita stream. |
| O12 | `account_locked` | **Stream** | Una cuenta bloqueada puede ser señal de ataque. El equipo de seguridad debe poder investigar en minutos. |
| O13 | `api_latency_recorded` | **Stream** | La latencia alta es un síntoma temprano de degradación del sistema. El equipo técnico necesita alertas en tiempo real. |
| O14 | `page_load_timed` | **Batch** (horario) | No requiere inmediatez. Se usa para identificar tendencias de rendimiento del frontend y priorizar mejoras. |
| O15 | `slow_query_detected` | **Stream** | Una consulta que supera 500ms puede indicar un problema incipiente (índice faltante, bloqueo). Se necesita alertar al equipo antes de que se acumulen. |
| O16 | `api_dependency_failed` | **Stream** | Una dependencia caída paraliza el sistema. El equipo técnico necesita una alerta inmediata. |
| O17 | `frontend_error_captured` | **Stream** | Los errores de frontend que los operadores no reportan pueden estar afectando su productividad sin que nadie lo sepa. Se necesita visibilidad en tiempo real. |
| O18 | `api_error_returned` | **Stream** | Un incremento repentino de errores 5xx puede indicar un despliegue fallido o una caída. Se necesita alertar inmediatamente. |
| O19 | `validation_error_occurred` | **Batch** (diario) | Las decisiones de mejora de formularios se basan en tendencias agregadas. No hay urgencia operativa. |
| O20 | `unauthorized_access_attempted` | **Stream** | Intentos de acceso no autorizado pueden ser un indicador de ataque interno o externo. Se necesita monitorización en tiempo real. |
| O21 | `page_viewed` | **Batch** (horario) | Es un evento de alta frecuencia. Las decisiones sobre qué secciones mejorar se basan en tendencias, no en visitas individuales. |
| O22 | `flow_abandoned` | **Batch** (diario) | Las mejoras de UX se basan en datos agregados. No hay urgencia en detectar abandonos individuales. |

**Resumen:**

| Tipo | Stream | Batch |
|---|---|---|
| Stream | 14 eventos | 13 eventos |
| Criterio | Urgencia operativa o de seguridad | Decisiones basadas en tendencias agregadas |

---

### 4.2 Estrategia de throttle/debounce

Algunos eventos pueden dispararse con alta frecuencia y requieren protección para evitar saturación del pipeline de telemetría.

| `event_type` | Estrategia | Detalle |
|---|---|---|
| `product_stock_queried` (O4) | **Debounce 10s** | Si un operador consulta el mismo SKU varias veces en 10 segundos (ej. recargando la página), solo se emite un evento. |
| `page_viewed` (O21) | **Throttle 30s** | Si un operador navega rápidamente entre páginas, no se emite un evento por cada cambio si ocurren en menos de 30s. |
| `api_latency_recorded` (O13) | **Sampleo 1:10** | Para endpoints de alta frecuencia como `GET /inventory/products`, solo se registra la latencia de 1 de cada 10 requests. Endpoints críticos como `POST /inventory/orders/*` se registran siempre. |
| `frontend_error_captured` (O17) | **Deduplicación 5m** | Si el mismo error (mismo `error_type`, misma página) ocurre más de una vez en 5 minutos, solo se emite un evento. El contador de ocurrencias se incluye en `properties`. |

---

### 4.3 Riesgos y exclusiones

#### Datos que no se capturan

1. **Datos del consumidor final (destinatario del paquete):** Nombre, dirección, email, teléfono del destinatario final. Estos datos pertenecen al dominio de última milla y están explícitamente fuera del alcance de este sistema según el CONTEXT-empresa.md.

2. **Contraseñas (en ningún formato):** Ni en texto plano ni hasheadas. Los eventos de login (`login_failed`, `login_attempted`) nunca incluyen la contraseña intentada. El hash de la contraseña está en TinyDB, no en telemetría.

3. **Direcciones IP completas:** Solo se almacenan hashes SHA-256 truncados. No se puede reconstruir la IP original a partir del hash.

4. **Stack traces completos:** Aunque el frontend capture errores JS, el stack trace completo puede exponer rutas del sistema de archivos o estructura interna de la aplicación. Solo se almacena el tipo de error y un mensaje sanitizado.

5. **Geolocalización de operadores o consumidores:** No se capturan coordenadas GPS. La ubicación del almacén (`warehouse`) es suficiente para las decisiones de negocio.

#### Riesgos identificados

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Saturación del pipeline por eventos de alta frecuencia** | Los eventos `product_stock_queried` y `page_viewed` pueden generarse cientos de veces por hora. | Se aplican las estrategias de throttle/debounce de la sección 4.2. |
| **Fuga accidental de PII en errores de frontend** | Un error JS podría incluir en su mensaje un email o dato personal visible en la UI. | Se aplica sanitización automática: regex de emails/teléfonos con `[REDACTED]` y truncado a 200 caracteres. |
| **Coste de almacenamiento de eventos batch** | 13 eventos en batch pueden acumular grandes volúmenes si no se gestionan. | Los eventos batch se consolidan antes de almacenarse: agregaciones básicas (contadores, sumas) reducen el volumen bruto. |
| **Correlación incompleta por `requestId`** | Si el frontend y el backend generan `requestId` independientes, la correlación se pierde. | El `requestId` se genera en el frontend y se envía como cabecera HTTP `X-Request-Id`. El backend lo propaga a todos los eventos y logs. |
| **Eventos de autenticación con `userId` ausente** | En login fallido, el `userId` puede no estar disponible porque el usuario no está autenticado. | Se usa `"anonymous"` como valor por defecto. La IP hashada permite agrupar intentos de un mismo origen sin exponer la identidad. |

#### Exclusiones explícitas

Los siguientes dominios quedan fuera del alcance de este plan de telemetría:

- **Tracking de última milla:** Seguimiento de paquetes en ruta, entregas, intentos fallidos de entrega. Esto corresponde a un proyecto separado de tracking de transportistas.
- **Logística inversa (devoluciones):** Aunque es una operación relevante, las devoluciones siguen un flujo diferente con sus propias entidades (returns, RMA). Se abordará en un plan de telemetría específico para ese dominio.
- **Website corporativo:** La landing page y el formulario de solicitud (`uis/website/`) son páginas públicas sin autenticación. La telemetría en ese frontend requeriría consentimiento explícito (GDPR en España, CCPA en California). Se excluye deliberadamente.

----

