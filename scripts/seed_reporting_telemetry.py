"""Seed idempotente de eventos de negocio para validar el reporte semanal.

Inserta únicamente los cuatro eventos que alimentan el pipeline. No forma parte
 del pipeline: es una utilidad de desarrollo para disponer de un dataset mínimo
 reproducible en local/Docker.

Uso:
    python scripts/seed_reporting_telemetry.py
"""

from __future__ import annotations

import sys
import argparse
from pathlib import Path

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "services" / "api"
if not API_DIR.exists():
    API_DIR = ROOT / "api"
sys.path.insert(0, str(API_DIR))

from database import engine  # noqa: E402


EVENTS = [
    {
        "event_id": "reporting-demo-inbound-20260908-001",
        "timestamp": "2026-09-08T10:05:00Z",
        "event_type": "inbound_order_created",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co","product_id":"PRD-DEMO","product_category":"fashion","quantity":4200}',
    },
    {
        "event_id": "reporting-demo-outbound-20260908-001",
        "timestamp": "2026-09-08T09:00:00Z",
        "event_type": "outbound_order_created",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co","product_id":"PRD-DEMO","product_category":"fashion","quantity":1,"exit_type":"dispatch"}',
    },
    {
        "event_id": "reporting-demo-outbound-20260910-001",
        "timestamp": "2026-09-10T09:00:00Z",
        "event_type": "outbound_order_created",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co","product_id":"PRD-DEMO","product_category":"fashion","quantity":1,"exit_type":"dispatch"}',
    },
    {
        "event_id": "reporting-demo-outbound-20260912-001",
        "timestamp": "2026-09-12T09:00:00Z",
        "event_type": "outbound_order_created",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co","product_id":"PRD-DEMO","product_category":"fashion","quantity":1,"exit_type":"dispatch"}',
    },
    {
        "event_id": "reporting-demo-stock-threshold-20260909-001",
        "timestamp": "2026-09-09T11:00:00Z",
        "event_type": "stock_threshold_triggered",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co","product_id":"PRD-DEMO","product_category":"fashion","current_stock":4,"threshold_min":10,"quantity_sold":1}',
    },
    {
        "event_id": "reporting-demo-stock-threshold-20260911-001",
        "timestamp": "2026-09-11T11:00:00Z",
        "event_type": "stock_threshold_triggered",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co","product_id":"PRD-DEMO","product_category":"fashion","current_stock":3,"threshold_min":10,"quantity_sold":1}',
    },
    {
        "event_id": "reporting-demo-discrepancy-20260912-001",
        "timestamp": "2026-09-12T12:00:00Z",
        "event_type": "inventory_discrepancy_detected",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co","product_id":"PRD-DEMO","product_category":"fashion","system_stock":10,"physical_stock":9,"difference":-1}',
    },
]

# The demo dataset is intentionally large enough to make the dashboard useful
# at a glance.  Keep the three explicit outbound events above (they document
# the shape of the payload) and add the remaining events required by the
# business example: 980 outbound orders, 3 stock alerts and 2 discrepancies.
EVENTS.extend(
    {
        "event_id": f"reporting-demo-outbound-20260907-{index:04d}",
        "timestamp": f"2026-09-{7 + (index % 7):02d}T09:00:00Z",
        "event_type": "outbound_order_created",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co",'
        '"product_id":"PRD-DEMO","product_category":"fashion",'
        '"quantity":1,"exit_type":"dispatch"}',
    }
    for index in range(1, 978)
)
EVENTS.extend(
    {
        "event_id": f"reporting-demo-stock-threshold-20260913-{index:03d}",
        "timestamp": f"2026-09-{12 + index:02d}T11:00:00Z",
        "event_type": "stock_threshold_triggered",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co",'
        '"product_id":"PRD-DEMO","product_category":"fashion",'
        f'"current_stock":{2 + index},"threshold_min":10,"quantity_sold":1}}',
    }
    for index in range(1, 2)
)
EVENTS.extend(
    {
        "event_id": f"reporting-demo-discrepancy-20260913-{index:03d}",
        "timestamp": f"2026-09-{12 + index:02d}T12:00:00Z",
        "event_type": "inventory_discrepancy_detected",
        "tags": '{"warehouse":"los_angeles","client_id":"fashion-co",'
        '"product_id":"PRD-DEMO","product_category":"fashion",'
        f'"system_stock":10,"physical_stock":{9 - index},"difference":-{1 + index}}}',
    }
    for index in range(1, 2)
)


def reset_reporting_data(connection) -> None:
    """Remove only the source/reporting rows owned by this demo dataset."""
    connection.execute(
        text(
            """
            DELETE FROM telemetry_events
            WHERE event_type IN (
                'inbound_order_created',
                'outbound_order_created',
                'stock_threshold_triggered',
                'inventory_discrepancy_detected'
            )
            """
        )
    )
    connection.execute(text("DELETE FROM reporting.weekly_warehouse_client_performance"))


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument(
    "--no-reset",
    action="store_true",
    help="keep existing reporting events and rows; insert only missing demo events",
)
args = parser.parse_args()

with engine.begin() as connection:
    if not args.no_reset:
        reset_reporting_data(connection)
    connection.execute(
        text(
            """
            INSERT INTO telemetry_events
                (event_id, timestamp, event_type, session_id, user_id, service, tags)
            VALUES
                (:event_id, :timestamp, :event_type, :session_id, :user_id,
                 'inventory', CAST(:tags AS jsonb))
            ON CONFLICT (event_id) DO NOTHING
            """
        ),
        [
            {
                **event,
                "session_id": "reporting-demo-session",
                "user_id": "reporting-demo",
            }
            for event in EVENTS
        ],
    )

action = "seeded after reset" if not args.no_reset else "processed without reset"
print(f"Processed {len(EVENTS)} reporting demo events ({action}, idempotent).")
