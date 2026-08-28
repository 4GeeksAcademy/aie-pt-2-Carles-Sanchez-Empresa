//Operaciones de Colecciones

import { Product, ProductCategory, WarehouseLocation, Carrier } from '../types/models.js';

// Funciones:

//retorna los productos en el almacen que se especifique
export function filterProductsByWarehouse(products: Product[], warehouse: WarehouseLocation): Product[]{
    return products.filter(product => product.warehouse === warehouse);
}

//retorna los productos de una categoria especificada
export function filterProductsByCategory(products: Product[], category: ProductCategory): Product[]{
    return products.filter(product => product.category === category);
}

//retorna los productos donde stockQuantity <= minStockThreshold
export function filterLowStockProducts(products: Product[]): Product[]{
    return products.filter(product => product.stockQuantity <= product.minStockThreshold);
}

//retorna los productos ordenados por cantidad de stock // no debe mutar el array original
export function sortProductsByStock(products: Product[], order: "asc" | "desc"): Product[]{
    const sortedProducts = [...products];
    sortedProducts.sort((a, b) => {
        if (order === "asc") {
            return a.stockQuantity - b.stockQuantity;
        } else {
            return b.stockQuantity - a.stockQuantity;
        }
    });
    return sortedProducts;
}

//retorna los transportistas ordenados por tasa de entrega a tiempo // no debe mutar el array original
export function sortCarriersByReliability(carriers: Carrier[], order: "asc" | "desc"): Carrier[]{
    const sortedCarriers = [...carriers];
    sortedCarriers.sort((a, b) => {
        if (order === "asc") {
            return a.onTimeRate - b.onTimeRate;
        } else {
            return b.onTimeRate - a.onTimeRate;
        }
    });
    return sortedCarriers;
}


