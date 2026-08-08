//Operaciones de Búsqueda

import { Product, Shipment } from '../types/models.js';

//Funciones:

//realiza busqueda lineal para encontrar un producto por su SKU // la comparacion del SKU debe ser case-sensitive
//retorna el producto si lo encuentra, sino devuelve nulo
export function findProductBySKU(products: Product[], sku: string): Product | null{    
    for (const product of products) {
        if (product.sku === sku) {
            return product;
        }
    }
    return null;
}

//realiza busqueda lineal para encontrar un envío por ID
//retorna el envío si se encuentra, sino devuelve nulo
export function findShipmentById(shipments: Shipment[], id: string): Shipment | null{
    for (const shipment of shipments) {
        if (shipment.id === id) {
            return shipment;
        }
    }
    return null;
}

//asume que el array esta ya ordenado por peso (ascendente) 
//realiza busqueda binaria para encontrar el indice de un producto con el peso objetivo
//retorna el indice si lo encuentra, -1 si no lo encuentra
export function binarySearchProductByWeight(sortedProducts: Product[], targetWeight: number): number{
    let left = 0;
    let right = sortedProducts.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (sortedProducts[mid].weightKg === targetWeight) {
            return mid;
        } else if (sortedProducts[mid].weightKg < targetWeight) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}