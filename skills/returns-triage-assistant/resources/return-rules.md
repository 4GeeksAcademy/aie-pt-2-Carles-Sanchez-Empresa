# Árbol de Decisiones — Devoluciones TrackFlow

## Reglas de negocio detalladas con excepciones por categoría

---

### R1 — Aprobación automática por defecto / error de envío

| Condición | Acción |
|---|---|
| `returnReason ∈ {defective, wrong_item}` AND `daysSincePurchase ≤ 60` | ✅ Aprobar, reembolso 100% |
| **Excepción**: si `productCategory = "Cosmetics"` y el producto está `damaged`, requiere inspección manual | Revisión humana |
| **Excepción**: si `productCategory = "Electronics"` y pasaron > 30 días, se reembolsa 50% en lugar de 100% | Reembolso parcial |

### R2 — Rechazo por antigüedad

| Condición | Acción |
|---|---|
| `daysSincePurchase > 90` AND `returnReason ≠ "defective"` | ❌ Rechazar |
| Si `daysSincePurchase > 90` pero `returnReason = "defective"` | Evaluar caso; posible aprobación con reembolso parcial (máx. 70%) |

### R3 — Rechazo por historial de devoluciones

| Condición | Acción |
|---|---|
| `customerType = "consumer"` AND `customerReturnCount > 3` en últimos 6 meses | ❌ Rechazar |
| `customerType = "business"` AND `customerReturnRate > 15%` en últimos 3 meses | Notificar a account manager; no rechazar automáticamente |

### R4 — Daño no cubierto

| Condición | Acción |
|---|---|
| `itemCondition = "damaged"` AND `returnReason ≠ "defective"` | ❌ Rechazar |
| Si `returnReason = "delivery_failed"` AND `itemCondition = "damaged"` | Reclamar al transportista antes de decidir |

### R5 — Recogida por peso

| Condición | Acción |
|---|---|
| `weightKg > 1` AND `approved = true` | 📦 Recoger en domicilio |
| `weightKg ≤ 1` AND `approved = true` | 🏪 El cliente debe enviar por correo |
| **Excepción B2B**: si `customerType = "business"`, siempre se recoge independientemente del peso |

### R6 — Sin recogida (producto sin usar)

| Condición | Acción |
|---|---|
| `itemCondition ∈ {new, like_new}` AND `weightKg ≤ 1` | No recoger, reembolso sin devolución física (solo si `customerType = "consumer"`) |

### R7 — Reacondicionamiento viable

| Condición | Acción |
|---|---|
| `itemCondition = "used"` AND `unitCost × 0.3 ≥ returnCostRefurbish` | 🔧 Reacondicionar |
| Coste de reacondicionamiento por categoría: | Fashion: 3.00 USD / Electronics: 8.00 USD / Cosmetics: 2.00 USD / Home: 5.00 USD / Other: 4.00 USD |

### R8 — Desecho por daño severo

| Condición | Acción |
|---|---|
| `itemCondition = "damaged"` AND `repairCost ≥ unitCost × 0.3` | 🗑️ Desechar |
| **Excepción**: si `productCategory = "Electronics"` y contiene datos personales, requiere borrado seguro antes de desechar |

### R9 — Restock directo

| Condición | Acción |
|---|---|
| `itemCondition ∈ {new, like_new}` AND `category ≠ "Electronics"` | 📦 Restock directo |
| `itemCondition ∈ {new, like_new}` AND `category = "Electronics"` | Requiere verificación de funcionamiento antes de restock |

---

## Cálculo de costes

| Concepto | Fórmula |
|---|---|
| Coste logístico inversa | `baseReturnCost = 5.00 USD` + (si recogida: `weightKg × 1.50 USD`) |
| Coste de reacondicionamiento | Según categoría (ver R7) |
| Coste de desecho | `2.00 USD` fijo (o `5.00 USD` si Electronics con borrado) |
| Sin acción (restock) | `0.00 USD` |
| **Coste total** | `baseReturnCost + refurbishCost + disposalCost` |

## Reembolso

| Condición | % Reembolso |
|---|---|
| Aprobación estándar (R1) | 100% |
| Aprobación con producto usado | 80% |
| Aprobación tardía (>60 días, Electronics) | 50% |
| Producto dañado por nuestra culpa (defective) | 100% |
| Producto dañado por el cliente | 0% (rechazar) |