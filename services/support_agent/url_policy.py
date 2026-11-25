"""Validation for operator-configured support-agent HTTP destinations.

This is a configuration guard, not a substitute for network egress controls. The
allowed host set is intentionally exact to prevent user-controlled destinations.
"""

import ipaddress
import os
from urllib.parse import urlsplit


_DEFAULT_ALLOWED_HOSTS = {"127.0.0.1", "::1", "localhost", "api"}


def _allowed_hosts() -> set[str]:
    configured = os.getenv("SUPPORT_TOOL_ALLOWED_HOSTS", "")
    return _DEFAULT_ALLOWED_HOSTS | {
        item.strip().rstrip(".").lower()
        for item in configured.split(",")
        if item.strip()
    }


def validate_support_base_url(value: str) -> str:
    """Require a bare HTTP(S) origin with a host explicitly allowed by config."""
    try:
        parsed = urlsplit(value)
        host = (parsed.hostname or "").rstrip(".").lower()
        port = parsed.port
    except ValueError as exc:
        raise ValueError("Invalid support tool base URL.") from exc

    if (
        parsed.scheme not in {"http", "https"}
        or not host
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("Support tool base URL must be an absolute HTTP(S) origin without credentials or path.")

    allowed = _allowed_hosts()
    is_ip = False
    try:
        address = ipaddress.ip_address(host)
        is_ip = True
        if not address.is_loopback:
            raise ValueError("Support tool IP destinations must be loopback addresses.")
    except ValueError as exc:
        if is_ip:
            raise
        # Hostnames are only allowed when explicitly listed; no DNS lookup is
        # performed here because it would not prevent rebinding at connect time.

    if host not in allowed:
        raise ValueError("Support tool destination host is not in SUPPORT_TOOL_ALLOWED_HOSTS.")
    if parsed.scheme == "http" and host not in {"127.0.0.1", "::1", "localhost", "api"}:
        raise ValueError("HTTP is allowed only for loopback or the internal API service.")
    if port is not None and not 1 <= port <= 65535:
        raise ValueError("Invalid support tool destination port.")
    return value.rstrip("/")
