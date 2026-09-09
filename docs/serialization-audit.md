# Auditoría de Serialización — TrackFlow API v3.0.0

> **Fecha:** 2026-09-09  
> **Rama:** `feature/serialization-audit`  
> **Objetivo:** Inspeccionar cada endpoint existente, clasificar su estado de serialización y registrar hallazgos antes de implementar mejoras.

---

## Resumen ejecutivo

| Estado | Cantidad |
|---|---|
| ✅ Ya serializado | 18 |
| ⚠️ Parcialmente serializado | 3 |
| ❌ Sin serializar | 5 |
| 🔴 Hallazgo crítico (seguridad) | 1 |
| **Total endpoints** | **27** |

---

## 1. Hallazgo crítico: `hashed_password` accesible vía `get_current_user()`

**Archivo:** `services/api/auth.py` — función `get_current_user()`

```python
# auth.py (~línea 84-95)
user = users_table.get(doc_id=user_id_int)
# ...
user["id"] = user_id_int
return user  # ← devuelve el documento TinyDB COMPLETO, incluyendo hashed_password
```

`get_current_user()` devuelve el documento TinyDB **sin sanitizar**. El campo `hashed_password` está presente en el diccionario que se inyecta como dependencia en **todos los endpoints protegidos** (los 27 con autenticación).

**Riesgo:** Ningún endpoint actual expone el hash directamente en respuestas, pero:
- Cualquier endpoint futuro que serialice o loguee `current_user` accidentalmente expondría hashes (principio de *defense in depth*).
- Si un endpoint permitiera editar o devolver el objeto `current_user` sin schema, los hashes se filtrarían.

**Archivo relacionado:** `services/api/services.py` ya tiene `_sanitize_user()` que elimina `hashed_password`, pero no se usa en `get_current_user()`.

---

## 2. Listado completo de endpoints

### 2.1 Autenticación — `routes/auth.py` (prefix: `/auth`)

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 1 | POST | `/auth/login` | `TokenResponse` | ✅ | Solo devuelve `access_token` + `token_type`. Correcto. |
| 2 | GET | `/auth/me` | `AuthMeResponse` | ⚠️ | El campo `profile: dict` no tiene tipado explícito. Debería ser `ProfileResponse`. |
| 3 | POST | `/auth/forgot-password` | ❌ **Ninguno** | ❌ | Devuelve `{"message": ...}` como dict sin schema. |
| 4 | POST | `/auth/reset-password` | ❌ **Ninguno** | ❌ | Devuelve `{"message": ...}` como dict sin schema. |
| 5 | POST | `/auth/change-password` | ❌ **Ninguno** | ❌ | Devuelve `{"message": ...}` como dict sin schema. |

**Observaciones de auth:**
- `AuthMeResponse` debería tipar `profile` como `ProfileResponse | None` en lugar de `dict`.
- Los endpoints de password (forgot, reset, change) devuelven todos `{"message": str}` — deberían compartir un schema `MessageResponse`.
- `get_current_user()` devuelve `hashed_password` en el dict (ver hallazgo crítico §1).

#### Payloads actuales vs. recomendados (auth)

| Endpoint | Devuelve hoy | Debería devolver |
|---|---|---|
| `POST /auth/login` | `{"access_token": "...", "token_type": "bearer"}` | ✅ Correcto |
| `GET /auth/me` | `{"id": 1, "email": "...", "role": "...", "profile": {...}}` | ⚠️ Mismo payload, pero `profile` tipado como `ProfileResponse` |
| `POST /auth/forgot-password` | `{"message": "Si el correo está registrado..."}` | `MessageResponse` genérico |
| `POST /auth/reset-password` | `{"message": "Contraseña actualizada correctamente"}` | `MessageResponse` genérico |
| `POST /auth/change-password` | `{"message": "Contraseña actualizada correctamente"}` | `MessageResponse` genérico |

---

### 2.2 Usuarios — `routes/users.py` (prefix: `/users`)

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 6 | POST | `/users` | `UserWithProfileResponse` | ⚠️ | `profile: Optional[dict]` debería ser `ProfileResponse`. Correcto en estructura. |
| 7 | GET | `/users` | `list[UserResponse]` | ✅ | Solo campos seguros: `id`, `email`, `role`, `is_active`, timestamps. |
| 8 | GET | `/users/{id}` | `UserResponse` | ✅ | Correcto. |
| 9 | PUT | `/users/{id}` | `UserResponse` | ✅ | Correcto. |
| 10 | DELETE | `/users/{id}` | ❌ **Ninguno** | ❌ | Devuelve `{"message": ..., "id": ...}` como dict sin schema. |

**Observaciones de usuarios:**
- `get_all_users()` en `services.py` usa `_sanitize_user()` — seguro.
- `create_user()` también sanitiza — seguro.
- `UserWithProfileResponse` tipa `profile: Optional[dict]` — debería tiparse.

---

### 2.3 Perfiles — `routes/profiles.py` (prefix: `/profiles`)

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 11 | GET | `/profiles/me` | `ProfileResponse` | ✅ | Correcto. |
| 12 | PUT | `/profiles/me` | `ProfileResponse` | ✅ | Correcto. |

---

### 2.4 Proveedores — `routes/suppliers.py` (prefix: `/suppliers`)

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 13 | POST | `/suppliers` | `SupplierResponse` | ✅ | Correcto. |
| 14 | GET | `/suppliers` | `list[SupplierResponse]` | ✅ | Correcto. |
| 15 | GET | `/suppliers/{id}` | `SupplierResponse` | ✅ | Correcto. |
| 16 | PUT | `/suppliers/{id}` | `SupplierResponse` | ✅ | Correcto. |
| 17 | PATCH | `/suppliers/{id}/rate` | `SupplierResponse` | ✅ | Correcto. |
| 18 | PATCH | `/suppliers/{id}/status` | `SupplierResponse` | ✅ | Correcto. |
| 19 | DELETE | `/suppliers/{id}` | ❌ **Ninguno** | ❌ | Devuelve `{"message": ..., "id": ...}` como dict sin schema. |

**Observaciones de proveedores:**
- `SupplierResponse` en `pydantic_models.py` es completo y explícito.
- Para listados (`GET /suppliers`), se devuelve el mismo `SupplierResponse` completo. Si hay muchos proveedores, un `SupplierListItem` más ligero (sin `notes`, `contact_email`, `service_zone`) podría optimizar el payload.

---

### 2.5 Incidencias — `routes/incidents.py` (prefix: `/api/incidents`)

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 20 | POST | `/api/incidents` | `IncidentResponse` | ✅ | Correcto. |
| 21 | GET | `/api/incidents` | `list[IncidentResponse]` | ⚠️ | Usa el mismo schema que detalle. Para listados con muchos elementos, un `IncidentListItem` más ligero optimizaría el payload. |
| 22 | GET | `/api/incidents/summary` | ❌ **Ninguno** | ❌ | Devuelve raw dict con métricas agregadas. |
| 23 | GET | `/api/incidents/{incident_id}` | `IncidentResponse` | ✅ | Correcto. |
| 24 | PATCH | `/api/incidents/{incident_id}/status` | `IncidentResponse` | ✅ | Correcto. |

**Observaciones de incidencias:**
- `IncidentResponse` incluye todos los campos (title, description, category, status, origin, branch, timestamps). Para listados sería razonable un esquema más ligero sin `description`.
- `GET /api/incidents/summary` devuelve un dict con `total`, `by_status`, `by_category`, `by_origin`, `by_branch` — necesita un schema `IncidentSummaryResponse`.

---

### 2.6 Analizador de incidencias — `main.py`

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 25 | POST | `/api/incidents/analyze` | ❌ **Ninguno** | ❌ | Devuelve el resultado crudo de `analyze_rows()` como dict sin schema. |
| 26 | GET | `/api/incidents/results/export` | `StreamingResponse` | ✅ | Es CSV descargable, no JSON. Correcto. |

**Observaciones del analizador:**
- `POST /api/incidents/analyze` devuelve la estructura que genera `analyze_rows()` (de `trackflow_shared.legacy`). Se debe inspeccionar esa estructura y definir un schema.

---

### 2.7 Inventario — `routes/inventory.py` (prefix: `/inventory`)

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 27 | GET | `/inventory/products` | `list[SKUResponse]` | ✅ | Incluye `current_stock` calculado. Correcto. |
| 28 | POST | `/inventory/products` | `SKUResponse` | ✅ | Correcto. |
| 29 | GET | `/inventory/products/{id}` | `SKUResponse` | ✅ | Correcto. |
| 30 | POST | `/inventory/orders/inbound` | `StockEntryResponse` | ✅ | Correcto. |
| 31 | POST | `/inventory/orders/outbound` | `StockExitResponse` | ✅ | Correcto. |
| 32 | GET | `/inventory/orders` | `list[MovementResponse]` | ✅ | Correcto. |

**Observaciones de inventario:**
- Todos los endpoints tienen `response_model` explícito y usan helpers de conversión (`_sku_to_response`).
- `MovementResponse` para listados de movimientos ya aplanado: incluye `sku_name`, `sku_code`, `reference_or_exit`. Buen diseño.
- El inventario es el **único dominio completamente serializado**.

---

## 3. Resumen de esquemas existentes

| Esquema | Archivo | Uso |
|---|---|---|
| `TokenResponse` | `routes/auth.py` | POST /auth/login |
| `AuthMeResponse` | `routes/auth.py` | GET /auth/me |
| `ForgotPasswordRequest` | `routes/auth.py` | Solo request, no response |
| `ResetPasswordRequest` | `routes/auth.py` | Solo request, no response |
| `ChangePasswordRequest` | `routes/auth.py` | Solo request, no response |
| `UserResponse` | `routes/users.py` | GET/POST/PUT /users |
| `UserWithProfileResponse` | `routes/users.py` | POST /users |
| `UserCreate` / `UserUpdate` | `routes/users.py` | Solo request |
| `ProfileResponse` | `routes/profiles.py` | GET/PUT /profiles/me |
| `ProfileUpdate` | `routes/profiles.py` | Solo request |
| `SupplierResponse` | `pydantic_models.py` | CRUD /suppliers |
| `SupplierCreate` / `SupplierUpdateRate` / `SupplierUpdateStatus` | `pydantic_models.py` | Solo request |
| `IncidentResponse` | `pydantic_models.py` | CRUD /api/incidents |
| `IncidentCreate` / `IncidentStatusUpdate` | `pydantic_models.py` | Solo request |
| `SKUResponse` / `SKUCreate` | `schemas.py` | /inventory/products |
| `StockEntryResponse` / `StockEntryCreate` | `schemas.py` | POST /inventory/orders/inbound |
| `StockExitResponse` / `StockExitCreate` | `schemas.py` | POST /inventory/orders/outbound |
| `MovementResponse` | `schemas.py` | GET /inventory/orders |

---

## 4. Esquemas faltantes (necesarios para Fase 2)

| Esquema necesario | Para endpoint(s) | Campos propuestos |
|---|---|---|
| `DeleteResponse` | DELETE /suppliers/{id}, DELETE /users/{id} | `message: str`, `id: int` |
| `IncidentSummaryResponse` | GET /api/incidents/summary | `total: int`, `by_status: dict`, `by_category: dict`, `by_origin: dict`, `by_branch: dict` |
| `AnalyzeResponse` | POST /api/incidents/analyze | Pendiente de inspeccionar `analyze_rows()` |
| `IncidentListItem` | GET /api/incidents (listado) | `id`, `title`, `category`, `status`, `origin`, `branch`, `created_at` (sin `description`) |
| `UserFromToken` | `get_current_user()` (inyección) | `id`, `email`, `role` (sin `hashed_password`) |
| `MessageResponse` | rest-password/change-password/forgot-password | `message: str` |

---

## 5. Clasificación por severidad

### 🔴 Crítico (seguridad)
1. `get_current_user()` expone `hashed_password` en el dict inyectado.

### ❌ Sin serializar — necesita schema
1. `POST /auth/forgot-password` — devuelve dict suelto
2. `POST /auth/reset-password` — devuelve dict suelto
3. `POST /auth/change-password` — devuelve dict suelto
4. `GET /api/incidents/summary` — devuelve dict suelto
5. `POST /api/incidents/analyze` — devuelve dict suelto
6. `DELETE /suppliers/{id}` — devuelve dict suelto
7. `DELETE /users/{id}` — devuelve dict suelto

### ⚠️ Parcialmente serializado — necesita mejora
1. `GET /auth/me` — `profile: dict` sin tipar
2. `POST /users` — `profile: Optional[dict]` sin tipar
3. `GET /api/incidents` — payload completo en listado (podría ser más ligero)

---

## 6. Notas sobre optimización de payloads

### Endpoints de listado que podrían beneficiarse de esquemas ligeros

| Endpoint | Schema actual | Propuesta de schema ligero |
|---|---|---|
| `GET /api/incidents` | `IncidentResponse` (9 campos) | `IncidentListItem` (7 campos, sin `description`) |
| `GET /suppliers` | `SupplierResponse` (11 campos) | Evaluar si `notes` y `contact_email` son necesarios en listado |

### Endpoints de escritura — validación de campos aceptados

Todos los endpoints de escritura ya tienen esquemas de request específicos. ✅

| Endpoint | ¿Acepta solo campos necesarios? |
|---|---|
| `POST /inventory/products` | ✅ Sí, `SKUCreate` |
| `POST /inventory/orders/inbound` | ✅ Sí, `StockEntryCreate` |
| `POST /inventory/orders/outbound` | ✅ Sí, `StockExitCreate` |
| `POST /api/incidents` | ✅ Sí, `IncidentCreate` |
| `POST /suppliers` | ✅ Sí, `SupplierCreate` |
| `POST /users` | ✅ Sí, `UserCreate` |
| `PUT /users/{id}` | ✅ Sí, `UserUpdate` |
| `PATCH /suppliers/{id}/rate` | ✅ Sí, `SupplierUpdateRate` |
| `PATCH /suppliers/{id}/status` | ✅ Sí, `SupplierUpdateStatus` |

---

## 7. Conclusión

El backend tenía **18 endpoints correctamente serializados** (67 %), pero **7 endpoints sin esquema de respuesta** y **3 con tipado incompleto**. El hallazgo más grave era la exposición de `hashed_password` en `get_current_user()`.

---

## 8. Fase 2 — Implementación completada

> **Fecha:** 2026-09-09

### Cambios realizados

| # | Cambio | Archivos | Estado |
|---|---|---|---|
| 🔴 1 | Sanitizar `get_current_user()` — eliminar `hashed_password` del dict inyectado | `services/api/auth.py` | ✅ |
| 2 | Crear esquemas compartidos en `pydantic_models.py` | `services/api/pydantic_models.py` | ✅ |
| 3 | Tipar `profile` como `ProfileResponse` en `AuthMeResponse` y `UserWithProfileResponse` | `routes/auth.py`, `routes/users.py` | ✅ |
| 4 | Aplicar `MessageResponse` a endpoints de auth password | `routes/auth.py` | ✅ |
| 5 | Aplicar `DeleteResponse` a DELETE endpoints | `routes/suppliers.py`, `routes/users.py` | ✅ |
| 6 | `IncidentSummaryResponse` para GET /api/incidents/summary | `routes/incidents.py` | ✅ |
| 7 | `AnalyzeResponse` para POST /api/incidents/analyze | `main.py` | ✅ |
| 8 | `IncidentListItem` ligero para listado de incidencias | `routes/incidents.py` | ✅ |

### Estado actualizado

| Estado | Antes | Después |
|---|---|---|
| ✅ Ya serializado | 18 | **27** |
| ⚠️ Parcialmente serializado | 3 | **0** |
| ❌ Sin serializar | 5 | **0** |
| 🔴 Hallazgo crítico | 1 | **0** |

### Esquemas creados

| Esquema | Archivo | Para endpoint(s) |
|---|---|---|
| `MessageResponse` | `pydantic_models.py` | forgot/reset/change-password |
| `DeleteResponse` | `pydantic_models.py` | DELETE /suppliers/{id}, DELETE /users/{id} |
| `ProfileResponse` | `pydantic_models.py` | GET /auth/me (profile), POST /users (profile) |
| `IncidentListItem` | `pydantic_models.py` | GET /api/incidents (listado ligero) |
| `IncidentSummaryResponse` | `pydantic_models.py` | GET /api/incidents/summary |
| `RuleDetail` | `pydantic_models.py` | POST /api/incidents/analyze (sub-esquema) |
| `MetricsData` | `pydantic_models.py` | POST /api/incidents/analyze (sub-esquema) |
| `AnalyzeResponse` | `pydantic_models.py` | POST /api/incidents/analyze |

### Decisiones de serialización documentadas

1. **Relaciones en respuestas de inventario:** `MovementResponse` aplanado con `sku_name` y `sku_code` en lugar de objeto SKU anidado — el consumidor (listado de movimientos) no necesita el objeto completo.
2. **Listado de incidencias ligero:** `IncidentListItem` sin `description` ni `updated_at` — en una tabla/listado no se muestra la descripción completa ni el último timestamp de actualización.
3. **Seguridad en auth:** Los endpoints de password nunca devuelven email en la respuesta — el email va en el body de la petición. `GET /auth/me` sí devuelve email porque es la vista de perfil del propio llamante.
4. **`get_current_user()` sanitizado:** Se elimina `hashed_password` del dict antes de inyectarlo como dependencia, usando una copia (`dict(user)`) para no mutar el documento TinyDB original.