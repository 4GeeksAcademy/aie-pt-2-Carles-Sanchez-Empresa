//Scoring de Transportista y Cálculo de Costos

import { Product, Shipment, Carrier, ProductCategory, ShipmentStatus } from '../types/models';

//Funciones:

/*
Calcula el costo total de envío basado en varias condiciones
*/
export function calculateShippingCost(shipment: Shipment, product: Product, carrier: Carrier): number{
    let cost = carrier.baseRateUSD;
    cost += product.weightKg * carrier.ratePerKgUSD * shipment.quantity;
    cost += shipment.destination.distanceKm * carrier.ratePerKmUSD;
    if (shipment.priority === "Express") cost *= 1.3;
    else if (shipment.priority === "Same-day") cost *= 1.6;
    return Number(cost.toFixed(2));
}

/*
Calcula un puntaje de idoneidad (0-100) para un transportista basado en distintas condiciones
*/
export function scoreCarrierForShipment(carrier: Carrier, shipment: Shipment, product: Product): number{
    let score = 0;

    const totalWeight = product.weightKg * shipment.quantity;

    // Opera en el pais de destino
    if (carrier.operatesIn.includes(shipment.destination.country)) {
        score += 20;
    }

    // Puede manejar el peso del envio
    if (totalWeight <= carrier.maxWeightKg) {
        score += 20;
    }

    // Soporta el nivel de prioridad del envio
    if (carrier.acceptsPriority.includes(shipment.priority)) {
        score += 15;
    }

    // Manejo de productos fragiles
    if (!product.isFragile || carrier.handlesFragile) {
        score += 15;
    }

    // Confiabilidad: onTimeRate * 0.3
    score += carrier.onTimeRate * 0.3;

    return Number(score.toFixed(2));
}

/*
    - Puntúa todos los transportistas para el envío
    - Filtra transportistas con puntaje < 50 (no adecuados)
    - Entre los transportistas adecuados, selecciona el de menor costo
    - Retorna el mejor transportista con su puntaje y costo, o null si no se encuentra ninguno adecuado
*/
export function selectBestCarrier(carriers: Carrier[], shipment: Shipment, product: Product): {carrier: Carrier, score: number, cost: number} | null{
    let bestCarrier: {carrier: Carrier, score: number, cost: number} | null = null;

    for (const carrier of carriers) {
        const score = scoreCarrierForShipment(carrier, shipment, product);
        if (score < 50) continue;
        const cost = calculateShippingCost(shipment, product, carrier);
        if (!bestCarrier || cost < bestCarrier.cost) {
            bestCarrier = {carrier, score, cost};
        }
    }

    return bestCarrier;
}



//Agregaciones y Reportes

//Retorna un conteo de productos para cada categoría
export function countProductsByCategory(products: Product[]): Record<ProductCategory, number>{

    const counts: Record<ProductCategory, number> = {
        "Fashion": 0,
        "Electronics": 0,
        "Cosmetics": 0,
        "Home": 0,
        "Other": 0,
    };
    for (const product of products) {
        counts[product.category]++;
    }
    return counts;
}

/*
    - Retorna el valor total de todo el inventario
    - Fórmula: suma de (stockQuantity * unitCostUSD) para todos los productos
    - Redondear a 2 decimales
*/
export function calculateTotalInventoryValue(products: Product[]): number{
    let totalValue = 0;
    for (const product of products) {
        totalValue += product.stockQuantity * product.unitCostUSD;
    }
    return Number(totalValue.toFixed(2));
}

/*
    - Retorna la distancia promedio de todos los envíos
    - Redondear a 2 decimales
*/
export function calculateAverageShipmentDistance(shipments: Shipment[]): number{
    if (shipments.length === 0) return 0;

    let totalDistance = 0;
    for (const shipment of shipments) {
        totalDistance += shipment.destination.distanceKm;
    }

    const average = totalDistance / shipments.length;
    return Number(average.toFixed(2));
}

/*
    - Agrupa envíos por estado
    - Retorna un objeto donde las claves son estados y los valores son arrays de envíos
*/
export function groupShipmentsByStatus(shipments: Shipment[]): Record<ShipmentStatus, Shipment[]>{
    const groups: Record<ShipmentStatus, Shipment[]> = {
        "Pending": [],
        "Assigned": [],
        "In transit": [],
        "Delivered": [],
        "Failed": [],
    };

    for (const shipment of shipments) {
        groups[shipment.status].push(shipment);
    }

    return groups;
}

/*
    - Encuentra los N transportistas más usados basado en envíos asignados
    - Ignora envíos con transportista null
    - Los retorna ordenados por conteo de uso (más alto primero)
    - Cada elemento contiene nombre de transportista y conteo de envíos
*/
export function findTopCarriers(shipments: Shipment[], topN: number): Array<{carrier: string, count: number}>{
    const carrierCounts: Record<string, number> = {};

    for (const shipment of shipments) {
        if (shipment.carrier === null) continue;
        if (carrierCounts[shipment.carrier]) {
            carrierCounts[shipment.carrier]++;
        } else {
            carrierCounts[shipment.carrier] = 1;
        }
    }

    const sorted: Array<{carrier: string, count: number}> = [];
    for (const name in carrierCounts) {
        sorted.push({carrier: name, count: carrierCounts[name]});
    }
    sorted.sort((a, b) => b.count - a.count);

    return sorted.slice(0, topN);
}