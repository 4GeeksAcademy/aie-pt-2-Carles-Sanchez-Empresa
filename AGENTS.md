# AGENTS.md — Guía de Operación para Agentes de IA

Este documento define el flujo de trabajo obligatorio que **todo agente de IA** debe seguir al operar en este repositorio. Su propósito es garantizar consistencia, trazabilidad y calidad en cada contribución al proyecto **TrackFlow**.

---

## 📖 Archivos del Memory Bank — Lectura Obligatoria al Inicio de Cada Sesión

Al comenzar una sesión de trabajo, el agente **debe leer** los siguientes archivos del `.memory-bank/` para obtener contexto completo del proyecto:

| Archivo | Propósito |
|---|---|
| `.memory-bank/projectbrief.md` | Descripción del negocio, organigrama y problemas de cada departamento de TrackFlow |
| `.memory-bank/techContext.md` | Stack tecnológico, decisiones de arquitectura y restricciones técnicas del proyecto |
| `.memory-bank/progress.md` | Checklist de hitos completados y próximos pasos planificados |

Si alguno de estos archivos no existe, el agente debe informarlo antes de continuar.

---

## ⚙️ Flujo de Trabajo Pre-Commit (4 Pasos Obligatorios)

Antes de realizar cualquier `git commit`, el agente debe ejecutar estos **4 pasos en orden**:

### Paso 1 — Leer el Memory Bank y el Contexto del Proyecto

- Leer los 3 archivos del `.memory-bank/` (ver sección anterior).
- Leer `CONTEXT.md` para entender el contexto de la empresa.
- Leer `README.md` para conocer la estructura general del monorepo.
- Identificar el directorio de trabajo relevante según la tarea (ej. `uis/talent-pipeline-tracker/`, `src/`, etc.).
- Si la tarea implica un área con `README.md` propio (como `agents/`, `services/`, `workflows/`), leerlo también.

**Salida esperada**: comprensión completa del estado actual del proyecto, la rama activa y qué archivos están implicados en la tarea.

### Paso 2 — Planificar y Confirmar la Intervención

- Redactar un plan breve con los cambios a realizar (qué archivos crear, modificar o eliminar).
- Si la tarea es compleja (múltiples archivos, cambios en lógica de negocio o arquitectura), usar `manage_todo_list` para desglosar y hacer seguimiento.
- Verificar que el plan no contradice ninguna restricción técnica documentada en `techContext.md`.
- Mostrar el plan al usuario y esperar confirmación antes de proceder (salvo que el usuario haya dado instrucciones explícitas de proceder directamente).

**Salida esperada**: plan claro y validado antes de escribir código.

### Paso 3 — Implementar los Cambios con Validación Continua

- Escribir o modificar el código siguiendo el plan aprobado.
- Respetar en todo momento el stack tecnológico y las decisiones de arquitectura documentadas en `techContext.md`.
- Realizar verificaciones intermedias:
  - **Errores de compilación**: ejecutar `npm run build`, `tsc --noEmit` o el comando relevante.
  - **Errores de linting**: ejecutar `npm run lint` si está configurado.
  - **Errores de sintaxis**: en Python, usar pylance si aplica.
- Si se detectan errores, corregirlos antes de continuar.
- Si un cambio requiere modificar más archivos de los planificados, pausar y notificar al usuario.

**Salida esperada**: código funcionando, sin errores de compilación ni linting.

### Paso 4 — Actualizar la Documentación y Hacer Commit

- **Actualizar `.memory-bank/progress.md`**: marcar los nuevos hitos completados.
- **Actualizar `.memory-bank/techContext.md`** si se introdujeron nuevas tecnologías, decisiones de arquitectura o restricciones técnicas.
- **Actualizar `.memory-bank/progress.md`** si se ha completado algun hito nuevo de la lista de futuros pasos.
- Si se creó una nueva funcionalidad o servicio, verificar que su `README.md` local esté actualizado.
- Redactar un mensaje de commit descriptivo siguiendo el formato:
  ```
  tipo(ámbito): descripción breve
  
  - Detalle del cambio 1
  - Detalle del cambio 2
  ```
  Tipos permitidos: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`.
- Ejecutar `git add` y `git commit` con el mensaje redactado.

**Salida esperada**: commit realizado con documentación actualizada y mensaje descriptivo.

---

## 📋 Resumen del Flujo

```
┌─────────────────────────────────────────────────┐
│  1. LEER Memory Bank + contexto del proyecto    │
│     (projectbrief.md, techContext.md, progress)  │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  2. PLANIFICAR y confirmar intervención         │
│     (todo list, verificar restricciones)         │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  3. IMPLEMENTAR con validación continua         │
│     (build, lint, test tras cada cambio)         │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  4. DOCUMENTAR y hacer commit                    │
│     (progress.md, techContext.md, git commit)    │
└─────────────────────────────────────────────────┘
```

---

## � Archivos Protegidos — No Modificar Sin Confirmación

Los siguientes archivos **no deben ser modificados, creados ni eliminados** por el agente sin **autorización explícita del usuario**. Cualquier propuesta de cambio en estos archivos debe detenerse y esperar confirmación antes de proceder:

| Archivo | Motivo de protección |
|---|---|
| `.gitignore` | Controla qué archivos quedan excluidos del repositorio. Un cambio incorrecto puede exponer credenciales o romper el flujo de trabajo de otros desarrolladores. |
| `.env.local` | Contiene variables de entorno locales, claves de API y secretos. Nunca debe compartirse ni modificarse sin instrucciones precisas del usuario. |
| `.env.example` | Plantilla de variables de entorno que sirve de referencia al equipo. Su modificación puede desincronizar la documentación de configuración del proyecto. |
| `package-lock.json` / `yarn.lock` | Archivos de bloqueo de dependencias. Solo deben actualizarse mediante gestores de paquetes (`npm install`, `yarn add`), nunca editándose manualmente. |
| `next.config.ts` | Configuración del servidor Next.js (rewrites, headers, redirects). Cambios indebidos pueden afectar al enrutamiento o la seguridad. |
| `eslint.config.mjs` | Reglas de linting del proyecto. Modificarlas sin coordinación puede ocultar errores o introducir inconsistencias. |
| `tsconfig.json` | Configuración del compilador TypeScript. Cambios pueden afectar a todo el proyecto. |

> **Nota**: si una tarea requiere modificar alguno de estos archivos, el agente debe:
> 1. Explicar al usuario **por qué** es necesario el cambio.
> 2. Esperar confirmación explícita antes de realizarlo.
> 3. Documentar en el mensaje de commit que se trató de un cambio autorizado sobre un archivo protegido.

---

## �🚫 Reglas Adicionales

- **Nunca** modificar archivos sin haber leído antes el Memory Bank.
- **Nunca** hacer commit sin pasar por los 4 pasos.
- Si un paso no puede completarse (ej. error de compilación no resoluble), notificar al usuario y **no** hacer commit.
- Si el usuario proporciona instrucciones explícitas que contravienen este flujo, prevalecerá la instrucción del usuario, pero debe quedar registrado en el mensaje de commit.