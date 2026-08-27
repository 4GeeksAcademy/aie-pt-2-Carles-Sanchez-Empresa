# TESTING.md — Plan de Pruebas Unitarias

> **Proyecto:** TrackFlow  
> **Ticket:** AUTH-088 — Cobertura de pruebas unitarias para la API de autenticación  
> **Fecha:** 2026-08-27  
> **Prioridad:** Alta  

---

## Índice

1. [Introducción](#introducción)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Cómo ejecutar las pruebas](#cómo-ejecutar-las-pruebas)
4. [Cobertura de la fase 1 — Endpoints de autenticación (25 casos)](#cobertura-de-la-fase-1--endpoints-de-autenticación-25-casos)
5. [Plan de pruebas por endpoint](#plan-de-pruebas-por-endpoint)
   - [POST /auth/login](#1-post-authlogin)
   - [GET /auth/me](#2-get-authme)
   - [POST /auth/forgot-password](#3-post-authforgot-password)
   - [POST /auth/reset-password](#4-post-authreset-password)
   - [POST /auth/change-password](#5-post-authchange-password)
6. [Próximas fases](#próximas-fases)

---

## Introducción

Este documento define el plan de pruebas unitarias para la API de autenticación de TrackFlow, siguiendo el requerimiento del ticket **AUTH-088**. Cada endpoint se prueba en sus **tres pilares**: camino feliz (*happy path*), caso límite (*edge case*) y modo de fallo (*failure mode*).

Las pruebas se centran en la **lógica de negocio**, no en la serialización HTTP ni en las tuberías del framework. Se usa `pytest` para el backend (FastAPI) y `Jest` para el frontend (TypeScript).

---

## Estructura del proyecto

```
/
├── tests/                          # Tests de backend (pytest)
│   ├── conftest.py                 # Fixtures globales
│   ├── test_auth_unit.py           # auth.py: hash, JWT, validación
│   ├── test_services_unit.py       # services.py: CRUD de usuarios
│   └── test_auth_routes.py         # routes/auth.py: lógica de endpoints
├── src/services/
│   └── __tests__/
│       └── auth.test.ts            # Tests del cliente auth.ts
├── jest.config.js                  # Configuración de Jest
├── TESTING.md                      # ← Este documento
└── services/api/pyproject.toml     # Dependencias (pytest añadido)
```

---

## Cómo ejecutar las pruebas

### Backend (pytest)

```bash
# Instalar dependencias (una vez)
pip install -e services/api/
pip install pytest pytest-mock

# Ejecutar todas las pruebas
python -m pytest tests/ -v

# Ejecutar con cobertura
python -m pytest tests/ --cov=services/api --cov-report=term-missing -v

# Ejecutar una suite específica
python -m pytest tests/test_auth_routes.py -v
```

### Frontend (Jest)

Se ha instalado Jest vía npm en la raíz del proyecto:

```bash
# Ejecutar todas las pruebas
npx jest --coverage

# Ejecutar en modo watch
npx jest --watch
```

**Requisitos:**
- Python ≥ 3.10
- Node.js ≥ 18
- Navegador o entorno jsdom (Jest config)

---

## Cobertura de la fase 1 — Endpoints de autenticación (25 casos)

Esta fase 1 se centra exclusivamente en los **5 endpoints de `routes/auth.py`**:

| Endpoint | Happy Path | Caso Límite | Modo Fallo | **Total** |
|---|---|---|---|---|
| `POST /auth/login` | 1 | 3 | 4 | **8** |
| `GET /auth/me` | 1 | 1 | 1 | **3** |
| `POST /auth/forgot-password` | 1 | 2 | 1 | **4** |
| `POST /auth/reset-password` | 1 | 1 | 3 | **5** |
| `POST /auth/change-password` | 1 | 1 | 3 | **5** |
| **Total** | **5** | **8** | **12** | **25** |

### Criterios de selección

Los casos se han seleccionado siguiendo estos criterios:

1. **Caso feliz**: Verifica que el endpoint funciona con entradas válidas y devuelve la respuesta esperada.
2. **Caso límite**: Entradas en el borde de lo válido (campos vacíos, usuarios inactivos, tokens justo antes de expirar, usuarios sin perfil).
3. **Modo fallo**: Entradas inválidas, condiciones de error conocidas (token expirado, firma alterada, credenciales incorrectas), y escenarios de regresión (el bug que motivó este ticket: expiración de tokens).

### Lo que NO se cubre en fase 1

- Funciones auxiliares de `auth.py` (hash, JWT, validación de reset tokens) → **fase 2**
- Capa de servicios `services.py` (CRUD de usuarios) → **fase 2**
- Cliente TypeScript `src/services/auth.ts` → **fase 2**
- Endpoints no relacionados con autenticación (suppliers, incidents, profiles) → fuera del alcance del ticket

---

## Plan de pruebas por endpoint

### 1. `POST /auth/login`

Inicio de sesión: valida email y contraseña, devuelve un token JWT.

#### Happy Path

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| L-H1 | `login_credentials_ok` | Email existente + contraseña correcta | → 200, `access_token` es un string JWT decodificable con `sub=str(user_id)` |

#### Casos Límite

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| L-E1 | `login_user_inactive` | Usuario con `is_active=False` | → HTTPException 401 con `detail="account_disabled"` |
| L-E2 | `login_empty_email` | Email vacío (`""`) + password válida | → HTTPException 422 con `detail="missing_login_credentials"` |
| L-E3 | `login_empty_password` | Email válido + password vacía (`""`) | → HTTPException 422 con `detail="missing_login_credentials"` |

**Por qué estos límites:** El caso de usuario inactivo es una regla de negocio que podría cambiarse accidentalmente. Los campos vacíos representan entradas de formulario maliciosas o erróneas que el backend debe rechazar explícitamente.

#### Modos Fallo

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| L-F1 | `login_wrong_password` | Email existente + contraseña incorrecta | → HTTPException 401 con `detail="email_or_password_incorrect"` |
| L-F2 | `login_email_not_found` | Email no registrado | → HTTPException 401 con **el mismo mensaje** que L-F1 (evitar enumeración de usuarios) |
| L-F3 | `login_malformed_json` | Body `"esto no es json"` | → HTTPException 422 con `detail="invalid_json_body"` |
| L-F4 | `login_form_urlencoded` | Headers `content-type: application/x-www-form-urlencoded` con username+password | → 200, el token se genera correctamente extrayendo credenciales del form |

**Por qué estos fallos:** L-F1 y L-F2 prueban que el mensaje de error es idéntico (seguridad contra enumeración). L-F3 prueba formato inválido. L-F4 prueba el flujo alternativo de OAuth2 (form-urlencoded), que tiene lógica separada dentro del mismo endpoint.

---

### 2. `GET /auth/me`

Devuelve la información del usuario autenticado.

#### Happy Path

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| M-H1 | `auth_me_ok` | Token JWT válido + usuario existe | → 200, devuelve `id`, `email`, `role`, `profile` |

#### Caso Límite

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| M-E1 | `auth_me_no_profile` | Token válido, usuario sin perfil asociado | → 200, `profile` es `None` |

**Por qué:** El perfil es opcional. Si el backend devuelve `null` cuando no hay perfil, el frontend debe manejarlo. Si devolviera `{}` o un error, sería un bug.

#### Modo Fallo

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| M-F1 | `auth_me_unauthenticated` | Sin token (o token inválido) | → HTTPException 401 con `detail="credentials_invalid"` |

**Por qué:** Es el escenario de regresión que inspiró el ticket — si un refactor rompe la validación del token, este test lo detecta.

---

### 3. `POST /auth/forgot-password`

Solicita un enlace de restablecimiento de contraseña.

#### Happy Path

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| F-H1 | `forgot_password_existing_user` | Email registrado + usuario activo | → 200, `send_reset_email` llamado una vez con el email y token |

#### Casos Límite

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| F-E1 | `forgot_password_nonexistent_user` | Email **no** registrado | → 200 con **el mismo mensaje** que F-H1 (evitar enumeración de usuarios). `send_reset_email` **no** se llama. |
| F-E2 | `forgot_password_empty_email` | Email vacío (`""`) | → validación Pydantic lanza error (422) |

**Por qué F-E1:** Es idéntico al caso de login — el mensaje de éxito no debe revelar si el email existe o no. C-1 de la auditoría corrigió el `except: pass` pero la decisión de no filtrar existencia del email se prueba aquí.

#### Modo Fallo

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| F-F1 | `forgot_password_email_fails` | Email existe pero `send_reset_email` lanza excepción | → 200 (catch silencioso). `logger.exception` se llama (verificar con mock). El usuario ve éxito aunque el email no se envió. |

**Por qué:** Es el hallazgo crítico C-1 de la auditoría. La corrección aplicada (pasar de `except: pass` a `logger.exception`) debe verificarse que el flujo sigue sin romperse y que el error queda registrado.

---

### 4. `POST /auth/reset-password`

Restablece la contraseña usando un token JWT de corta duración.

#### Happy Path

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| R-H1 | `reset_password_ok` | Token válido + nueva contraseña | → 200, `update_user` llamado con nuevo hash, token invalidado en `used_tokens` |

#### Caso Límite

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| R-E1 | `reset_password_new_password_same_as_old` | Token válido + contraseña igual a la actual | → 200 (técnicamente permitido, el hash será distinto por el salt bcrypt). No hay regla que lo impida. |

**Por qué:** No hay validación de "contraseña no puede ser igual a la anterior" en el código actual. Este caso documenta ese comportamiento.

#### Modos Fallo

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| R-F1 | `reset_password_invalid_token` | Token basura `"not-a-token"` | → HTTPException 400, `detail="reset_link_invalid"` |
| R-F2 | `reset_password_expired_token` | Token con `exp` en el pasado | → HTTPException 400, `detail="reset_link_invalid"` |
| R-F3 | `reset_password_used_token` | Token válido pero ya en `used_tokens` | → HTTPException 400, `detail="reset_link_used"` |

**Por qué estos tres fallos:** Validan las tres comprobaciones de `verify_reset_token`: firma JWT (R-F1), expiración (R-F2) y token ya usado (R-F3). Una regresión en cualquiera de ellas permitiría ataques de reutilización de tokens.

---

### 5. `POST /auth/change-password`

Cambia la contraseña del usuario autenticado.

#### Happy Path

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| C-H1 | `change_password_ok` | Token válido + contraseña actual correcta + nueva contraseña | → 200, `update_user` llamado con nuevo hash |

#### Caso Límite

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| C-E1 | `change_password_user_not_found` | Token válido + usuario autenticado fue eliminado entre login y esta petición | → HTTPException 404 con `detail="user_not_found"` |

**Por qué:** Es el hallazgo A-11 de la auditoría. La corrección añadió `if user is None:` check. Este test verifica que la corrección funciona en un escenario de inconsistencia de BD.

#### Modos Fallo

| ID | Nombre | Entrada | Comportamiento esperado |
|---|---|---|---|
| C-F1 | `change_password_wrong_current` | Token válido + contraseña actual incorrecta | → HTTPException 400, `detail="email_or_password_incorrect"` |
| C-F2 | `change_password_unauthenticated` | Sin token JWT | → HTTPException 401, `detail="credentials_invalid"` |
| C-F3 | `change_password_empty_current` | Token válido + contraseña actual vacía | → HTTPException 400 (porque `verify_password("", hash)` devuelve `False`) |

**Por qué:** C-F2 prueba que el decorador `Depends(get_current_user)` funciona. C-F3 prueba un caso de entrada vacía. C-F1 es el camino de fallo principal.

---

## Resumen de fases planificadas

| Fase | Ámbito | Casos | Estado |
|---|---|---|---|
| **Fase 1** | Endpoints de `routes/auth.py` (5 endpoints) | **25** | ✅ Planificado (este documento) |
| **Fase 2a** | Funciones de `auth.py` (hash, JWT, tokens) | 22 | ⏳ Pendiente |
| **Fase 2b** | Capa de servicios `services.py` (CRUD usuarios) | 14 | ⏳ Pendiente |
| **Fase 2c** | Cliente TypeScript `src/services/auth.ts` | 30 | ⏳ Pendiente |
| **Total** | Perímetro de autenticación completo | **94** | 📋 Planificado |

---

## Notas técnicas sobre la implementación de tests

### Backend

- Los tests usarán **pytest** con `tmp_path` para crear bases de datos TinyDB temporales y aisladas.
- `SECRET_KEY` se fijará en los tests con `unittest.mock.patch` para poder verificar y firmar tokens predecibles.
- `send_reset_email` se mockeará con `unittest.mock.patch` para evitar llamadas reales a la API de Resend.
- Los tests NO levantarán el servidor HTTP. Las funciones de los endpoints se invocarán construyendo los argumentos manualmente (Request, payloads) para probar la lógica de negocio directamente.
- Las excepciones `HTTPException` se capturan con `pytest.raises()` y se verifica su `status_code` y `detail`.

### Frontend

- Los tests usarán **Jest** con entorno `jsdom`.
- `localStorage` se mockeará globalmente con `jest.fn()`.
- `fetch` se mockeará con `jest.fn()` y `mockResolvedValue`/`mockRejectedValue`.
- `window.location.href` se mockeará con `Object.defineProperty`.
- El archivo de setup global se definirá en `jest.config.js`.

---

*Este documento se actualizará a medida que se añadan nuevas fases de pruebas.*