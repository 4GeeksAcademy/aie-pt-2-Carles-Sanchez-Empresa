"""
i18n/__init__.py — Sistema de internacionalización para la API de TrackFlow.

Uso:
    from i18n import get_translator
    t = get_translator("en")
    msg = t("email_or_password_incorrect")
"""

from typing import Callable


def get_translator(lang: str = "es") -> Callable[[str], str]:
    """
    Devuelve una función traductora que recibe una clave y devuelve el
    texto en el idioma seleccionado.

    Args:
        lang: Código de idioma ("es" o "en"). Por defecto "es".

    Returns:
        Función t(key: str, **kwargs) -> str que traduce una clave.
    """
    from .es import messages as es_messages
    from .en import messages as en_messages

    _messages = {
        "es": es_messages,
        "en": en_messages,
    }

    lang_messages = _messages.get(lang, _messages["es"])

    def t(key: str, **kwargs) -> str:
        msg = lang_messages.get(key, key)
        if kwargs:
            return msg.format(**kwargs)
        return msg

    return t


def get_language_from_request(request) -> str:
    """
    Extrae el idioma de una petición FastAPI.

    Orden de precedencia:
      1. Header X-Language
      2. Query param ?lang=
      3. Por defecto "es"
    """
    lang = request.headers.get("X-Language", "")
    if not lang:
        lang = request.query_params.get("lang", "es")
    return lang if lang in ("es", "en") else "es"