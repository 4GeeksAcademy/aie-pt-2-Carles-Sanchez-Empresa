"""Deterministic, layered input/output controls for the TrackFlow CX agent."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo


BUSINESS_TERMS = re.compile(
    r"(?i)\b(?:trackflow|env[ií]o|paquete|pedido|tracking|seguimiento|devoluci[oó]n|"
    r"incidencia|entrega|transportista|log[ií]stica|shipment|delivery|return|"
    r"tracking|order|package|carrier)\b"
)

_JAILBREAK_PATTERNS = (
    re.compile(r"(?i)\b(?:ignore|disregard|forget|override)\b.{0,80}\b(?:previous|prior|system|instructions?|rules?)\b"),
    re.compile(r"(?i)\b(?:ignora|olvida|omite|desactiva|anula)\b.{0,80}\b(?:instrucciones?|reglas?|prompt|restricciones?)\b"),
    re.compile(r"(?i)\b(?:act as|pretend to be|you are now|ahora eres|act[uú]a como|finge que eres)\b.{0,100}\b(?:no rules?|unrestricted|sin reglas|sin restricciones|assistant|asistente)\b"),
    re.compile(r"(?i)\b(?:olvida que trabajas para|forget you work for|developer mode|modo desarrollador|reveal the system prompt|muestra el prompt)\b"),
)
_PERSONAL_PATTERNS = (
    re.compile(r"(?i)\b(?:write|escribe|redacta|hazme|create|crea)\b.{0,100}\b(?:essay|ensayo|poem|poema|love letter|carta de amor|homework|tarea|code|c[oó]digo)\b"),
    re.compile(r"(?i)\b(?:help me with|ay[uú]dame con|advise me|aconsejame|haz de|act[uú]a como)\b.{0,100}\b(?:homework|universidad|terapeuta|therapy|terapia|relationship|relaci[oó]n|personal project|proyecto personal)\b"),
    re.compile(r"(?i)\b(?:essay|ensayo|poem|poema|homework|tarea universitaria|terapeuta|therapy|terapia|personal assistant|asistente personal)\b"),
)
_CASUAL_PATTERNS = (
    re.compile(r"(?i)^\s*(?:hi|hello|hey|hola|buenos d[ií]as|buenas tardes|buenas noches|gracias|thanks|how are you|¿?c[oó]mo est[aá]s\??)\s*[!.?]*\s*$"),
)
_LOGISTICS_GENERAL = re.compile(r"(?i)\b(?:qu[eé] es la log[ií]stica inversa|what is reverse logistics|log[ií]stica inversa)\b")
_TOKYO_TIME = re.compile(r"(?i)\b(?:qu[eé] hora es en tokio|hora en tokio|time in tokyo)\b")
_GENERAL_TRIVIA = re.compile(r"(?i)^\s*[¿¡]?(?:qu[ií][eé]n fue|qu[ií][eé]n es|qu[eé] es|cu[aá]l es la capital|what is|who was|who is|what time)\b")
_TRACKING_LOOKUP = re.compile(
    r"(?i)\b(?:estado|situaci[oó]n|d[oó]nde est[aá]|track(?:ing)?)\b.{0,60}\b(?:pedido|env[ií]o|paquete|shipment|order|tracking)\b"
    r"|\b(?:pedido|env[ií]o|paquete|shipment|order|tracking)\b.{0,60}\b(?:estado|situaci[oó]n|d[oó]nde est[aá]|track(?:ing)?)\b"
)
_COUNTRY_MISMATCH = re.compile(
    r"(?i)\b(?:pol[ií]tica|devoluci[oó]n|return)\b.{0,100}\b(?:espa[nñ]a|spain)\b.{0,100}\b(?:los [aá]ngeles|california|united states|estados unidos|ee\.?\s*uu\.?)\b"
    r"|\b(?:los [aá]ngeles|california|united states|estados unidos|ee\.?\s*uu\.?)\b.{0,100}\b(?:pol[ií]tica|devoluci[oó]n|return)\b.{0,100}\b(?:espa[nñ]a|spain)\b"
)

_INTERNAL_LEAK = re.compile(
    r"(?i)(?:system prompt|prompt del sistema|instrucciones internas|chain of thought|"
    r"razonamiento interno|developer message|token de acceso|bearer [a-z0-9._-]{12,})"
)
_SENSITIVE_OUTPUT = re.compile(
    r"(?i)(?:\b(?:tarifa|precio|rate|fee)\b.{0,50}\b(?:negociad[ao]s?|contractual|carrier|transportista|UPS|FedEx|DHL|MRW|SEUR)\b|"
    r"\b(?:ruta interna|pasillo|muelle|acceso interno|internal route|warehouse aisle|warehouse dock)\b|"
    r"\b\d{1,6}\s+[\w.'-]+\s+(?:street|st|avenue|ave|road|rd|calle|carrer|avenida)\b)"
)

REDIRECT = "Puedo ayudarte con consultas de TrackFlow sobre tracking, devoluciones, SLAs e incidencias. ¿Qué necesitas consultar?"
PERSONAL_REFUSAL = "No puedo realizar tareas personales ajenas al soporte de TrackFlow. Puedo ayudarte con tracking, devoluciones, SLAs o incidencias."
JAILBREAK_REFUSAL = "No puedo cambiar ni ignorar mis instrucciones. Soy el agente de soporte de TrackFlow y solo puedo ayudar dentro de ese propósito."


@dataclass(frozen=True)
class InputDecision:
    action: str  # allow, redirect, reject
    failure_type: str | None = None
    answer: str | None = None
    guardrail: str | None = None


def inspect_input(text: str) -> InputDecision:
    """Apply deterministic priority: jailbreak, personal-use, allowed small talk, then business flow."""
    if any(pattern.search(text) for pattern in _JAILBREAK_PATTERNS):
        return InputDecision("reject", "security", JAILBREAK_REFUSAL, "instruction_change")
    if any(pattern.search(text) for pattern in _PERSONAL_PATTERNS):
        return InputDecision("reject", "content", PERSONAL_REFUSAL, "personal_use")
    if _TRACKING_LOOKUP.search(text):
        return InputDecision(
            "reject", "security",
            "No puedo consultar ni revelar el estado de un pedido sin verificar que pertenece a la sesión autenticada. No dispongo de una herramienta de tracking con esa verificación; contacta con soporte autenticado.",
            "tracking_authorization",
        )
    if _COUNTRY_MISMATCH.search(text):
        return InputDecision(
            "reject", "content",
            "No puedo aplicar la política de España a un pedido de Los Ángeles. La política debe corresponder al país real del pedido; puedo orientarte con la política aplicable de Estados Unidos.",
            "country_policy_mismatch",
        )
    if any(pattern.search(text) for pattern in _CASUAL_PATTERNS):
        return InputDecision(
            "redirect", "content",
            "¡Hola! Estoy aquí para ayudarte con el soporte logístico de TrackFlow: tracking, devoluciones, SLAs e incidencias. ¿Qué consulta tienes?",
            "small_talk",
        )
    if _LOGISTICS_GENERAL.search(text):
        return InputDecision(
            "redirect", "content",
            "La logística inversa es el proceso de gestionar productos que regresan desde el destinatario. En TrackFlow, puedo orientarte sobre nuestras políticas y procedimientos de devolución según el país.",
            "general_logistics",
        )
    if _TOKYO_TIME.search(text):
        local_time = datetime.now(ZoneInfo("Asia/Tokyo")).strftime("%H:%M")
        return InputDecision(
            "redirect", "content",
            f"En Tokio son aproximadamente las {local_time} (hora local). ¿Puedo ayudarte con tracking, devoluciones, SLAs o incidencias de TrackFlow?",
            "general_trivia",
        )
    if _GENERAL_TRIVIA.search(text) and not BUSINESS_TERMS.search(text):
        return InputDecision(
            "redirect", "content",
            "Puedo atender una pregunta general de forma breve, pero no tengo contexto suficiente para responder esta con fiabilidad. Puedo ayudarte con tracking, devoluciones, SLAs o incidencias de TrackFlow.",
            "general_trivia",
        )
    return InputDecision("allow")


def validate_output(answer: object) -> tuple[str, str | None, str | None]:
    """Validate shape and prevent known internal/sensitive briefing data from leaking."""
    if not isinstance(answer, str) or not answer.strip():
        return "No pude generar una respuesta válida. Puedo ayudarte con tracking, devoluciones, SLAs o incidencias de TrackFlow.", "structural", "output_schema"
    text = answer.strip()
    if _INTERNAL_LEAK.search(text):
        return JAILBREAK_REFUSAL, "security", "internal_instruction_leak"
    if _SENSITIVE_OUTPUT.search(text):
        return "No puedo compartir tarifas comerciales, datos sensibles ni ubicaciones internas. Puedo ayudarte con tracking, devoluciones, SLAs o incidencias.", "content", "sensitive_data"
    return text, None, None
