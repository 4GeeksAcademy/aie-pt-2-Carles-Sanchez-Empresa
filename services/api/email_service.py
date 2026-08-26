"""
email_service.py — Servicio de correo transaccional (Resend) para TrackFlow.

Envía emails de restablecimiento de contraseña mediante la API de Resend.
La API key se carga desde la variable de entorno RESEND_API_TOKEN.
"""

import os
from pathlib import Path

import resend
from dotenv import load_dotenv

# Carga el .env desde la raíz del proyecto
dotenv_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path)

RESEND_API_TOKEN = os.getenv("RESEND_API_TOKEN", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000")

resend.api_key = RESEND_API_TOKEN


def send_reset_email(to_email: str, token: str, lang: str = "es") -> None:
    """
    Envía un email con el enlace de restablecimiento de contraseña.

    Args:
        to_email: Dirección de correo del destinatario.
        token: Token JWT de restablecimiento (se incluye en la URL).
        lang: Código de idioma ("es" o "en") para el contenido del email.
    """
    from i18n import get_translator
    t = get_translator(lang)

    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    html_body = _build_email_html(reset_url, t, lang)

    try:
        response = resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": to_email,
            "subject": t("email_subject_reset"),
            "html": html_body,
        })
        print(f"[email_service] Email enviado a {to_email}: {response}")
    except Exception as e:
        # En desarrollo, no queremos que falle el flujo si el email no se envía
        print(f"[email_service] Error al enviar email a {to_email}: {e}")


def _build_email_html(reset_url: str, t, lang: str = "es") -> str:
    """
    Construye el HTML del email, responsive para móvil, sin estilos externos.
    """
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" style="width:100%;max-width:480px;margin:0 auto;padding:24px 16px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="text-align:center;padding-bottom:24px;">
        <span style="font-size:40px;">🚚</span>
        <h1 style="font-size:24px;font-weight:700;color:#1f2937;margin:8px 0 0 0;">TrackFlow</h1>
        <p style="font-size:14px;color:#6b7280;margin:4px 0 0 0;">{'Panel de administración' if lang == 'es' else 'Admin panel'}</p>
      </td>
    </tr>
    <tr>
      <td style="background-color:#ffffff;border-radius:12px;padding:32px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="font-size:20px;font-weight:600;color:#1f2937;margin:0 0 16px 0;">{'🔐 Restablece tu contraseña' if lang == 'es' else '🔐 Reset your password'}</h2>
        <p style="font-size:15px;color:#4b5563;line-height:1.6;margin:0 0 24px 0;">
          {t("email_reset_intro")}
        </p>
        <table role="presentation" style="width:100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;">
              <a href="{reset_url}"
                 style="display:inline-block;background-color:#3B82F6;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                {t("email_reset_button")}
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size:14px;color:#9ca3af;line-height:1.5;margin:24px 0 0 0;">
          {t("email_reset_expiry")}
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 0 0;">
        <p style="font-size:12px;color:#9ca3af;margin:16px 0 0 0;">
          {t("email_reset_fallback")}<br>
          <span style="color:#3B82F6;word-break:break-all;">{reset_url}</span>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding-top:24px;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">TrackFlow — {'Plataforma de logística' if lang == 'es' else 'Logistics platform'}</p>
      </td>
    </tr>
  </table>
</body>
</html>"""