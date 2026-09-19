# TrackFlow business context

TrackFlow operates last-mile delivery and warehouse services in Mexico and Spain. Business reporting must remain separate from operational telemetry.

## Weekly warehouse-client performance

The weekly reporting pipeline reads the append-only `telemetry_events` source and publishes business metrics to the dedicated `reporting.weekly_warehouse_client_performance` table. It may read telemetry but must not update or delete source events, and must not change the existing telemetry analysis endpoint (`GET /telemetry/report`).

Required source events:

- `inbound_order_created`
- `outbound_order_created`
- `stock_threshold_triggered`
- `inventory_discrepancy_detected`

The reporting grain is one row per warehouse, client, and ISO week beginning on Monday (`week_start`). Warehouse dimensions include `los_angeles` and `zaragoza`; client and product identifiers are carried in event properties.

Published KPIs:

- `inbound_units_count`: sum of inbound quantities;
- `outbound_orders_count`: count of outbound order events;
- `stockout_events_count`: count of threshold events;
- `discrepancy_events_count`: count of discrepancy events;
- `discrepancy_rate`: discrepancy events divided by outbound orders, or `0` when there are no outbound orders.

The transformation is pure Pandas logic. Publishing is an idempotent upsert keyed by `(warehouse, client_id, week_start)`. No currency, revenue, or financial KPI belongs in this report.

Reporting endpoints:

- `GET /reporting/weekly-warehouse-client-performance`
- `GET /reporting/weekly-warehouse-client-performance/summary`
- `GET /reporting/weekly-warehouse-client-performance/export`

The backoffice dashboard consumes these endpoints and displays five KPI cards, a trend visualization, and a warehouse/client detail table.
