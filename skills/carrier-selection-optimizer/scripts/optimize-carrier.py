"""
carrier_optimizer_simulation.py
Simula la selección del mejor transportista TrackFlow para múltiples envíos.

Uso:
    python carrier_optimizer_simulation.py

Requisitos:
    - Python 3.8+
    - No requiere librerías externas
"""

from dataclasses import dataclass
from typing import Optional

# ─── Modelos ───────────────────────────────────────────────────

@dataclass
class Carrier:
    id_: str
    name: str
    operates_in: list[str]
    base_rate: float
    rate_per_kg: float
    rate_per_km: float
    avg_delivery_days: int
    on_time_rate: float
    max_weight_kg: float
    handles_fragile: bool
    accepts_priority: list[str]


CARRIERS = [
    Carrier("CAR-UPS", "UPS", ["United States", "Spain"], 5.00, 1.20, 0.05, 3, 95, 70, True, ["Standard", "Express"]),
    Carrier("CAR-FDX", "FedEx", ["United States"], 4.50, 1.35, 0.06, 2, 94, 68, True, ["Standard", "Express", "Same-day"]),
    Carrier("CAR-MRW", "MRW", ["Spain"], 3.50, 0.90, 0.04, 2, 91, 50, False, ["Standard", "Express"]),
    Carrier("CAR-SEUR", "SEUR", ["Spain"], 3.00, 0.85, 0.03, 3, 88, 45, False, ["Standard"]),
    Carrier("CAR-DHL", "DHL", ["United States", "Spain"], 6.00, 1.50, 0.07, 2, 97, 75, True, ["Standard", "Express", "Same-day"]),
    Carrier("CAR-GLS", "GLS", ["United States"], 4.00, 1.10, 0.04, 4, 85, 60, False, ["Standard"]),
    Carrier("CAR-COR", "Correos", ["Spain"], 2.50, 0.70, 0.02, 5, 80, 35, False, ["Standard"]),
    Carrier("CAR-AMZ", "Amazon Shipping", ["United States"], 5.50, 1.40, 0.05, 1, 96, 50, True, ["Express", "Same-day"]),
]


@dataclass
class Shipment:
    origin: str
    destination_country: str
    distance_km: float
    weight_kg: float
    is_fragile: bool
    priority: str
    max_budget: float
    required_delivery_days: int


# ─── Lógica de negocio ─────────────────────────────────────────

def score_carrier(carrier: Carrier, shipment: Shipment) -> float:
    score = 0.0

    if carrier.operates_in and shipment.destination_country in carrier.operates_in:
        score += 20

    if shipment.weight_kg <= carrier.max_weight_kg:
        score += 20

    if carrier.accepts_priority and shipment.priority in carrier.accepts_priority:
        score += 15

    if not shipment.is_fragile or carrier.handles_fragile:
        score += 15

    score += carrier.on_time_rate * 0.3

    return round(score, 2)


def calculate_cost(carrier: Carrier, shipment: Shipment) -> float:
    cost = carrier.base_rate
    cost += shipment.weight_kg * carrier.rate_per_kg
    cost += shipment.distance_km * carrier.rate_per_km
    if shipment.priority == "Express":
        cost *= 1.3
    elif shipment.priority == "Same-day":
        cost *= 1.6
    return round(cost, 2)


def select_best_carrier(carriers: list[Carrier], shipment: Shipment) -> Optional[dict]:
    candidates = []

    for carrier in carriers:
        score = score_carrier(carrier, shipment)
        if score < 50:
            continue
        cost = calculate_cost(carrier, shipment)
        candidates.append({
            "carrier": carrier,
            "score": score,
            "cost": cost,
        })

    if not candidates:
        return None

    candidates.sort(key=lambda c: c["cost"])
    best = candidates[0]
    return {
        "recommended": best,
        "alternatives": candidates[1:],
    }


# ─── Simulación ────────────────────────────────────────────────

def main():
    scenarios = [
        Shipment("Los Angeles", "United States", 3920, 4.5, True, "Express", 45.00, 3),
        Shipment("Zaragoza", "Spain", 600, 2.0, False, "Standard", 15.00, 5),
        Shipment("Los Angeles", "Spain", 9300, 12.0, True, "Express", 100.00, 4),
        Shipment("Zaragoza", "United States", 9200, 30.0, False, "Standard", 200.00, 10),
    ]

    for i, shipment in enumerate(scenarios, start=1):
        print(f"\n{'='*60}")
        print(f"📦 Envío #{i}")
        print(f"{'='*60}")
        print(f"  Origen: {shipment.origin}")
        print(f"  Destino: {shipment.destination_country}")
        print(f"  Peso: {shipment.weight_kg} kg | Frágil: {shipment.is_fragile}")
        print(f"  Prioridad: {shipment.priority} | Presupuesto: ${shipment.max_budget}")

        result = select_best_carrier(CARRIERS, shipment)

        if result is None:
            print("  ❌ No se encontró transportista adecuado.")
            continue

        best = result["recommended"]
        print(f"  ✅ Recomendado: {best['carrier'].name}")
        print(f"     Score: {best['score']}/100 | Coste: ${best['cost']}")
        print(f"     Días estimados: {best['carrier'].avg_delivery_days}")
        print(f"     Fiabilidad: {best['carrier'].on_time_rate}% on-time")

        if result["alternatives"]:
            print(f"  Alternativas ({len(result['alternatives'])}):")
            for alt in result["alternatives"]:
                print(f"     - {alt['carrier'].name}: ${alt['cost']} (score: {alt['score']})")


if __name__ == "__main__":
    main()