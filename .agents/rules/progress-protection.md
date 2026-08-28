---
title: Protección del archivo progress.md
description: Regla para preservar el historial del archivo progress.md. No borrar información previa sin autorización explícita del usuario.
alwaysActive: true
appliesTo: ".memory-bank/progress.md"
---

# Protección del archivo progress.md

## Alcance

Esta regla aplica al archivo `.memory-bank/progress.md` del proyecto.

## Reglas Obligatorias

### 1. Preservación del historial

Cuando se actualice el archivo `.memory-bank/progress.md`:

- **No se debe borrar ni sobrescribir información previa** a menos que haya cambiado la dirección u objetivo principal del proyecto.
- Si ha cambiado la dirección del proyecto, **preguntar siempre al usuario antes de eliminar cualquier contenido histórico.**
- En cualquier otro caso, la información existente debe mantenerse intacta, añadiendo los nuevos progresos al final del archivo o en la sección correspondiente sin eliminar lo anterior.

### 2. Autorización obligatoria

Ante cualquier duda sobre si eliminar o modificar contenido existente en `progress.md`:

1. Detener la operación.
2. Preguntar al usuario si autoriza la eliminación o modificación.
3. Esperar respuesta explícita antes de proceder.

### 3. Actualización segura

- Preferir siempre **añadir** nueva información en lugar de reemplazar la existente.
- Si es necesario reestructurar el contenido, conservar todo el historial previo y solo reorganizar su presentación.