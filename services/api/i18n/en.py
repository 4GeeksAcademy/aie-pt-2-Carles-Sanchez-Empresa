"""
i18n/en.py — Diccionario de textos en inglés para la API de TrackFlow.
"""

messages = {
    # ─── Auth ───
    "credentials_invalid": "Could not validate credentials",
    "email_or_password_incorrect": "Incorrect email or password",
    "account_disabled": "This account is disabled",
    "admin_required": "Admin privileges are required to access this resource",
    "reset_link_invalid": "The reset link is invalid or has expired. Please request a new one.",
    "reset_link_used": "This reset link has already been used. Please request a new one.",
    "missing_credentials": "Missing required fields: username and password",
    "invalid_json_body": "Invalid JSON body. Use email/password or username/password",
    "missing_login_credentials": "Missing login credentials",
    "forgot_password_success": "Form submitted successfully. You will receive a link shortly.",

    # ─── Users ───
    "email_invalid": "Invalid email",
    "password_min_length": "Password must be at least 6 characters",
    "email_already_registered": "The email '{}' is already registered",
    "user_not_found": "User not found",
    "user_deleted": "User successfully deleted",
    "cannot_delete_self": "You cannot delete yourself",
    "email_updated": "Email updated successfully",

    # ─── Suppliers ───
    "supplier_not_found": "Supplier not found",
    "supplier_deleted": "Supplier successfully deleted",

    # ─── Incidents ───
    "incident_not_found": "Incident not found",
    "invalid_transition": "Invalid status transition: from '{current}' to '{next}'",
    "description_min_length": "Description must be at least 5 characters",
    "invalid_category": "Invalid category. Must be one of: {}",
    "invalid_origin": "Invalid origin. Must be one of: {}",
    "invalid_branch": "Invalid branch. Must be one of: {}",
    "incident_deleted": "Incident successfully deleted",

    # ─── CSV / Analyze ───
    "csv_extension_required": "The file must have a .csv extension",
    "csv_read_error": "Error reading file. Please check the file and try again.",
    "csv_empty": "The file is empty.",
    "csv_parse_error": "Error parsing CSV. Check the format and try again.",
    "csv_empty_rows": "The CSV file is empty or has only headers.",
    "no_analysis_found": "No previous analysis found. Perform a POST /api/incidents/analyze first.",

    # ─── Profile ───
    "profile_not_found": "Profile not found",

    # ─── General ───
    "internal_error": "Internal server error. Please contact the administrator.",
    "not_found": "Not found",
    "no_permission_view_user": "You do not have permission to view this user",
    "no_permission_edit_user": "You do not have permission to edit this user",
    "only_admin_change_role": "Only administrators can change the role",
    "password_updated": "Password updated successfully",

    # ─── Email ───
    "email_subject_reset": "TrackFlow — Reset your password",
    "email_reset_intro": "You requested to reset your TrackFlow password. Click the button below to create a new password:",
    "email_reset_button": "Reset password",
    "email_reset_expiry": "This link expires in 60 minutes. If you didn't request this change, you can ignore this message.",
    "email_reset_fallback": "If the button doesn't work, copy and paste this link into your browser:",
    "email_footer": "TrackFlow — Logistics Platform",
    "email_admin_panel": "Admin Panel",
    "email_reset_title": "🔐 Reset your password",
}