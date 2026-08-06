# Catálogo de Transportistas TrackFlow

Red de 8 transportistas con los que TrackFlow trabaja en Estados Unidos y España.

| ID | Nombre | País | Tarifa base (USD) | $/kg | $/km | Días entrega | Tasa on-time (%) | Peso máx. (kg) | Frágiles | Prioridades |
|---|---|---|---|---|---|---|---|---|---|---|
| CAR-UPS | UPS | US, ES | 5.00 | 1.20 | 0.05 | 3 | 95 | 70 | Sí | Standard, Express |
| CAR-FDX | FedEx | US | 4.50 | 1.35 | 0.06 | 2 | 94 | 68 | Sí | Standard, Express, Same-day |
| CAR-MRW | MRW | ES | 3.50 | 0.90 | 0.04 | 2 | 91 | 50 | No | Standard, Express |
| CAR-SEUR | SEUR | ES | 3.00 | 0.85 | 0.03 | 3 | 88 | 45 | No | Standard |
| CAR-DHL | DHL | US, ES | 6.00 | 1.50 | 0.07 | 2 | 97 | 75 | Sí | Standard, Express, Same-day |
| CAR-GLS | GLS | US | 4.00 | 1.10 | 0.04 | 4 | 85 | 60 | No | Standard |
| CAR-COR | Correos | ES | 2.50 | 0.70 | 0.02 | 5 | 80 | 35 | No | Standard |
| CAR-AMZ | Amazon Shipping | US | 5.50 | 1.40 | 0.05 | 1 | 96 | 50 | Sí | Express, Same-day |

> **Nota:** `operatesIn`, `acceptsPriority`, `handlesFragile` y `maxWeightKg` se usan como filtros en `scoreCarrierForShipment()`.