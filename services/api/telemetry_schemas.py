"""
telemetry_schemas.py — Allowlists de properties por event_type (TrackFlow).

Constante hardcodeada derivada de docs/telemetry/event-schemas.json.
Se usa en routes/telemetry.py para filtrar properties antes de persistir.

Cada entrada contiene:
  - category: dominio funcional (→ columna 'service' en la tabla)
  - required: claves obligatorias del allowlist
  - optional: claves opcionales del allowlist

Si un evento tiene claves extra, se descartan silenciosamente.
Si falta una clave required, el evento se rechaza.
"""

# ──────────────────────────── Allowlists por event_type ────────────────────────
# Extraído de docs/telemetry/event-schemas.json (27 eventos, 5 categorías)

EVENT_SCHEMAS: dict[str, dict] = {
    # ══════════════════════════ Inventario (obligatorios M1-M5) ══════════════════
    "inbound_order_created": {
        "category": "inventory",
        "required": {"warehouse", "client_id", "product_id", "product_category", "quantity"},
        "optional": {"reference"},
    },
    "outbound_order_created": {
        "category": "inventory",
        "required": {"warehouse", "client_id", "product_id", "product_category", "quantity", "exit_type"},
        "optional": {"tracking_number"},
    },
    "stock_threshold_triggered": {
        "category": "inventory",
        "required": {"warehouse", "client_id", "product_id", "product_category", "current_stock", "threshold_min", "quantity_sold"},
        "optional": set(),
    },
    "direct_stock_edit_rejected": {
        "category": "inventory",
        "required": {"warehouse", "attempted_new_stock", "current_stock", "method", "rejection_reason"},
        "optional": {"client_id", "product_id", "product_category"},
    },
    "inventory_discrepancy_detected": {
        "category": "inventory",
        "required": {"warehouse", "client_id", "product_id", "product_category", "system_stock", "physical_stock", "difference"},
        "optional": {"audit_reference"},
    },

    # ══════════════════════════ Inventario (oportunidades O1-O5) ══════════════════
    "inbound_order_cancelled": {
        "category": "inventory",
        "required": {"warehouse", "client_id", "product_id", "product_category", "quantity", "original_entry_id"},
        "optional": {"reason"},
    },
    "outbound_order_cancelled": {
        "category": "inventory",
        "required": {"warehouse", "client_id", "product_id", "product_category", "quantity", "exit_type", "original_exit_id"},
        "optional": {"reason"},
    },
    "stock_validation_failed": {
        "category": "inventory",
        "required": {"warehouse", "client_id", "product_id", "product_category", "requested_quantity", "available_stock"},
        "optional": set(),
    },
    "product_stock_queried": {
        "category": "inventory",
        "required": {"query_type"},
        "optional": {"warehouse", "client_id", "product_id", "product_category", "results_count"},
    },
    "picking_item_not_found": {
        "category": "inventory",
        "required": {"warehouse", "client_id", "product_id", "product_category", "outbound_order_id", "resolved"},
        "optional": {"expected_location"},
    },

    # ══════════════════════════ Autenticación (O6-O12) ══════════════════
    "login_attempted": {
        "category": "authentication",
        "required": {"login_method", "ip_hash"},
        "optional": {"user_agent"},
    },
    "login_succeeded": {
        "category": "authentication",
        "required": {"ip_hash"},
        "optional": {"previous_session_id"},
    },
    "login_failed": {
        "category": "authentication",
        "required": {"failure_reason", "ip_hash", "attempt_number"},
        "optional": {"user_agent"},
    },
    "session_expired": {
        "category": "authentication",
        "required": {"expired_at", "token_age_minutes"},
        "optional": {"operation_attempted"},
    },
    "password_reset_requested": {
        "category": "authentication",
        "required": {"ip_hash"},
        "optional": set(),
    },
    "password_changed": {
        "category": "authentication",
        "required": {"change_type"},
        "optional": set(),
    },
    "account_locked": {
        "category": "authentication",
        "required": {"failed_attempts", "lock_duration_minutes", "ip_hash"},
        "optional": set(),
    },

    # ══════════════════════════ Rendimiento (O13-O16, O23) ══════════════════
    "api_latency_recorded": {
        "category": "performance",
        "required": {"endpoint", "method", "status_code", "latency_ms"},
        "optional": {"db_queries_count"},
    },
    "page_load_timed": {
        "category": "performance",
        "required": {"page", "load_time_ms"},
        "optional": {"ttfb_ms", "api_calls_count"},
    },
    "slow_query_detected": {
        "category": "performance",
        "required": {"query_duration_ms", "table", "operation"},
        "optional": {"endpoint"},
    },
    "api_dependency_failed": {
        "category": "performance",
        "required": {"dependency", "error_type"},
        "optional": {"http_status", "endpoint"},
    },
    "web_vital_measured": {
        "category": "performance",
        "required": {"metric_name", "metric_value", "metric_delta", "metric_id"},
        "optional": {"page"},
    },

    # ══════════════════════════ Errores (O17-O20) ══════════════════
    "frontend_error_captured": {
        "category": "errors",
        "required": {"error_type", "error_message_safe", "page", "stack_trace"},
        "optional": {"component"},
    },
    "api_error_returned": {
        "category": "errors",
        "required": {"endpoint", "method", "status_code"},
        "optional": {"error_detail"},
    },
    "validation_error_occurred": {
        "category": "errors",
        "required": {"endpoint", "field", "validation_rule"},
        "optional": {"field_type"},
    },
    "unauthorized_access_attempted": {
        "category": "errors",
        "required": {"endpoint", "method", "required_role", "user_role"},
        "optional": set(),
    },

    # ══════════════════════════ Navegación (O21-O22) ══════════════════
    "page_viewed": {
        "category": "navigation",
        "required": {"page"},
        "optional": {"referrer", "duration_seconds"},
    },
    "flow_abandoned": {
        "category": "navigation",
        "required": {"flow_type", "current_step", "total_steps", "time_spent_seconds", "partial_data"},
        "optional": set(),
    },
}


def get_event_category(event_type: str) -> str | None:
    """
    Devuelve la categoría (service) de un event_type.
    Retorna None si el event_type no está en el catálogo.
    """
    schema = EVENT_SCHEMAS.get(event_type)
    return schema["category"] if schema else None


def filter_properties(event_type: str, raw_properties: dict) -> dict | None:
    """
    Filtra properties contra el allowlist del event_type.
    
    Retorna:
      - dict con solo las claves del allowlist si el evento es válido
      - None si falta alguna clave requerida o el event_type es desconocido
    
    Las claves extra del allowlist se descartan silenciosamente.
    """
    schema = EVENT_SCHEMAS.get(event_type)
    if schema is None:
        return None  # event_type desconocido → rechazar
    
    all_allowed = schema["required"] | schema["optional"]
    
    # Verificar que todas las required keys estén presentes
    if not schema["required"].issubset(raw_properties.keys()):
        return None
    
    # Filtrar: solo claves del allowlist
    return {k: v for k, v in raw_properties.items() if k in all_allowed}
