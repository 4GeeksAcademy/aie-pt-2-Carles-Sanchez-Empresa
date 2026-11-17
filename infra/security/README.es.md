# Endurecimiento de host Linux (OWASP A05)

Estos scripts automatizan controles del **host Linux** que no se pueden demostrar desde el código de la aplicación:

- SSH efectivo con `PermitRootLogin no` (sin alterar `PasswordAuthentication`, para no bloquear el acceso existente).
- Cuenta de servicio `trackflow-svc` bloqueada y sin shell interactiva; directorios separados con permisos mínimos.
- Firewall UFW: denegar entrada por defecto y permitir únicamente SSH en el puerto detectado de la sesión más HTTPS 443. HTTP 80 solo si se habilita expresamente.

## Límites y requisitos previos

- Debian/Ubuntu con systemd, OpenSSH Server y acceso sudo. Ejecutar desde una **sesión SSH existente con un usuario sudo no-root** y mantenerla abierta hasta probar una segunda conexión.
- No ejecutar en Codespaces ni asumir que el host de desarrollo sea el servidor productivo. No se ha ejecutado ningún cambio remoto durante esta tarea porque no se proporcionaron host/credenciales/acceso ni la arquitectura de producción.
- Identificar previamente la arquitectura productiva, el puerto SSH, el proxy/TLS, la consola de recuperación y reglas del proveedor cloud. El firewall cloud debe reflejar la misma lista de entrada.
- El script detecta el puerto remoto a partir de `SSH_CONNECTION`; falla de forma segura si no puede hacerlo. Bloquea la ejecución si Docker está activo: puertos publicados por Docker pueden saltarse UFW y necesitan una política adicional en `DOCKER-USER` o binding a loopback.
- La ejecución resetea reglas existentes de UFW tras crear un backup, por lo que requiere confirmación consciente. Si hay otros servicios, redes privadas, monitorización u otro SSH de administración, incorporar y revisar los puertos antes; el script deliberadamente rechaza puertos extra sin modificación revisada.
- La cuenta `trackflow` es una cuenta de servicio sin login. Concede ownership solo a `/var/lib/trackflow` y `/var/log/trackflow`; `/opt/trackflow` es `root:trackflow` y no escribible por el grupo. Adaptar rutas si el despliegue real necesita otras carpetas.

## Aplicar

```bash
# Tras revisar topología, reglas del proveedor y tener consola/rollback disponibles:
TRACKFLOW_CONFIRM_UFW_RESET=YES \
  bash infra/security/harden-linux-server.sh
```

Ejecutar como el usuario operador no-root con sudo (el script invoca `sudo` en cada operación). No anteponer `sudo`, ya que el aplicador rechaza ejecución como root. La comprobación explícita de `sudo` puede pedir la contraseña. `TRACKFLOW_ALLOW_HTTP=1` solo debe usarse si el proxy/ACME necesita puerto 80; lo habitual es terminar TLS en 443.

Después de aplicar, **sin cerrar la sesión original**:

1. Desde otro terminal, comprobar una segunda conexión SSH con el usuario operador normal y su clave habitual.
2. Verificar acceso a la aplicación por HTTPS y servicios de monitorización/backup.
3. Recopilar la salida del colector de solo lectura:

```bash
bash infra/security/collect-linux-hardening-evidence.sh | tee linux-hardening-evidence.txt
```

4. Guardar la salida redactada en `docs/security/evidence/` junto con fecha, entorno (staging/producción), operador y referencia de cambio. No incluir IPs públicas si la política no lo permite, nombres de usuario personales, claves ni secretos. El colector nunca lee contenido de claves.

Si falla la conexión secundaria, mantener viva la conexión original y restaurar reglas respaldadas bajo `/var/backups/trackflow-ufw-*/ufw-config.tgz`, o usar consola del proveedor. La copia del archivo contiene configuración local, debe mantenerse con permisos restringidos y no subirse al repositorio.

## Evidencia reproducible local

Los scripts se validan sintácticamente con `bash -n`. Esa validación **no prueba** el estado de un host. La evidencia real es la salida del colector ejecutado en el servidor objetivo tras aplicar y comprobar el acceso; las reglas del proveedor/cloud y el bypass de Docker deben adjuntarse/revisarse por separado.
