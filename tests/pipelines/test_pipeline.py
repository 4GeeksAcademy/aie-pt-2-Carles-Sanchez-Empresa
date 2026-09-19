from datetime import date
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd

from data.process.transform import calcular_kpis_por_almacen_cliente


WEEK = date(2026, 9, 14)


def test_calcular_kpis_agrupa_por_almacen_cliente_y_calcula_kpis():
    events = pd.DataFrame([
        {"event_type": "inbound_order_created", "tags": {"warehouse": "madrid", "client_id": "acme", "quantity": 10}},
        {"event_type": "inbound_order_created", "tags": {"warehouse": "madrid", "client_id": "acme", "quantity": 5}},
        {"event_type": "outbound_order_created", "tags": {"warehouse": "madrid", "client_id": "acme", "quantity": 1}},
        {"event_type": "outbound_order_created", "tags": {"warehouse": "madrid", "client_id": "acme", "quantity": 1}},
        {"event_type": "stock_threshold_triggered", "tags": {"warehouse": "madrid", "client_id": "acme"}},
        {"event_type": "inventory_discrepancy_detected", "tags": {"warehouse": "madrid", "client_id": "acme"}},
        {"event_type": "outbound_order_created", "tags": {"warehouse": "barcelona", "client_id": "beta", "quantity": 1}},
    ])

    result = calcular_kpis_por_almacen_cliente(events, WEEK).sort_values(["warehouse", "client_id"]).reset_index(drop=True)

    assert result.to_dict("records") == [
        {"warehouse": "barcelona", "client_id": "beta", "week_start": WEEK, "inbound_units_count": 0, "outbound_orders_count": 1, "stockout_events_count": 0, "discrepancy_events_count": 0, "discrepancy_rate": 0.0},
        {"warehouse": "madrid", "client_id": "acme", "week_start": WEEK, "inbound_units_count": 15, "outbound_orders_count": 2, "stockout_events_count": 1, "discrepancy_events_count": 1, "discrepancy_rate": 0.5},
    ]


def test_calcular_kpis_vacio_conserva_esquema():
    result = calcular_kpis_por_almacen_cliente(pd.DataFrame(), WEEK)

    assert result.empty
    assert list(result.columns) == [
        "warehouse", "client_id", "week_start", "inbound_units_count",
        "outbound_orders_count", "stockout_events_count",
        "discrepancy_events_count", "discrepancy_rate",
    ]


def test_calcular_kpis_ignora_tags_invalidos_y_filas_sin_identidad():
    events = pd.DataFrame([
        {"event_type": "outbound_order_created", "tags": None},
        {"event_type": "stock_threshold_triggered", "tags": "invalid"},
        {"event_type": "outbound_order_created", "tags": {"warehouse": "madrid"}},
        {"event_type": "outbound_order_created", "tags": {"client_id": "acme"}},
    ])

    result = calcular_kpis_por_almacen_cliente(events, WEEK)

    assert result.empty
    assert list(result.columns) == [
        "warehouse", "client_id", "week_start", "inbound_units_count",
        "outbound_orders_count", "stockout_events_count",
        "discrepancy_events_count", "discrepancy_rate",
    ]
