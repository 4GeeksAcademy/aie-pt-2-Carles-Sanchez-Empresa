"""
triage_return.py
Simula el triage de devoluciones de TrackFlow usando las reglas de negocio.

Uso:
    python triage_return.py

Requisitos:
    - Python 3.8+
    - No requiere librerías externas
"""

from dataclasses import dataclass
from typing import Optional

# ─── Modelos ───────────────────────────────────────────────────

RETURN_REASONS = {"wrong_item", "defective", "not_as_described", "changed_mind", "delivery_failed", "excessive_return", "other"}
ITEM_CONDITIONS = {"new", "like_new", "used", "damaged"}
CUSTOMER_TYPES = {"business", "consumer"}
PRODUCT_CATEGORIES = {"Fashion", "Electronics", "Cosmetics", "Home", "Other"}

REFURBISH_COST = {
    "Fashion": 3.00,
    "Electronics": 8.00,
    "Cosmetics": 2.00,
    "Home": 5.00,
    "Other": 4.00,
}

@dataclass
class ReturnInput:
    product_sku: str
    product_category: str
    product_unit_cost: float
    days_since_purchase: int
    return_reason: str
    item_condition: str
    customer_type: str
    weight_kg: float
    country: str
    warehouse: str
    customer_return_count: int = 0


@dataclass
class ReturnDecision:
    approved: bool
    pick_up_required: bool
    refurbish_action: str
    estimated_return_cost: float
    refund_percentage: int
    justification: str
    rules_applied: list[str]


# ─── Lógica de negocio ─────────────────────────────────────────

def triage_return(inp: ReturnInput) -> ReturnDecision:
    rules: list[str] = []
    approved = False
    pick_up = False
    action = "restock"
    refund = 0

    # --- R1: Aprobación automática por defecto / error ---
    if inp.return_reason in ("defective", "wrong_item") and inp.days_since_purchase <= 60:
        approved = True
        refund = 100
        rules.append("R1-auto-approve-defective")
        # Excepción Electronics > 30 días → 50%
        if inp.product_category == "Electronics" and inp.days_since_purchase > 30:
            refund = 50

    # --- R4: Daño no cubierto (se evalúa antes que otras reglas de rechazo) ---
    if inp.item_condition == "damaged" and inp.return_reason not in ("defective", "delivery_failed"):
        approved = False
        rules.append("R4-damage-not-covered")

    # --- R2: Rechazo por antigüedad ---
    if inp.days_since_purchase > 90 and inp.return_reason != "defective":
        approved = False
        rules.append("R2-age-rejection")

    # --- R3: Rechazo por abuso de devoluciones ---
    if inp.customer_type == "consumer" and inp.customer_return_count > 3:
        approved = False
        rules.append("R3-excessive-returns")

    # --- R5: Recogida por peso ---
    if approved:
        if inp.weight_kg > 1:
            pick_up = True
            rules.append("R5-pickup-weight-threshold")
        elif inp.customer_type == "business":
            pick_up = True
            rules.append("R5-pickup-business")
        else:
            pick_up = False

        # --- R7 / R8 / R9: Acción sobre el producto ---
        base_return_cost = 5.00 + (inp.weight_kg * 1.50 if pick_up else 0)
        refurb_cost = REFURBISH_COST.get(inp.product_category, 4.00)
        residual_value = inp.product_unit_cost * 0.3

        if inp.item_condition in ("new", "like_new"):
            if inp.product_category == "Electronics":
                action = "refurbish"  # requiere verificación
                rules.append("R9-restock-electronics-needs-check")
            else:
                action = "restock"
                rules.append("R9-restock-direct")
        elif inp.item_condition == "used":
            if residual_value >= refurb_cost:
                action = "refurbish"
                rules.append("R7-refurbish-if-viable")
            else:
                action = "discard"
                rules.append("R7-refurbish-not-viable")
        elif inp.item_condition == "damaged":
            if residual_value >= refurb_cost:
                action = "refurbish"
                rules.append("R8-damaged-but-repairable")
            else:
                action = "discard"
                rules.append("R8-damaged-discard")

        # Calcular coste total
        disposal_cost = 0
        if action == "discard":
            disposal_cost = 5.00 if inp.product_category == "Electronics" else 2.00
            rules.append("R8-disposal-cost")
            refund = 0

        total_cost = base_return_cost + (refurb_cost if action == "refurbish" else 0) + disposal_cost

        # Ajuste reembolso para producto usado
        if inp.item_condition == "used" and approved:
            refund = 80 if refund == 100 else refund

        return ReturnDecision(
            approved=approved,
            pick_up_required=pick_up,
            refurbish_action=action,
            estimated_return_cost=round(total_cost, 2),
            refund_percentage=refund,
            justification=_build_justification(inp, approved, pick_up, action, total_cost, refund, rules),
            rules_applied=rules,
        )

    return ReturnDecision(
        approved=False,
        pick_up_required=False,
        refurbish_action="discard",
        estimated_return_cost=0.00,
        refund_percentage=0,
        justification=_build_justification(inp, False, False, "discard", 0, 0, rules),
        rules_applied=rules,
    )


def _build_justification(inp: ReturnInput, approved: bool, pick_up: bool,
                          action: str, cost: float, refund: int,
                          rules: list[str]) -> str:
    parts = []
    if approved:
        parts.append(f"Devolución APROBADA. Motivo: {inp.return_reason}, días desde compra: {inp.days_since_purchase}.")
    else:
        parts.append(f"Devolución RECHAZADA. Motivo: {inp.return_reason}, estado: {inp.item_condition}, días: {inp.days_since_purchase}.")

    if pick_up:
        parts.append(f"Se requiere recogida en domicilio (peso: {inp.weight_kg} kg).")
    else:
        parts.append("No se requiere recogida en domicilio.")

    action_label = {"restock": "se reincorpora al inventario", "refurbish": "se reacondiciona",
                    "discard": "se desecha"}
    parts.append(f"El producto ({inp.product_category}) {action_label.get(action, action)}.")

    parts.append(f"Coste estimado: {cost:.2f} USD. Reembolso: {refund}%.")
    parts.append(f"Reglas aplicadas: {', '.join(rules)}.")
    return " ".join(parts)


# ─── Simulación ────────────────────────────────────────────────

def main():
    scenarios = [
        ReturnInput("SHOE-BLK-42", "Fashion", 35.00, 45, "defective", "used", "consumer", 2.5, "Spain", "Zaragoza", 1),
        ReturnInput("LAPTOP-001", "Electronics", 800.00, 95, "changed_mind", "like_new", "consumer", 3.2, "United States", "Los Angeles", 0),
        ReturnInput("SOFA-GRY-01", "Home", 250.00, 20, "delivery_failed", "damaged", "consumer", 25.0, "Spain", "Zaragoza", 4),
        ReturnInput("LIPSTICK-RED", "Cosmetics", 12.00, 15, "wrong_item", "new", "business", 0.3, "Spain", "Zaragoza", 0),
        ReturnInput("PHONE-CASE", "Other", 8.00, 120, "changed_mind", "used", "consumer", 0.2, "United States", "Los Angeles", 5),
    ]

    for i, inp in enumerate(scenarios, start=1):
        print(f"\n{'='*60}")
        print(f"📦 Devolución #{i}")
        print(f"{'='*60}")
        print(f"  SKU: {inp.product_sku} | Cat: {inp.product_category}")
        print(f"  Motivo: {inp.return_reason} | Estado: {inp.item_condition}")
        print(f"  Días: {inp.days_since_purchase} | Cliente: {inp.customer_type}")

        decision = triage_return(inp)

        status = "✅ APROBADA" if decision.approved else "❌ RECHAZADA"
        print(f"  Decisión: {status}")
        print(f"  Recoger: {'Sí' if decision.pick_up_required else 'No'}")
        print(f"  Acción: {decision.refurbish_action}")
        print(f"  Coste: ${decision.estimated_return_cost} | Reembolso: {decision.refund_percentage}%")
        print(f"  Justificación: {decision.justification}")


if __name__ == "__main__":
    main()