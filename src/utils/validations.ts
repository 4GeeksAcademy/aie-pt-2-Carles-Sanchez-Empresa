//Validaciones de negocio

import { Product, Shipment, Carrier } from '../types/models';

/*
    - Valida todas las reglas de negocio para un producto
    - Retorna un objeto con:
        - valid: true si todas las validaciones pasan, false en caso contrario
        - errors: array de mensajes de error (vacío si es válido)
*/
export function validateProduct(product: Product): { valid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!product.sku || product.sku.trim() === "") {
        errors.push("El SKU del producto no puede estar vacío");
    }

    if (product.weightKg <= 0 || product.weightKg > 100) {
        errors.push("El peso del producto debe ser mayor a 0 y menor o igual a 100 kg");
    }

    if (
        product.dimensions.lengthCm <= 0 || product.dimensions.lengthCm > 200 ||
        product.dimensions.widthCm <= 0 || product.dimensions.widthCm > 200 ||
        product.dimensions.heightCm <= 0 || product.dimensions.heightCm > 200
    ) {
        errors.push("Todas las dimensiones deben ser mayores a 0 y menores o iguales a 200 cm");
    }

    if (product.stockQuantity < 0) {
        errors.push("La cantidad en stock no puede ser negativa");
    }

    if (product.minStockThreshold < 0) {
        errors.push("El umbral mínimo de stock no puede ser negativo");
    }

    if (product.unitCostUSD <= 0) {
        errors.push("El costo unitario debe ser mayor a 0");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/*
    - Valida todas las reglas de negocio para un envío
    - Retorna un objeto con:
        - valid: true si todas las validaciones pasan, false en caso contrario
        - errors: array de mensajes de error (vacío si es válido)
*/
export function validateShipment(shipment: Shipment): { valid: boolean, errors: string[] }{
    const errors: string[] = [];

    if (shipment.quantity <= 0) {
        errors.push("La cantidad del envío debe ser mayor a 0");
    }

    if (shipment.declaredValueUSD <= 0) {
        errors.push("El valor declarado del envío debe ser mayor a 0");
    }

    if (shipment.destination.distanceKm < 0) {
        errors.push("La distancia del destino no puede ser negativa");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/*
    - Valida todas las reglas de negocio para un transportista
    - Retorna un objeto con:
        - valid: true si todas las validaciones pasan, false en caso contrario
        - errors: array de mensajes de error (vacío si es válido)
*/
export function validateCarrier(carrier: Carrier): { valid: boolean, errors: string[] }{
    const errors: string[] = [];

    if (carrier.baseRateUSD < 0) {
        errors.push("La tarifa base no puede ser negativa");
    }

    if (carrier.ratePerKgUSD < 0) {
        errors.push("La tarifa por kg no puede ser negativa");
    }

    if (carrier.ratePerKmUSD < 0) {
        errors.push("La tarifa por km no puede ser negativa");
    }

    if (carrier.avgDeliveryDays <= 0) {
        errors.push("Los días promedio de entrega deben ser mayores a 0");
    }

    if (carrier.onTimeRate < 0 || carrier.onTimeRate > 100) {
        errors.push("La tasa de entrega a tiempo debe estar entre 0 y 100");
    }

    if (carrier.maxWeightKg <= 0) {
        errors.push("El peso máximo debe ser mayor a 0");
    }

    if (!carrier.operatesIn || carrier.operatesIn.length < 1) {
        errors.push("El transportista debe operar en al menos 1 país");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

