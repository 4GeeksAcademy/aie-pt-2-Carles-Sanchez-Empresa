"""Transformación pura de eventos de telemetría a KPIs semanales."""

from __future__ import annotations

from datetime import date
import hashlib
from typing import Any

import pandas as pd


def _properties(row: Any) -> dict:
    value = row.get("tags", {}) if isinstance(row, dict) else getattr(row, "tags", {})
    return value if isinstance(value, dict) else {}


def calcular_kpis_por_almacen_cliente(
    events: pd.DataFrame, week_start: date
) -> pd.DataFrame:
    """Agrega los cuatro KPIs por almacén, cliente y semana ISO."""
    columns = [
        "warehouse", "client_id", "week_start", "inbound_units_count",
        "outbound_orders_count", "stockout_events_count",
        "discrepancy_events_count", "discrepancy_rate",
    ]
    if events.empty:
        return pd.DataFrame(columns=columns)

    rows: list[dict] = []
    for _, event in events.iterrows():
        props = _properties(event)
        rows.append({
            "warehouse": props.get("warehouse"),
            "client_id": props.get("client_id"),
            "week_start": week_start,
            "event_type": event["event_type"],
            "quantity": int(props.get("quantity", 0) or 0),
        })

    normalized = pd.DataFrame(rows).dropna(subset=["warehouse", "client_id"])
    if normalized.empty:
        return pd.DataFrame(columns=columns)

    grouped = normalized.groupby(["warehouse", "client_id"], as_index=False).agg(
        inbound_units_count=("quantity", lambda s: int(s[normalized.loc[s.index, "event_type"].eq("inbound_order_created")].sum())),
        outbound_orders_count=("event_type", lambda s: int(s.eq("outbound_order_created").sum())),
        stockout_events_count=("event_type", lambda s: int(s.eq("stock_threshold_triggered").sum())),
        discrepancy_events_count=("event_type", lambda s: int(s.eq("inventory_discrepancy_detected").sum())),
    )
    grouped["week_start"] = week_start
    grouped["discrepancy_rate"] = grouped.apply(
        lambda row: (row["discrepancy_events_count"] / row["outbound_orders_count"])
        if row["outbound_orders_count"] else 0,
        axis=1,
    )
    return grouped[columns]


def dataframe_cache_key(context, parameters: dict) -> str:
    """La caché identifica el contenido de eventos y la semana solicitada."""
    events = parameters.get("events")
    week_start = parameters.get("week_start")
    if not isinstance(events, pd.DataFrame):
        return f"transform:{week_start}:empty"
    payload = events.to_json(orient="split", date_format="iso")
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return f"transform:{week_start}:{digest}"
