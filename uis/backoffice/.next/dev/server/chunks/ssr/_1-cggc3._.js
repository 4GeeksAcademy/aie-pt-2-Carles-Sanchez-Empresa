module.exports = [
"[project]/src/data/sampleData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Datos de ejemplo para el panel TrackFlow
 * Este archivo contiene los datos de demostración usados en la interfaz.
 */ __turbopack_context__.s([
    "sampleCarriers",
    ()=>sampleCarriers,
    "sampleProducts",
    ()=>sampleProducts,
    "sampleShipments",
    ()=>sampleShipments
]);
const sampleProducts = [
    {
        sku: "SHOE-BLK-42",
        name: "Zapatillas Negras Running - Talla 42",
        category: "Fashion",
        weightKg: 0.8,
        dimensions: {
            lengthCm: 35,
            widthCm: 22,
            heightCm: 12
        },
        warehouse: "Los Angeles",
        stockQuantity: 45,
        minStockThreshold: 20,
        unitCostUSD: 35.0,
        isFragile: false,
        status: "Active"
    },
    {
        sku: "LAPTOP-DELL-15",
        name: "Laptop Dell 15 pulgadas",
        category: "Electronics",
        weightKg: 2.3,
        dimensions: {
            lengthCm: 40,
            widthCm: 28,
            heightCm: 3
        },
        warehouse: "Zaragoza",
        stockQuantity: 8,
        minStockThreshold: 10,
        unitCostUSD: 650.0,
        isFragile: true,
        status: "Low stock"
    },
    {
        sku: "PERFUME-COCO-50",
        name: "Perfume Coco 50ml",
        category: "Cosmetics",
        weightKg: 0.3,
        dimensions: {
            lengthCm: 12,
            widthCm: 8,
            heightCm: 15
        },
        warehouse: "Los Angeles",
        stockQuantity: 120,
        minStockThreshold: 30,
        unitCostUSD: 85.0,
        isFragile: true,
        status: "Active"
    }
];
const sampleShipments = [
    {
        id: "SH-2024-8821",
        sku: "LAPTOP-DELL-15",
        quantity: 1,
        origin: "Zaragoza",
        destination: {
            city: "Madrid",
            country: "Spain",
            postalCode: "28001",
            distanceKm: 320
        },
        priority: "Express",
        declaredValueUSD: 650.0,
        carrier: null,
        status: "Pending",
        createdAt: new Date("2024-03-15")
    }
];
const sampleCarriers = [
    {
        id: "CAR-UPS",
        name: "UPS",
        operatesIn: [
            "United States"
        ],
        baseRateUSD: 5.0,
        ratePerKgUSD: 1.2,
        ratePerKmUSD: 0.05,
        avgDeliveryDays: 3,
        onTimeRate: 88,
        maxWeightKg: 30,
        handlesFragile: true,
        acceptsPriority: [
            "Standard",
            "Express"
        ]
    },
    {
        id: "CAR-SEUR",
        name: "SEUR",
        operatesIn: [
            "Spain"
        ],
        baseRateUSD: 6.5,
        ratePerKgUSD: 1.5,
        ratePerKmUSD: 0.08,
        avgDeliveryDays: 2,
        onTimeRate: 92,
        maxWeightKg: 25,
        handlesFragile: true,
        acceptsPriority: [
            "Standard",
            "Express",
            "Same-day"
        ]
    },
    {
        id: "CAR-DHL",
        name: "DHL Express",
        operatesIn: [
            "United States",
            "Spain"
        ],
        baseRateUSD: 12.0,
        ratePerKgUSD: 2.0,
        ratePerKmUSD: 0.1,
        avgDeliveryDays: 1,
        onTimeRate: 95,
        maxWeightKg: 50,
        handlesFragile: true,
        acceptsPriority: [
            "Express",
            "Same-day"
        ]
    }
];
}),
"[project]/src/utils/collections.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

//Operaciones de Colecciones
__turbopack_context__.s([
    "filterLowStockProducts",
    ()=>filterLowStockProducts,
    "filterProductsByCategory",
    ()=>filterProductsByCategory,
    "filterProductsByWarehouse",
    ()=>filterProductsByWarehouse,
    "sortCarriersByReliability",
    ()=>sortCarriersByReliability,
    "sortProductsByStock",
    ()=>sortProductsByStock
]);
function filterProductsByWarehouse(products, warehouse) {
    return products.filter((product)=>product.warehouse === warehouse);
}
function filterProductsByCategory(products, category) {
    return products.filter((product)=>product.category === category);
}
function filterLowStockProducts(products) {
    return products.filter((product)=>product.stockQuantity <= product.minStockThreshold);
}
function sortProductsByStock(products, order) {
    const sortedProducts = [
        ...products
    ];
    sortedProducts.sort((a, b)=>{
        if (order === "asc") {
            return a.stockQuantity - b.stockQuantity;
        } else {
            return b.stockQuantity - a.stockQuantity;
        }
    });
    return sortedProducts;
}
function sortCarriersByReliability(carriers, order) {
    const sortedCarriers = [
        ...carriers
    ];
    sortedCarriers.sort((a, b)=>{
        if (order === "asc") {
            return a.onTimeRate - b.onTimeRate;
        } else {
            return b.onTimeRate - a.onTimeRate;
        }
    });
    return sortedCarriers;
}
}),
"[project]/src/utils/search.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

//Operaciones de Búsqueda
__turbopack_context__.s([
    "binarySearchProductByWeight",
    ()=>binarySearchProductByWeight,
    "findProductBySKU",
    ()=>findProductBySKU,
    "findShipmentById",
    ()=>findShipmentById
]);
function findProductBySKU(products, sku) {
    for (const product of products){
        if (product.sku === sku) {
            return product;
        }
    }
    return null;
}
function findShipmentById(shipments, id) {
    for (const shipment of shipments){
        if (shipment.id === id) {
            return shipment;
        }
    }
    return null;
}
function binarySearchProductByWeight(sortedProducts, targetWeight) {
    let left = 0;
    let right = sortedProducts.length - 1;
    while(left <= right){
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
}),
"[project]/src/utils/transformations.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

//Scoring de Transportista y Cálculo de Costos
__turbopack_context__.s([
    "calculateAverageShipmentDistance",
    ()=>calculateAverageShipmentDistance,
    "calculateShippingCost",
    ()=>calculateShippingCost,
    "calculateTotalInventoryValue",
    ()=>calculateTotalInventoryValue,
    "countProductsByCategory",
    ()=>countProductsByCategory,
    "findTopCarriers",
    ()=>findTopCarriers,
    "groupShipmentsByStatus",
    ()=>groupShipmentsByStatus,
    "scoreCarrierForShipment",
    ()=>scoreCarrierForShipment,
    "selectBestCarrier",
    ()=>selectBestCarrier
]);
function calculateShippingCost(shipment, product, carrier) {
    let cost = carrier.baseRateUSD;
    cost += product.weightKg * carrier.ratePerKgUSD * shipment.quantity;
    cost += shipment.destination.distanceKm * carrier.ratePerKmUSD;
    if (shipment.priority === "Express") cost *= 1.3;
    else if (shipment.priority === "Same-day") cost *= 1.6;
    return Number(cost.toFixed(2));
}
function scoreCarrierForShipment(carrier, shipment, product) {
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
function selectBestCarrier(carriers, shipment, product) {
    let bestCarrier = null;
    for (const carrier of carriers){
        const score = scoreCarrierForShipment(carrier, shipment, product);
        if (score < 50) continue;
        const cost = calculateShippingCost(shipment, product, carrier);
        if (!bestCarrier || cost < bestCarrier.cost) {
            bestCarrier = {
                carrier,
                score,
                cost
            };
        }
    }
    return bestCarrier;
}
function countProductsByCategory(products) {
    const counts = {
        "Fashion": 0,
        "Electronics": 0,
        "Cosmetics": 0,
        "Home": 0,
        "Other": 0
    };
    for (const product of products){
        counts[product.category]++;
    }
    return counts;
}
function calculateTotalInventoryValue(products) {
    let totalValue = 0;
    for (const product of products){
        totalValue += product.stockQuantity * product.unitCostUSD;
    }
    return Number(totalValue.toFixed(2));
}
function calculateAverageShipmentDistance(shipments) {
    if (shipments.length === 0) return 0;
    let totalDistance = 0;
    for (const shipment of shipments){
        totalDistance += shipment.destination.distanceKm;
    }
    const average = totalDistance / shipments.length;
    return Number(average.toFixed(2));
}
function groupShipmentsByStatus(shipments) {
    const groups = {
        "Pending": [],
        "Assigned": [],
        "In transit": [],
        "Delivered": [],
        "Failed": []
    };
    for (const shipment of shipments){
        groups[shipment.status].push(shipment);
    }
    return groups;
}
function findTopCarriers(shipments, topN) {
    const carrierCounts = {};
    for (const shipment of shipments){
        if (shipment.carrier === null) continue;
        if (carrierCounts[shipment.carrier]) {
            carrierCounts[shipment.carrier]++;
        } else {
            carrierCounts[shipment.carrier] = 1;
        }
    }
    const sorted = [];
    for(const name in carrierCounts){
        sorted.push({
            carrier: name,
            count: carrierCounts[name]
        });
    }
    sorted.sort((a, b)=>b.count - a.count);
    return sorted.slice(0, topN);
}
}),
"[project]/src/utils/validations.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

//Validaciones de negocio
__turbopack_context__.s([
    "validateCarrier",
    ()=>validateCarrier,
    "validateProduct",
    ()=>validateProduct,
    "validateShipment",
    ()=>validateShipment
]);
function validateProduct(product) {
    const errors = [];
    if (!product.sku || product.sku.trim() === "") {
        errors.push("El SKU del producto no puede estar vacío");
    }
    if (product.weightKg <= 0 || product.weightKg > 100) {
        errors.push("El peso del producto debe ser mayor a 0 y menor o igual a 100 kg");
    }
    if (product.dimensions.lengthCm <= 0 || product.dimensions.lengthCm > 200 || product.dimensions.widthCm <= 0 || product.dimensions.widthCm > 200 || product.dimensions.heightCm <= 0 || product.dimensions.heightCm > 200) {
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
        errors
    };
}
function validateShipment(shipment) {
    const errors = [];
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
        errors
    };
}
function validateCarrier(carrier) {
    const errors = [];
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
        errors
    };
}
}),
"[project]/uis/backoffice/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$hooks$2f$useDashboard$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/hooks/useDashboard.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$DataEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/DataEditor.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$CollectionsPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$SearchPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/SearchPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$TransformationsPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$ValidationsPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
function DashboardPage() {
    const { products, shipments, carriers, updateProducts, updateShipments, updateCarriers, runFilterByWarehouse, runFilterByCategory, runLowStock, runSortByStock, runSortCarriers, runFindBySKU, runFindShipmentById, runBinarySearch, runScoreCarrier, runSelectBest, runCountByCategory, runInventoryValue, runAvgDistance, runGroupByStatus, runTopCarriers, runValidateProduct, runValidateShipment, runValidateCarrier } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$hooks$2f$useDashboard$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDashboard"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-auto max-w-7xl space-y-6 p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-bold text-[#14263a]",
                        children: "Dashboard — Verificador de Utilidades"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/app/page.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-[#2f4a62]",
                        children: [
                            "Prueba y verifica las funciones de colecciones, búsqueda, transformaciones y validaciones desde ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "rounded bg-[#f3ddba] px-1 text-xs",
                                children: "@trackflow/core"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/app/page.tsx",
                                lineNumber: 27,
                                columnNumber: 107
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/app/page.tsx",
                        lineNumber: 26,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/app/page.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$DataEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DataEditor"], {
                products: products,
                shipments: shipments,
                carriers: carriers,
                onUpdateProducts: updateProducts,
                onUpdateShipments: updateShipments,
                onUpdateCarriers: updateCarriers
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/app/page.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$CollectionsPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CollectionsPanel"], {
                onFilterByWarehouse: runFilterByWarehouse,
                onFilterByCategory: runFilterByCategory,
                onLowStock: runLowStock,
                onSortByStock: runSortByStock,
                onSortCarriers: runSortCarriers
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/app/page.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$SearchPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SearchPanel"], {
                onFindBySKU: runFindBySKU,
                onFindShipmentById: runFindShipmentById,
                onBinarySearch: runBinarySearch
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/app/page.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$TransformationsPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TransformationsPanel"], {
                carriers: carriers,
                shipments: shipments,
                products: products,
                onScoreCarrier: runScoreCarrier,
                onSelectBest: runSelectBest,
                onCountByCategory: runCountByCategory,
                onInventoryValue: runInventoryValue,
                onAvgDistance: runAvgDistance,
                onGroupByStatus: runGroupByStatus,
                onTopCarriers: runTopCarriers
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/app/page.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$ValidationsPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ValidationsPanel"], {
                products: products,
                shipments: shipments,
                carriers: carriers,
                onValidateProduct: runValidateProduct,
                onValidateShipment: runValidateShipment,
                onValidateCarrier: runValidateCarrier
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/app/page.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/app/page.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
}),
"[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CollectionsPanel",
    ()=>CollectionsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function CollectionsPanel({ onFilterByWarehouse, onFilterByCategory, onLowStock, onSortByStock, onSortCarriers }) {
    const [warehouse, setWarehouse] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Los Angeles");
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Fashion");
    const [stockOrder, setStockOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("asc");
    const [reliabilityOrder, setReliabilityOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("desc");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const showResult = (key, data)=>{
        setResults((prev)=>({
                ...prev,
                [key]: JSON.stringify(data, null, 2)
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-3 h-3 rounded-full bg-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                        lineNumber: 27,
                        columnNumber: 9
                    }, this),
                    "Colecciones — Filtrado y Ordenación"
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Filtrar productos por almacén"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 33,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: warehouse,
                                        onChange: (e)=>setWarehouse(e.target.value),
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Los Angeles",
                                                children: "Los Angeles"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 36,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Zaragoza",
                                                children: "Zaragoza"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 37,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                        lineNumber: 35,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("warehouse", onFilterByWarehouse(warehouse)),
                                        className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Ejecutar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                        lineNumber: 39,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 34,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.warehouse
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 41,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Filtrar productos por categoría"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: category,
                                        onChange: (e)=>setCategory(e.target.value),
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Fashion",
                                                children: "Fashion"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 48,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Electronics",
                                                children: "Electronics"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 49,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Cosmetics",
                                                children: "Cosmetics"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 50,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Home",
                                                children: "Home"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 51,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Other",
                                                children: "Other"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 52,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                        lineNumber: 47,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("category", onFilterByCategory(category)),
                                        className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Ejecutar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                        lineNumber: 54,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 46,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.category
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Productos con stock bajo"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>showResult("lowStock", onLowStock()),
                                className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                children: "Ejecutar"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.lowStock
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Ordenar productos por stock"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: stockOrder,
                                        onChange: (e)=>setStockOrder(e.target.value),
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "asc",
                                                children: "Ascendente"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 69,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "desc",
                                                children: "Descendente"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 70,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                        lineNumber: 68,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("sortStock", onSortByStock(stockOrder)),
                                        className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Ejecutar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                        lineNumber: 72,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 67,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.sortStock
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 md:col-span-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Ordenar transportistas por fiabilidad (onTimeRate)"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: reliabilityOrder,
                                        onChange: (e)=>setReliabilityOrder(e.target.value),
                                        className: "max-w-xs flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "desc",
                                                children: "Descendente (más fiable primero)"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 81,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "asc",
                                                children: "Ascendente (menos fiable primero)"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 82,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                        lineNumber: 80,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("sortCarriers", onSortCarriers(reliabilityOrder)),
                                        className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Ejecutar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                        lineNumber: 84,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.sortCarriers
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
}),
"[project]/uis/backoffice/components/dashboard/DataEditor.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DataEditor",
    ()=>DataEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function DataEditor({ products, shipments, carriers, onUpdateProducts, onUpdateShipments, onUpdateCarriers }) {
    const [productsRaw, setProductsRaw] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>JSON.stringify(products, null, 2));
    const [shipmentsRaw, setShipmentsRaw] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>JSON.stringify(shipments, null, 2));
    const [carriersRaw, setCarriersRaw] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>JSON.stringify(carriers, null, 2));
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Los datos se cargan automáticamente al abrir la página");
    const applyAll = ()=>{
        onUpdateProducts(productsRaw);
        onUpdateShipments(shipmentsRaw);
        onUpdateCarriers(carriersRaw);
        setStatus("✅ Datos actualizados");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-3 h-3 rounded-full bg-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this),
                    "Datos de ejemplo"
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3 flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: applyAll,
                        className: "rounded-lg bg-[#14263a] px-5 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                        children: "✅ Aplicar cambios"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-[#2f4a62] italic",
                        children: status
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-1 font-medium text-[#14263a]",
                                children: "Productos"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 41,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                className: "h-48 w-full resize-y rounded border border-[#c89d66] bg-[#f3ddba] p-2 font-mono text-xs text-[#14263a]",
                                value: productsRaw,
                                onChange: (e)=>setProductsRaw(e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 42,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-1 font-medium text-[#14263a]",
                                children: "Envíos"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                className: "h-48 w-full resize-y rounded border border-[#c89d66] bg-[#f3ddba] p-2 font-mono text-xs text-[#14263a]",
                                value: shipmentsRaw,
                                onChange: (e)=>setShipmentsRaw(e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 46,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-1 font-medium text-[#14263a]",
                                children: "Transportistas"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                className: "h-48 w-full resize-y rounded border border-[#c89d66] bg-[#f3ddba] p-2 font-mono text-xs text-[#14263a]",
                                value: carriersRaw,
                                onChange: (e)=>setCarriersRaw(e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 50,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
}),
"[project]/uis/backoffice/components/dashboard/SearchPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SearchPanel",
    ()=>SearchPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function SearchPanel({ onFindBySKU, onFindShipmentById, onBinarySearch }) {
    const [sku, setSku] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [shipmentId, setShipmentId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [searchWeight, setSearchWeight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("95");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const showResult = (key, data)=>{
        setResults((prev)=>({
                ...prev,
                [key]: JSON.stringify(data, null, 2)
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-3 h-3 rounded-full bg-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                        lineNumber: 24,
                        columnNumber: 9
                    }, this),
                    "Búsqueda"
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Buscar producto por SKU (lineal)"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 30,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: sku,
                                        onChange: (e)=>setSku(e.target.value),
                                        placeholder: "SKU-...",
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                        lineNumber: 32,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("sku", onFindBySKU(sku)),
                                        className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Buscar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                        lineNumber: 33,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 31,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.sku
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Buscar envío por ID (lineal)"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 39,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: shipmentId,
                                        onChange: (e)=>setShipmentId(e.target.value),
                                        placeholder: "SHP-...",
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                        lineNumber: 41,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("shipment", onFindShipmentById(shipmentId)),
                                        className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Buscar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                        lineNumber: 42,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.shipment
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Búsqueda binaria por peso (kg)"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 48,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        step: "0.1",
                                        value: searchWeight,
                                        onChange: (e)=>setSearchWeight(e.target.value),
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                        lineNumber: 50,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("binary", onBinarySearch(parseFloat(searchWeight) || 0)),
                                        className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Buscar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                        lineNumber: 51,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.binary
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
}),
"[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TransformationsPanel",
    ()=>TransformationsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function TransformationsPanel({ carriers, shipments, products, onScoreCarrier, onSelectBest, onCountByCategory, onInventoryValue, onAvgDistance, onGroupByStatus, onTopCarriers }) {
    const [carrierIdx, setCarrierIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("0");
    const [shipmentIdx, setShipmentIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("0");
    const [productIdx, setProductIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("0");
    const [topN, setTopN] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("3");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const showResult = (key, data)=>{
        setResults((prev)=>({
                ...prev,
                [key]: JSON.stringify(data, null, 2)
            }));
    };
    const clamp = (v, max)=>Math.max(0, Math.min(parseInt(v) || 0, max - 1));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-3 h-3 rounded-full bg-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    "Transformaciones — Scoring, Reportes, Agrupación"
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Puntuar transportista para envío"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-[#2f4a62]",
                                        children: [
                                            "Transportista: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                min: "0",
                                                max: carriers.length - 1,
                                                value: carrierIdx,
                                                onChange: (e)=>setCarrierIdx(e.target.value),
                                                className: "w-12 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                                lineNumber: 46,
                                                columnNumber: 70
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 46,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-[#2f4a62]",
                                        children: [
                                            "Envío: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                min: "0",
                                                max: shipments.length - 1,
                                                value: shipmentIdx,
                                                onChange: (e)=>setShipmentIdx(e.target.value),
                                                className: "w-12 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                                lineNumber: 47,
                                                columnNumber: 62
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 47,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-[#2f4a62]",
                                        children: [
                                            "Producto: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                min: "0",
                                                max: products.length - 1,
                                                value: productIdx,
                                                onChange: (e)=>setProductIdx(e.target.value),
                                                className: "w-12 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                                lineNumber: 48,
                                                columnNumber: 65
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 48,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("score", onScoreCarrier(clamp(carrierIdx, carriers.length), clamp(shipmentIdx, shipments.length), clamp(productIdx, products.length))),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Puntuar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 49,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-1 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.score
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 51,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Seleccionar mejor transportista para envío"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-[#2f4a62]",
                                        children: [
                                            "Envío: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                min: "0",
                                                max: shipments.length - 1,
                                                value: shipmentIdx,
                                                onChange: (e)=>setShipmentIdx(e.target.value),
                                                className: "w-12 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                                lineNumber: 57,
                                                columnNumber: 62
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 57,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("best", onSelectBest(clamp(shipmentIdx, shipments.length), clamp(productIdx, products.length))),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Seleccionar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 58,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-1 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.best
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Resumenes"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("countCat", onCountByCategory()),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Contar por categoría"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 66,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("invVal", onInventoryValue()),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Valor inventario"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 67,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("avgDist", onAvgDistance()),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Distancia media"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 68,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.countCat || results.invVal || results.avgDist
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 70,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Agrupaciones y rankings"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("groupStatus", onGroupByStatus()),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Envíos por estado"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 76,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "text-xs text-[#2f4a62] self-center",
                                                children: [
                                                    "Top: ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "number",
                                                        min: "1",
                                                        max: "10",
                                                        value: topN,
                                                        onChange: (e)=>setTopN(e.target.value),
                                                        className: "w-10 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs"
                                                    }, void 0, false, {
                                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                                        lineNumber: 78,
                                                        columnNumber: 74
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                                lineNumber: 78,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>showResult("topC", onTopCarriers(parseInt(topN) || 3)),
                                                className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                                children: "Top transportistas"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                                lineNumber: 79,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 77,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 75,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.groupStatus || results.topC
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 82,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
}),
"[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ValidationsPanel",
    ()=>ValidationsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function ValidationsPanel({ products, shipments, carriers, onValidateProduct, onValidateShipment, onValidateCarrier }) {
    const [prodIdx, setProdIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("0");
    const [shipIdx, setShipIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("0");
    const [carrierIdx, setCarrierIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("0");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const clamp = (v, max)=>Math.max(0, Math.min(parseInt(v) || 0, max - 1));
    const showResult = (key, data)=>{
        setResults((prev)=>({
                ...prev,
                [key]: JSON.stringify(data, null, 2)
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-3 h-3 rounded-full bg-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    "Validaciones de negocio"
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Validar producto"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        min: "0",
                                        max: products.length - 1,
                                        value: prodIdx,
                                        onChange: (e)=>setProdIdx(e.target.value),
                                        className: "w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                        lineNumber: 37,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("prod", onValidateProduct(clamp(prodIdx, products.length))),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Validar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                        lineNumber: 38,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.prod
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Validar envío"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        min: "0",
                                        max: shipments.length - 1,
                                        value: shipIdx,
                                        onChange: (e)=>setShipIdx(e.target.value),
                                        className: "w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                        lineNumber: 46,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("ship", onValidateShipment(clamp(shipIdx, shipments.length))),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Validar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                        lineNumber: 47,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.ship
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Validar transportista"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        min: "0",
                                        max: carriers.length - 1,
                                        value: carrierIdx,
                                        onChange: (e)=>setCarrierIdx(e.target.value),
                                        className: "w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                        lineNumber: 55,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("carrier", onValidateCarrier(clamp(carrierIdx, carriers.length))),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Validar"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                        lineNumber: 56,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 54,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs",
                                children: results.carrier
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
}),
"[project]/uis/backoffice/hooks/useDashboard.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDashboard",
    ()=>useDashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/index.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/collections.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/search.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/transformations.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validations.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/sampleData.ts [app-ssr] (ecmascript)");
"use client";
;
;
function useDashboard() {
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sampleProducts"]);
    const [shipments, setShipments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>JSON.parse(JSON.stringify(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sampleShipments"])));
    const [carriers, setCarriers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sampleCarriers"]);
    // ── Data editor ──
    const updateProducts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((raw)=>{
        try {
            setProducts(JSON.parse(raw));
        } catch  {}
    }, []);
    const updateShipments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((raw)=>{
        try {
            setShipments(JSON.parse(raw));
        } catch  {}
    }, []);
    const updateCarriers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((raw)=>{
        try {
            setCarriers(JSON.parse(raw));
        } catch  {}
    }, []);
    // ── Collections ──
    const runFilterByWarehouse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((warehouse)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["filterProductsByWarehouse"])(products, warehouse);
    }, [
        products
    ]);
    const runFilterByCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((category)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["filterProductsByCategory"])(products, category);
    }, [
        products
    ]);
    const runLowStock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["filterLowStockProducts"])(products);
    }, [
        products
    ]);
    const runSortByStock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((order)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sortProductsByStock"])(products, order);
    }, [
        products
    ]);
    const runSortCarriers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((order)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sortCarriersByReliability"])(carriers, order);
    }, [
        carriers
    ]);
    // ── Search ──
    const runFindBySKU = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((sku)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findProductBySKU"])(products, sku);
    }, [
        products
    ]);
    const runFindShipmentById = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findShipmentById"])(shipments, id);
    }, [
        shipments
    ]);
    const runBinarySearch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((weight)=>{
        const sorted = [
            ...products
        ].sort((a, b)=>a.weightKg - b.weightKg);
        const idx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["binarySearchProductByWeight"])(sorted, weight);
        if (idx === -1) return null;
        return sorted[idx];
    }, [
        products
    ]);
    // ── Transformations ──
    const runScoreCarrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((carrierIdx, shipmentIdx, productIdx)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["scoreCarrierForShipment"])(carriers[carrierIdx], shipments[shipmentIdx], products[productIdx]);
    }, [
        products,
        shipments,
        carriers
    ]);
    const runSelectBest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((shipmentIdx, productIdx)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["selectBestCarrier"])(carriers, shipments[shipmentIdx], products[productIdx]);
    }, [
        products,
        shipments,
        carriers
    ]);
    const runCountByCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["countProductsByCategory"])(products);
    }, [
        products
    ]);
    const runInventoryValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateTotalInventoryValue"])(products);
    }, [
        products
    ]);
    const runAvgDistance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateAverageShipmentDistance"])(shipments);
    }, [
        shipments
    ]);
    const runGroupByStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupShipmentsByStatus"])(shipments);
    }, [
        shipments
    ]);
    const runTopCarriers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((n)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findTopCarriers"])(shipments, n);
    }, [
        shipments
    ]);
    // ── Validations ──
    const runValidateProduct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((productIdx)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateProduct"])(products[productIdx]);
    }, [
        products
    ]);
    const runValidateShipment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((shipmentIdx)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateShipment"])(shipments[shipmentIdx]);
    }, [
        shipments
    ]);
    const runValidateCarrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((carrierIdx)=>{
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateCarrier"])(carriers[carrierIdx]);
    }, [
        carriers
    ]);
    return {
        products,
        shipments,
        carriers,
        updateProducts,
        updateShipments,
        updateCarriers,
        runFilterByWarehouse,
        runFilterByCategory,
        runLowStock,
        runSortByStock,
        runSortCarriers,
        runFindBySKU,
        runFindShipmentById,
        runBinarySearch,
        runScoreCarrier,
        runSelectBest,
        runCountByCategory,
        runInventoryValue,
        runAvgDistance,
        runGroupByStatus,
        runTopCarriers,
        runValidateProduct,
        runValidateShipment,
        runValidateCarrier
    };
}
}),
];

//# sourceMappingURL=_1-cggc3._.js.map