# Contexto del Proyecto 
- **Objetivo**: Crear un frontend para gestionar las candidaturas que recibe una empresa, filtrarlas por estado y etapa y abrir el detalle de cada una sin perder el contexto del listado.
- Contexto del proceso de seleccion:
    - Puesto: Asistende de Direccion
    - Empresa: Trackflow
    - Ubicacion: Sede de Zaragoza
    - Perfil buscado: experiencia en asistencia ejecutiva, gestion de agenda y viajes, ingles profesional, manejo de herramientas ofimaticas.
- La API esta lista para usarse (no modificar ni adaptar!): https://playground.4geeks.com/tracker/api/v1/docs
- La navegacion entre vistas debe usar sistema de rutas de Next.js (sin recargas completas de pagina)
- Usa unicamente tipos TypeScript bien tipados, usa Next.js (App Router) y React. 
- No uses librerias externas de gestion de estados (Redux, Zustand, Jotai, etc).
- Es suficiente el estado a nivel componente con hooks.


# Contexto de la Tarea
- Mostrar todas las candidaturas en un listado:
    - Nombre
    - Puesto
    - Estado Actual
    - Etapa Actual
- Filtros: por estado y por etapa.
- Busqueda: por nombre o mail
- Vista de Detalle de candidato: dentro permite cambiar su estado o etapa con una sola interaccion.
- Agregar/Elimiar notas a una candidatura.
- Registrar nuevas candidaturas desde la interfaz y editar los datos de una cuuando se necesite corregir algo.

## Vistas y navegacion:
- Crear una pagina de listado de candidaturas (uis/talent-pipeline-tracker)
    - Muestra todos los candidatos obtenidos desde "GET /records"
- Crear una pagina de detalle de candidaturas (uis/talent-pipeline-tracker/candidates/[id])
    - Obtiene y muestra los datos completos desde "GET /records/:id
- Navegación entre vistas "lista de candidatos" y "detalles" sin recargas.

### Listado de candidaturas:
- Muestra: nombre completo, puesto, estado actual y estapa actual del candidato.
- Implementa filtros por estado y por etapa uusando query parameters "useSearchParams".
- Implementa un campo de busqueda que filtre por nombre/email sin recarga de pagina.
- Muestra un estado de carga mientras se obtienen datos y un mensaje de error is la peticion falla.

### Detalle de la candidatura:
- Muestra: nombre, email, telefono, puesto, Linkedln, enlace al CV, años de experiencia, estado, etapa y fecha de aplicacion.
- Incluye: 
    - Control para **actualizar el estado** usando "PATCH /records/:id"
    - Control para **actualizar la etapa** usando "PATCH /records/:id"
- Muestra lisado de notas obtenidas de "GET /records/:id/notes"
- Permite añadir una nueva nota mediante "POST /records/:id/notes"
- Permite eliminar una nota mediante "DELETE /records/:id/notes/:note_id"

### Gestion de candidaturas:
- Incluye:
    - Formulario para registrar una nueva candidatura "POST /records"
    - Formulario para editar los datos de una candidatura "PUT /records/:id"
- Ambos formularios deben validar los campos requeridos antes de enviarse.
- Mostrar feedback de exito o error tras cada envio.


# Contexto de la Salida
- Todas las peticiones a la API deben gestionarse de forma asincrona con "async/await"
- La interfaz debe comunicar los estados de carga y manejar los errores con claridad. (sin errores silenciosos)
- Cada operacion de obtencion de datos debe tener al menos tres estados en la UI: cargando, exito y error.
- Tras un PUT, PATCH o POST, actualiza la interfaz para reflejar los cambios sin requerir recargar completamente la pagina.
- El codigo debe estar organizado correctamente en carpetas de forma clara:
    - Componentes: uis/talent-pipeline-tracker/components
    - Hooks (si aplica): uis/talent-pipeline-tracker/hooks
    - Types: uis/talent-pipeline-tracker/types
    - Librerias: uis/talent-pipeline-tracker/lib
    - Servicios: uis/talent-pipeline-tracker/services
- No hay prop drilling - el estado esta correctamente acotado a nivel de componente.

# API y datos
Los valores crudos de la APU no deben salir en la interfaz, usar las etiqueras a continuacion:

Valores de estado de candidatura:
    - recieved -> Recibida
    - in_progress -> En proceso
    - selected -> Seleccionada
    - discarded -> Descartada

Valores de etapa de candidatura:
    - pending -> Pendiente de revision
    - review -> En revision
    - personal_interview -> Entrevista personal
    - technical_interview -> Estrevista tecnica
    - offer_presented -> Oferta presentada