(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/data/sampleData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
// Barrel exports for @trackflow/core
// All shared logic lives here — projects import from this package
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/collections.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/search.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/transformations.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validations.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$models$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/models.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/sampleData.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearToken",
    ()=>clearToken,
    "getAuthHeaders",
    ()=>getAuthHeaders,
    "getAuthMe",
    ()=>getAuthMe,
    "getProfile",
    ()=>getProfile,
    "getToken",
    ()=>getToken,
    "handleAuthError",
    ()=>handleAuthError,
    "login",
    ()=>login,
    "logout",
    ()=>logout,
    "register",
    ()=>register,
    "requireAuth",
    ()=>requireAuth,
    "setToken",
    ()=>setToken,
    "updateProfile",
    ()=>updateProfile
]);
/**
 * src/services/auth.ts — Módulo compartido de autenticación (TrackFlow)
 *
 * Funciones para login, registro, gestión de token JWT y perfil.
 * Utilizado tanto por el backoffice (HTML estático + bundle) como
 * por las aplicaciones Next.js del monorepo.
 *
 * Almacena el token en localStorage bajo la clave "trackflow_token".
 */ const STORAGE_KEY = "trackflow_token";
const API_ORIGIN = ""; // Rutas relativas (mismo servidor FastAPI)
function getToken() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return localStorage.getItem(STORAGE_KEY);
}
function setToken(token) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    localStorage.setItem(STORAGE_KEY, token);
}
function clearToken() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    localStorage.removeItem(STORAGE_KEY);
}
function getAuthHeaders() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const token = getToken();
    if (!token) return {};
    return {
        Authorization: `Bearer ${token}`
    };
}
function requireAuth() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const token = getToken();
    if (!token) {
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
}
function handleAuthError(err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Detecta 401
    if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("No se pudieron validar")) {
        clearToken();
        window.location.href = "/login?reason=session_expired";
    }
    throw err;
}
async function login(email, password) {
    const res = await fetch(`${API_ORIGIN}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });
    if (!res.ok) {
        let detail = `Error ${res.status}`;
        try {
            const body = await res.json();
            detail = body.detail || detail;
        } catch  {
        // ignore
        }
        throw new Error(detail);
    }
    const data = await res.json();
    setToken(data.access_token);
    return data.access_token;
}
async function register(data) {
    // 1. Crear usuario
    const registerPayload = {
        email: data.email,
        password: data.password
    };
    if (data.name) registerPayload.name = data.name;
    if (data.phone) registerPayload.phone = data.phone;
    if (data.address) registerPayload.address = data.address;
    const regRes = await fetch(`${API_ORIGIN}/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(registerPayload)
    });
    if (!regRes.ok) {
        let detail = `Error ${regRes.status}`;
        try {
            const body = await regRes.json();
            detail = body.detail || detail;
        } catch  {
        // ignore
        }
        throw new Error(detail);
    }
    // 2. Login automático con las mismas credenciales
    return login(data.email, data.password);
}
async function getAuthMe() {
    const res = await fetch(`${API_ORIGIN}/auth/me`, {
        headers: {
            ...getAuthHeaders()
        }
    });
    if (!res.ok) {
        if (res.status === 401) {
            clearToken();
            window.location.href = "/login?reason=session_expired";
        }
        let detail = `Error ${res.status}`;
        try {
            const body = await res.json();
            detail = body.detail || detail;
        } catch  {
        // ignore
        }
        throw new Error(detail);
    }
    return res.json();
}
async function getProfile() {
    const res = await fetch(`${API_ORIGIN}/profiles/me`, {
        headers: {
            ...getAuthHeaders()
        }
    });
    if (!res.ok) {
        if (res.status === 401) {
            clearToken();
            window.location.href = "/login?reason=session_expired";
        }
        let detail = `Error ${res.status}`;
        try {
            const body = await res.json();
            detail = body.detail || detail;
        } catch  {
        // ignore
        }
        throw new Error(detail);
    }
    return res.json();
}
async function updateProfile(data) {
    const res = await fetch(`${API_ORIGIN}/profiles/me`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        if (res.status === 401) {
            clearToken();
            window.location.href = "/login?reason=session_expired";
        }
        let detail = `Error ${res.status}`;
        try {
            const body = await res.json();
            detail = body.detail || detail;
        } catch  {
        // ignore
        }
        throw new Error(detail);
    }
    return res.json();
}
function logout() {
    clearToken();
    if ("TURBOPACK compile-time truthy", 1) {
        window.location.href = "/login";
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/types/models.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

//Interfaces y tipos
//Variables:
//Del producto:
__turbopack_context__.s([]);
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/collections.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/search.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/transformations.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/validations.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/app/layout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BackofficeLayout,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$AuthGuard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/AuthGuard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/Header.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
const dynamic = "force-dynamic";
function BackofficeLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: "es",
        className: "h-full antialiased",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
            className: "flex min-h-full flex-col bg-[#c6dced] text-[#2f4a62]",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$AuthGuard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AuthGuard"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Header"], {}, void 0, false, {
                        fileName: "[project]/uis/backoffice/app/layout.tsx",
                        lineNumber: 15,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1",
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/app/layout.tsx",
                        lineNumber: 16,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                        className: "border-t border-[#c89d66] bg-[#f3ddba]",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[#2f4a62] md:flex-row md:items-center md:justify-between",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "© 2025 TrackFlow. Todos los derechos reservados."
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/app/layout.tsx",
                                lineNumber: 19,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/app/layout.tsx",
                            lineNumber: 18,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/app/layout.tsx",
                        lineNumber: 17,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/uis/backoffice/app/layout.tsx",
                lineNumber: 14,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/uis/backoffice/app/layout.tsx",
            lineNumber: 13,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/uis/backoffice/app/layout.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_c = BackofficeLayout;
var _c;
__turbopack_context__.k.register(_c, "BackofficeLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/components/AuthGuard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthGuard",
    ()=>AuthGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/auth.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function AuthGuard({ children }) {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const isAuthPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AuthGuard.useMemo[isAuthPage]": ()=>pathname === "/login" || pathname === "/register"
    }["AuthGuard.useMemo[isAuthPage]"], [
        pathname
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthGuard.useEffect": ()=>{
            const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getToken"])();
            if (isAuthPage) {
                if (token) {
                    router.replace("/");
                }
                return;
            }
            if (!token) {
                const redirect = encodeURIComponent(pathname || "/");
                router.replace(`/login?redirect=${redirect}`);
            }
        }
    }["AuthGuard.useEffect"], [
        isAuthPage,
        pathname,
        router
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/uis/backoffice/components/AuthGuard.tsx",
        lineNumber: 32,
        columnNumber: 10
    }, this);
}
_s(AuthGuard, "tUQiD7RpG36SSF2rV0c6Z41vYd0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AuthGuard;
var _c;
__turbopack_context__.k.register(_c, "AuthGuard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/components/Header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const protectedLinks = [
    {
        href: "/",
        label: "Dashboard"
    },
    {
        href: "/suppliers",
        label: "Proveedores"
    },
    {
        href: "/incidents",
        label: "Incidencias"
    }
];
function Header() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [token, setTokenState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            setMounted(true);
            setTokenState((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getToken"])());
        }
    }["Header.useEffect"], [
        pathname
    ]);
    // Durante SSR y primer render en cliente mostramos siempre la versión no-auth
    // para evitar errores de hydratación por diferencias en localStorage
    const showAuth = mounted && !!token;
    if (isAuthPage) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
            className: "border-b border-[#c89d66] bg-[#f3ddba]",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: "/",
                    className: "inline-flex items-center bg-transparent",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        src: "/Logo TrackFlow.png",
                        alt: "TrackFlow",
                        width: 112,
                        height: 56,
                        className: "h-14 w-auto md:h-16 bg-transparent",
                        priority: true
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/Header.tsx",
                        lineNumber: 40,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/uis/backoffice/components/Header.tsx",
                    lineNumber: 39,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/components/Header.tsx",
                lineNumber: 38,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/uis/backoffice/components/Header.tsx",
            lineNumber: 37,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "border-b border-[#c89d66] bg-[#f3ddba]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "inline-flex items-center bg-transparent",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                src: "/Logo TrackFlow.png",
                                alt: "TrackFlow",
                                width: 112,
                                height: 56,
                                className: "h-14 w-auto md:h-16 bg-transparent",
                                priority: true
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/Header.tsx",
                                lineNumber: 59,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/components/Header.tsx",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this),
                        showAuth && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                            className: "hidden md:flex items-center gap-2",
                            children: protectedLinks.map((link)=>{
                                const isActive = pathname === link.href;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: link.href,
                                    className: `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-[#14263a] text-[#f8fbff]" : "text-[#2f4a62] hover:bg-[#e5be83] hover:text-[#14263a]"}`,
                                    children: link.label
                                }, link.href, false, {
                                    fileName: "[project]/uis/backoffice/components/Header.tsx",
                                    lineNumber: 73,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/components/Header.tsx",
                            lineNumber: 69,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/uis/backoffice/components/Header.tsx",
                    lineNumber: 57,
                    columnNumber: 9
                }, this),
                showAuth && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/account/profile",
                            className: "rounded-lg px-3 py-2 text-sm font-medium text-[#2f4a62] hover:bg-[#e5be83] hover:text-[#14263a] transition",
                            children: "👤 Perfil"
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/components/Header.tsx",
                            lineNumber: 92,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logout"])(),
                            className: "rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-500/30 transition",
                            children: "🚪 Salir"
                        }, void 0, false, {
                            fileName: "[project]/uis/backoffice/components/Header.tsx",
                            lineNumber: 98,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/uis/backoffice/components/Header.tsx",
                    lineNumber: 91,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/uis/backoffice/components/Header.tsx",
            lineNumber: 56,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/uis/backoffice/components/Header.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_s(Header, "mwWEQ1Pg6FTybuJJ5m0WpUTVL3U=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = Header;
var _c;
__turbopack_context__.k.register(_c, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_1lxa633._.js.map