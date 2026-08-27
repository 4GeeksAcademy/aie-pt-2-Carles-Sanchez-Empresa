"""
i18n/es.py — Diccionario de textos en español para la API de TrackFlow.
"""

messages = {
    # ─── Auth ───
    "credentials_invalid": "No se pudieron validar las credenciales",
    "email_or_password_incorrect": "Email o contraseña incorrectos",
    "account_disabled": "La cuenta está desactivada",
    "admin_required": "Se requieren permisos de administrador para acceder a este recurso",
    "reset_link_invalid": "El enlace de restablecimiento no es válido o ha expirado. Solicita uno nuevo.",
    "reset_link_used": "Este enlace de restablecimiento ya ha sido utilizado. Solicita uno nuevo.",
    "missing_credentials": "Faltan campos requeridos: username y password",
    "invalid_json_body": "Body JSON inválido. Use email/password o username/password",
    "missing_login_credentials": "Faltan credenciales de acceso",
    "forgot_password_success": "Formulario rellenado correctamente, recibirás un enlace en breves",

    # ─── Users ───
    "email_invalid": "Email inválido",
    "password_min_length": "La contraseña debe tener al menos 6 caracteres",
    "email_already_registered": "El email '{}' ya está registrado",
    "user_not_found": "Usuario no encontrado",
    "user_deleted": "Usuario eliminado correctamente",
    "cannot_delete_self": "No puedes eliminarte a ti mismo",
    "email_updated": "Email actualizado correctamente",

    # ─── Suppliers ───
    "supplier_not_found": "Proveedor no encontrado",
    "supplier_deleted": "Proveedor eliminado correctamente",

    # ─── Incidents ───
    "incident_not_found": "Incidencia no encontrada",
    "invalid_transition": "Transición de estado no válida: de '{current}' a '{next}'",
    "description_min_length": "La descripción debe tener al menos 5 caracteres",
    "invalid_category": "Categoría no válida. Debe ser una de: {}",
    "invalid_origin": "Origen no válido. Debe ser uno de: {}",
    "invalid_branch": "Sede no válida. Debe ser una de: {}",
    "incident_deleted": "Incidencia eliminada correctamente",

    # ─── CSV / Analyze ───
    "csv_extension_required": "El fichero debe tener extensión .csv",
    "csv_read_error": "Error al leer el fichero. Revisa el archivo e inténtalo de nuevo.",
    "csv_empty": "El fichero está vacío.",
    "csv_parse_error": "Error al parsear el CSV. Revisa el formato e inténtalo de nuevo."
    "csv_empty_rows": "El archivo CSV está vacío o solo tiene encabezados.",
    "no_analysis_found": "No hay ningún análisis previo. Realiza un POST /api/incidents/analyze primero.",

    # ─── Profile ───
    "profile_not_found": "Perfil no encontrado",

    # ─── General ───
    "internal_error": "Error interno del servidor. Contacte al administrador.",
    "not_found": "No encontrado",
    "no_permission_view_user": "No tienes permiso para ver este usuario",
    "no_permission_edit_user": "No tienes permiso para modificar este usuario",
    "only_admin_change_role": "Solo los administradores pueden cambiar el rol",
    "password_updated": "Contraseña actualizada correctamente",

    # ─── Email ───
    "email_subject_reset": "TrackFlow — Restablece tu contraseña",
    "email_reset_intro": "Has solicitado restablecer tu contraseña de TrackFlow. Haz clic en el siguiente botón para crear una nueva contraseña:",
    "email_reset_button": "Restablecer contraseña",
    "email_reset_expiry": "Este enlace expira en 60 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.",
    "email_reset_fallback": "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    "email_footer": "TrackFlow — Plataforma de logística",
    "email_admin_panel": "Panel de administración",
    "email_reset_title": "🔐 Restablece tu contraseña",
}