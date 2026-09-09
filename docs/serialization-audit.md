# Auditoría de Serialización — TrackFlow API v3.0.0

> **Fecha:** 2026-09-09  
> **Rama:** `feature/serialization-audit`  
> **Objetivo:** Inspeccionar cada endpoint existente, clasificar su estado de serialización y registrar hallazgos antes de implementar mejoras.

---

## Resumen ejecutivo

| Estado | Antes | Después (Fase 3) |
|---|---|---|
| ✅ Ya serializado | 18 | **27** |
| ⚠️ Parcialmente serializado | 3 | **0** |
| ❌ Sin serializar | 5 | **0** |
| 🔴 Hallazgo crítico (seguridad) | 1 | **0** |
| **Total endpoints** | **27** | **27** |

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
| 2 | GET | `/auth/me` | `AuthMeResponse` | ✅ | `profile` tipado como `ProfileResponse`. |
| 3 | POST | `/auth/forgot-password` | `MessageResponse` | ✅ | Implementado en Fase 2. |
| 4 | POST | `/auth/reset-password` | `MessageResponse` | ✅ | Implementado en Fase 2. |
| 5 | POST | `/auth/change-password` | `MessageResponse` | ✅ | Implementado en Fase 2. |

**Observaciones de auth:**
- ✅ `profile` tipado como `ProfileResponse | None` (Fase 2).
- ✅ Endpoints de password usan `MessageResponse` compartido (Fase 2).
- ✅ `get_current_user()` sanitizado — elimina `hashed_password` del dict inyectado (Fase 2).

#### Payloads actuales vs. recomendados (auth)

| Endpoint | Devuelve hoy | Debería devolver |
|---|---|---|
| `POST /auth/login` | `{"access_token": "...", "token_type": "bearer"}` | ✅ Correcto |
| `GET /auth/me` | `{"id": 1, "email": "...", "role": "...", "profile": {...}}` | ✅ `profile` tipado como `ProfileResponse` |
| `POST /auth/forgot-password` | `{"message": "Si el correo está registrado..."}` | ✅ `MessageResponse` |
| `POST /auth/reset-password` | `{"message": "Contraseña actualizada correctamente"}` | ✅ `MessageResponse` |
| `POST /auth/change-password` | `{"message": "Contraseña actualizada correctamente"}` | ✅ `MessageResponse` |

---

### 2.2 Usuarios — `routes/users.py` (prefix: `/users`)

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 6 | POST | `/users` | `UserWithProfileResponse` | ✅ | `profile` tipado como `ProfileResponse`. |
| 7 | GET | `/users` | `list[UserResponse]` | ✅ | Solo campos seguros: `id`, `email`, `role`, `is_active`, timestamps. |
| 8 | GET | `/users/{id}` | `UserResponse` | ✅ | Correcto. |
| 9 | PUT | `/users/{id}` | `UserResponse` | ✅ | Correcto. |
| 10 | DELETE | `/users/{id}` | `DeleteResponse` | ✅ | Implementado en Fase 2. |

**Observaciones de usuarios:**
- ✅ `get_all_users()` en `services.py` usa `_sanitize_user()` — seguro.
- ✅ `create_user()` también sanitiza — seguro.
- ✅ `UserWithProfileResponse` tipa `profile` como `ProfileResponse | None` (Fase 2).

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
| 19 | DELETE | `/suppliers/{id}` | `DeleteResponse` | ✅ | Implementado en Fase 2. |

**Observaciones de proveedores:**
- `SupplierResponse` en `pydantic_models.py` es completo y explícito.
- Para listados (`GET /suppliers`), se devuelve el mismo `SupplierResponse` completo. Si hay muchos proveedores, un `SupplierListItem` más ligero (sin `notes`, `contact_email`, `service_zone`) podría optimizar el payload.

---

### 2.5 Incidencias — `routes/incidents.py` (prefix: `/api/incidents`)

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 20 | POST | `/api/incidents` | `IncidentResponse` | ✅ | Correcto. |
| 21 | GET | `/api/incidents` | `list[IncidentListItem]` | ✅ | Schema ligero sin `description` ni `updated_at`. |
| 22 | GET | `/api/incidents/summary` | `IncidentSummaryResponse` | ✅ | Implementado en Fase 2. |
| 23 | GET | `/api/incidents/{incident_id}` | `IncidentResponse` | ✅ | Correcto. |
| 24 | PATCH | `/api/incidents/{incident_id}/status` | `IncidentResponse` | ✅ | Correcto. |

**Observaciones de incidencias:**
- ✅ `IncidentListItem` ligero implementado (sin `description` ni `updated_at`) para listados.
- ✅ `IncidentSummaryResponse` implementado con `total`, `by_status`, `by_category`, `by_origin`, `by_branch`.

---

### 2.6 Analizador de incidencias — `main.py`

| # | Método | Ruta | `response_model` | Estado | Notas |
|---|--------|------|------------------|--------|-------|
| 25 | POST | `/api/incidents/analyze` | `AnalyzeResponse` | ✅ | Implementado en Fase 2 con sub-esquemas `RuleDetail` y `MetricsData`. |
| 26 | GET | `/api/incidents/results/export` | `StreamingResponse` | ✅ | Es CSV descargable, no JSON. Correcto. |

**Observaciones del analizador:**
- ✅ `AnalyzeResponse` implementado con sub-esquemas `RuleDetail` y `MetricsData` (Fase 2).

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

## 4. Esquemas faltantes — resueltos en Fase 2

Todos los esquemas identificados como necesarios fueron implementados en la Fase 2. Ver [Sección 8](#8-fase-2--implementación-completada).

| Esquema | Endpoint(s) | Estado |
|---|---|---|
| `MessageResponse` | forgot/reset/change-password | ✅ Implementado |
| `DeleteResponse` | DELETE /suppliers/{id}, DELETE /users/{id} | ✅ Implementado |
| `IncidentSummaryResponse` | GET /api/incidents/summary | ✅ Implementado |
| `AnalyzeResponse` (con `RuleDetail`, `MetricsData`) | POST /api/incidents/analyze | ✅ Implementado |
| `IncidentListItem` | GET /api/incidents (listado ligero) | ✅ Implementado |
| `ProfileResponse` (tipado) | GET /auth/me (profile), POST /users (profile) | ✅ Aplicado |

---

## 5. Clasificación por severidad — todo resuelto

| Severidad | Descripción | Estado |
|---|---|---|
| 🔴 Crítico | `get_current_user()` exponía `hashed_password` | ✅ Sanitizado (Fase 2) |
| ❌ Sin serializar | 7 endpoints devolvían dict sin schema | ✅ Todos con `response_model` (Fase 2) |
| ⚠️ Parcialmente serializado | 3 endpoints con tipado incompleto | ✅ Todos tipados (Fase 2) |
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

---

## 9. Fase 3 — Verificación completada

> **Fecha:** 2026-09-09

### 9.1 Tests unitarios

Se ejecutaron los **109 tests existentes** del backend:

```
======================= 109 passed, 4 warnings in 13.07s =======================
```

Fue necesario actualizar 6 archivos de test para usar acceso por atributos (`.message`, `.profile.name`, `.total`) en lugar de subscripting (`["message"]`, `["name"]`, `["total"]`), ya que ahora los endpoints devuelven objetos Pydantic en lugar de diccionarios crudos.

| Archivo de test | Cambio |
|---|---|
| `tests/test_change_password.py` | `result["message"]` → `result.message` |
| `tests/test_reset_password.py` | `result["message"]` → `result.message` |
| `tests/test_incidents.py` | `summary["total"]` → `summary.total` |
| `tests/test_register.py` | `result.profile["name"]` → `result.profile.name` |
| `tests/test_suppliers.py` | `result["message"]` → `result.message` |
| `tests/test_token.py` | `result.profile["name"]` → `result.profile.name` |

### 9.2 Pruebas manuales en `/docs`

Se verificaron 5 endpoints vía `curl` contra la API en ejecución:

| Endpoint | Schema | Respuesta verificada |
|---|---|---|
| `POST /auth/forgot-password` | `MessageResponse` | `{"message": "Si el correo está registrado..."}` ✅ |
| `POST /auth/reset-password` | `MessageResponse` | `{"detail": "El enlace no es válido..."}` (error controlado) ✅ |
| `POST /users` (register) | `UserWithProfileResponse` | `{"user": {...}, "profile": null}` ✅ |
| `GET /auth/me` | `AuthMeResponse` con `ProfileResponse` | `{"id": 15, "email": "...", "role": "user", "profile": null}` ✅ |
| `GET /api/incidents/summary` | `IncidentSummaryResponse` | `{"total": 97, "by_status": {...}, ...}` ✅ |

Confirmado: **ninguna respuesta expone `hashed_password`**.

### 9.3 Resumen final

| Item | Resultado |
|---|---|
| 109 tests existentes | ✅ Todos pasan |
| Pruebas manuales en `/docs` | ✅ 5 endpoints verificados |
| Documentación actualizada | ✅ Todos los endpoints marcados como ✅ |

**Estado final: 27/27 endpoints serializados, 0 críticos, 0 pendientes.**