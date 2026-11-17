# Evidencia — endurecimiento del servidor (OWASP A05)

**Estado al 2026-11-17: NO APLICADO / NO VERIFICADO en un host remoto.** No se facilitó un host de staging/producción ni acceso SSH/sudo. No se afirma que el servidor tenga los controles aplicados. No se ejecutó firewall ni se modificó SSH en este entorno de desarrollo/Codespace.

## Artefactos de implementación

- `infra/security/harden-linux-server.sh`: automatiza la cuenta operativa `trackflow-ops` (sudo, clave pública SSH únicamente), `PermitRootLogin no`, cuenta de servicio `trackflow-svc` bloqueada/no-login, permisos separados de código/config/logs/datos y política UFW mínima. Incluye guardas para puerto SSH, confirmación de reset, backup previo y rechazo si Docker está activo.
- `infra/security/collect-linux-hardening-evidence.sh`: auditor de solo lectura que comprueba ajustes SSH efectivos para root y el operador, estado/reglas UFW, ambas cuentas, permisos de carpetas y posible bypass Docker.
- `infra/security/README.es.md`: procedimiento, precondiciones, recuperación y ejecución.

## Validaciones disponibles desde el repositorio

| Comprobación | Resultado | Qué demuestra |
|---|---|---|
| `bash -n infra/security/harden-linux-server.sh` | **PASS** — 2026-11-17, workspace | Solo sintaxis del aplicador; no estado del host. |
| `bash -n infra/security/collect-linux-hardening-evidence.sh` | **PASS** — 2026-11-17, workspace | Solo sintaxis del colector; no estado del host. |
| `git diff --check` | **PASS** — 2026-11-17, workspace | No indica whitespace conflictivo; no estado del host. |
| Ejecución en host objetivo | Pendiente: host/acceso no disponible | Única que puede probar los controles reales del servidor. |
| Segunda sesión SSH y servicios de aplicación | Pendiente | Confirma acceso operativo tras cambio. |
| Firewall cloud/proveedor | Pendiente | No se puede inferir del firewall del host. |

## Plantilla de evidencia a completar en el host

Tras revisar topología y aplicar en un host autorizado (inicialmente staging), adjuntar aquí o bajo `docs/security/evidence/` la salida de:

```bash
bash infra/security/collect-linux-hardening-evidence.sh
```

Registrar además, sin credenciales: entorno, fecha UTC, referencia del cambio, confirmación de `trackflow-ops` y su acceso por clave desde una segunda sesión SSH, SSH root rechazado, puerto SSH esperado/detectado, prueba HTTPS, permisos del colector, lista de puertos autorizados del firewall del proveedor y revisión de `DOCKER-USER`/bindings si Docker existe. Nunca adjuntar claves públicas que identifiquen a operadores ni almacenar en Git el backup UFW del host.

**Criterio de cierre:** cada control pasa en el host objetivo, la segunda conexión SSH y la aplicación funcionan, no hay puertos de ingreso no justificados (incluida exposición por Docker/cloud) y evidencia redactada queda adjunta. Hasta entonces, estado OWASP A05 = parcial, no cerrado.
