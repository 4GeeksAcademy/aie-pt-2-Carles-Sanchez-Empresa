"""Deterministic security checks for untrusted RFP documents and model output."""

from __future__ import annotations

import re

# These checks are signals for human review, not a claim that all prompt injection
# can be detected. Document text remains untrusted data regardless of the result.
DOCUMENT_INJECTION_PATTERNS = (
    re.compile(r"(?i)\b(?:ignora|olvida|omite)\b.{0,80}\b(?:instrucciones?|reglas?|prompt)\b"),
    re.compile(r"(?i)\b(?:ignore|forget|disregard)\b.{0,80}\b(?:previous|system|instructions?|rules?)\b"),
    re.compile(r"(?i)\b(?:ahora eres|you are now|act as|act[uú]a como)\b.{0,80}\b(?:sin reglas|unrestricted|system|assistant|asistente)\b"),
    re.compile(r"(?i)\b(?:revela|muestra|reveal|print)\b.{0,80}\b(?:prompt|secretos?|secrets?|instrucciones internas)\b"),
    re.compile(r"(?i)\bolvida\s+que\s+trabajas\s+para\b"),
)

UNSAFE_OUTPUT_PATTERNS = (
    re.compile(r"(?i)\b(?:system prompt|prompt del sistema|instrucciones internas|developer message|chain of thought|razonamiento interno)\b"),
    re.compile(r"(?i)\b(?:api[_ -]?key|access[_ -]?token|bearer)\s*[:=]?\s*[a-z0-9._-]{12,}\b"),
)


def document_injection_detected(text: str) -> bool:
    """Detect known instruction-changing phrases; never treat this as exhaustive."""
    return any(pattern.search(text) for pattern in DOCUMENT_INJECTION_PATTERNS)


def validate_generated_text(values: list[str]) -> None:
    """Reject model-generated strings that expose internal instructions or credentials."""
    if any(pattern.search(value) for value in values for pattern in UNSAFE_OUTPUT_PATTERNS):
        raise ValueError("La salida del modelo contiene contenido interno o sensible no permitido.")
