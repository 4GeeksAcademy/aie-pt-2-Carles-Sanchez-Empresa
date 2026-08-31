(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/uis/backoffice/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$hooks$2f$useDashboard$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/hooks/useDashboard.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$DataEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/DataEditor.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$CollectionsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$SearchPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/SearchPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$TransformationsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$ValidationsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function DashboardPage() {
    _s();
    const { products, shipments, carriers, updateProducts, updateShipments, updateCarriers, runFilterByWarehouse, runFilterByCategory, runLowStock, runSortByStock, runSortCarriers, runFindBySKU, runFindShipmentById, runBinarySearch, runScoreCarrier, runSelectBest, runCountByCategory, runInventoryValue, runAvgDistance, runGroupByStatus, runTopCarriers, runValidateProduct, runValidateShipment, runValidateCarrier } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$hooks$2f$useDashboard$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboard"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-auto max-w-7xl space-y-6 p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-bold text-[#14263a]",
                        children: "Dashboard — Verificador de Utilidades"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/app/page.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-[#2f4a62]",
                        children: [
                            "Prueba y verifica las funciones de colecciones, búsqueda, transformaciones y validaciones desde ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$DataEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DataEditor"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$CollectionsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollectionsPanel"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$SearchPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SearchPanel"], {
                onFindBySKU: runFindBySKU,
                onFindShipmentById: runFindShipmentById,
                onBinarySearch: runBinarySearch
            }, void 0, false, {
                fileName: "[project]/uis/backoffice/app/page.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$TransformationsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TransformationsPanel"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$components$2f$dashboard$2f$ValidationsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ValidationsPanel"], {
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
_s(DashboardPage, "EQqnpkuvG9ylEcmH0whIRpka8MA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$uis$2f$backoffice$2f$hooks$2f$useDashboard$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDashboard"]
    ];
});
_c = DashboardPage;
var _c;
__turbopack_context__.k.register(_c, "DashboardPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CollectionsPanel",
    ()=>CollectionsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function CollectionsPanel({ onFilterByWarehouse, onFilterByCategory, onLowStock, onSortByStock, onSortCarriers }) {
    _s();
    const [warehouse, setWarehouse] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("Los Angeles");
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("Fashion");
    const [stockOrder, setStockOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("asc");
    const [reliabilityOrder, setReliabilityOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("desc");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const showResult = (key, data)=>{
        setResults((prev)=>({
                ...prev,
                [key]: JSON.stringify(data, null, 2)
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Filtrar productos por almacén"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 33,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: warehouse,
                                        onChange: (e)=>setWarehouse(e.target.value),
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Los Angeles",
                                                children: "Los Angeles"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 36,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Filtrar productos por categoría"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: category,
                                        onChange: (e)=>setCategory(e.target.value),
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Fashion",
                                                children: "Fashion"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 48,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Electronics",
                                                children: "Electronics"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 49,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Cosmetics",
                                                children: "Cosmetics"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 50,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "Home",
                                                children: "Home"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 51,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Productos con stock bajo"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>showResult("lowStock", onLowStock()),
                                className: "rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                children: "Ejecutar"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Ordenar productos por stock"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: stockOrder,
                                        onChange: (e)=>setStockOrder(e.target.value),
                                        className: "flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "asc",
                                                children: "Ascendente"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 69,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 md:col-span-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Ordenar transportistas por fiabilidad (onTimeRate)"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: reliabilityOrder,
                                        onChange: (e)=>setReliabilityOrder(e.target.value),
                                        className: "max-w-xs flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "desc",
                                                children: "Descendente (más fiable primero)"
                                            }, void 0, false, {
                                                fileName: "[project]/uis/backoffice/components/dashboard/CollectionsPanel.tsx",
                                                lineNumber: 81,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
_s(CollectionsPanel, "1KebnA339wTuY02W7KMNQTlG9jo=");
_c = CollectionsPanel;
var _c;
__turbopack_context__.k.register(_c, "CollectionsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/components/dashboard/DataEditor.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DataEditor",
    ()=>DataEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function DataEditor({ products, shipments, carriers, onUpdateProducts, onUpdateShipments, onUpdateCarriers }) {
    _s();
    const [productsRaw, setProductsRaw] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "DataEditor.useState": ()=>JSON.stringify(products, null, 2)
    }["DataEditor.useState"]);
    const [shipmentsRaw, setShipmentsRaw] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "DataEditor.useState": ()=>JSON.stringify(shipments, null, 2)
    }["DataEditor.useState"]);
    const [carriersRaw, setCarriersRaw] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "DataEditor.useState": ()=>JSON.stringify(carriers, null, 2)
    }["DataEditor.useState"]);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("Los datos se cargan automáticamente al abrir la página");
    const applyAll = ()=>{
        onUpdateProducts(productsRaw);
        onUpdateShipments(shipmentsRaw);
        onUpdateCarriers(carriersRaw);
        setStatus("✅ Datos actualizados");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3 flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: applyAll,
                        className: "rounded-lg bg-[#14263a] px-5 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                        children: "✅ Aplicar cambios"
                    }, void 0, false, {
                        fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-1 font-medium text-[#14263a]",
                                children: "Productos"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 41,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-1 font-medium text-[#14263a]",
                                children: "Envíos"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-1 font-medium text-[#14263a]",
                                children: "Transportistas"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/DataEditor.tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
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
_s(DataEditor, "3LfK+qWN4Sj7YLjRwJQu+2vvrOo=");
_c = DataEditor;
var _c;
__turbopack_context__.k.register(_c, "DataEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/components/dashboard/SearchPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SearchPanel",
    ()=>SearchPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function SearchPanel({ onFindBySKU, onFindShipmentById, onBinarySearch }) {
    _s();
    const [sku, setSku] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [shipmentId, setShipmentId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [searchWeight, setSearchWeight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("95");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const showResult = (key, data)=>{
        setResults((prev)=>({
                ...prev,
                [key]: JSON.stringify(data, null, 2)
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Buscar producto por SKU (lineal)"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 30,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Buscar envío por ID (lineal)"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 39,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "mb-2 block text-sm font-medium text-[#14263a]",
                                children: "Búsqueda binaria por peso (kg)"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/SearchPanel.tsx",
                                lineNumber: 48,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
_s(SearchPanel, "paEHAFSnRdehPpab4qALYNIBLEA=");
_c = SearchPanel;
var _c;
__turbopack_context__.k.register(_c, "SearchPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TransformationsPanel",
    ()=>TransformationsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function TransformationsPanel({ carriers, shipments, products, onScoreCarrier, onSelectBest, onCountByCategory, onInventoryValue, onAvgDistance, onGroupByStatus, onTopCarriers }) {
    _s();
    const [carrierIdx, setCarrierIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("0");
    const [shipmentIdx, setShipmentIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("0");
    const [productIdx, setProductIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("0");
    const [topN, setTopN] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("3");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const showResult = (key, data)=>{
        setResults((prev)=>({
                ...prev,
                [key]: JSON.stringify(data, null, 2)
            }));
    };
    const clamp = (v, max)=>Math.max(0, Math.min(parseInt(v) || 0, max - 1));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Puntuar transportista para envío"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-[#2f4a62]",
                                        children: [
                                            "Transportista: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-[#2f4a62]",
                                        children: [
                                            "Envío: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-[#2f4a62]",
                                        children: [
                                            "Producto: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Seleccionar mejor transportista para envío"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-[#2f4a62]",
                                        children: [
                                            "Envío: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Resumenes"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("countCat", onCountByCategory()),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Contar por categoría"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 66,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("invVal", onInventoryValue()),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Valor inventario"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 67,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Agrupaciones y rankings"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>showResult("groupStatus", onGroupByStatus()),
                                        className: "rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]",
                                        children: "Envíos por estado"
                                    }, void 0, false, {
                                        fileName: "[project]/uis/backoffice/components/dashboard/TransformationsPanel.tsx",
                                        lineNumber: 76,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "text-xs text-[#2f4a62] self-center",
                                                children: [
                                                    "Top: ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
_s(TransformationsPanel, "ZXeg+5H+luFXuWHSDNF+ESaWiTU=");
_c = TransformationsPanel;
var _c;
__turbopack_context__.k.register(_c, "TransformationsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ValidationsPanel",
    ()=>ValidationsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function ValidationsPanel({ products, shipments, carriers, onValidateProduct, onValidateShipment, onValidateCarrier }) {
    _s();
    const [prodIdx, setProdIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("0");
    const [shipIdx, setShipIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("0");
    const [carrierIdx, setCarrierIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("0");
    const [results, setResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const clamp = (v, max)=>Math.max(0, Math.min(parseInt(v) || 0, max - 1));
    const showResult = (key, data)=>{
        setResults((prev)=>({
                ...prev,
                [key]: JSON.stringify(data, null, 2)
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-4 md:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Validar producto"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Validar envío"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-2 text-sm font-medium text-[#14263a]",
                                children: "Validar transportista"
                            }, void 0, false, {
                                fileName: "[project]/uis/backoffice/components/dashboard/ValidationsPanel.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
_s(ValidationsPanel, "RIrd21H0uo9A9g/IgA2AEQ3cqQU=");
_c = ValidationsPanel;
var _c;
__turbopack_context__.k.register(_c, "ValidationsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/uis/backoffice/hooks/useDashboard.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDashboard",
    ()=>useDashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/collections.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/search.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/transformations.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validations.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/sampleData.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function useDashboard() {
    _s();
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sampleProducts"]);
    const [shipments, setShipments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useDashboard.useState": ()=>JSON.parse(JSON.stringify(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sampleShipments"]))
    }["useDashboard.useState"]);
    const [carriers, setCarriers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$sampleData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sampleCarriers"]);
    // ── Data editor ──
    const updateProducts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[updateProducts]": (raw)=>{
            try {
                setProducts(JSON.parse(raw));
            } catch  {}
        }
    }["useDashboard.useCallback[updateProducts]"], []);
    const updateShipments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[updateShipments]": (raw)=>{
            try {
                setShipments(JSON.parse(raw));
            } catch  {}
        }
    }["useDashboard.useCallback[updateShipments]"], []);
    const updateCarriers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[updateCarriers]": (raw)=>{
            try {
                setCarriers(JSON.parse(raw));
            } catch  {}
        }
    }["useDashboard.useCallback[updateCarriers]"], []);
    // ── Collections ──
    const runFilterByWarehouse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runFilterByWarehouse]": (warehouse)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterProductsByWarehouse"])(products, warehouse);
        }
    }["useDashboard.useCallback[runFilterByWarehouse]"], [
        products
    ]);
    const runFilterByCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runFilterByCategory]": (category)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterProductsByCategory"])(products, category);
        }
    }["useDashboard.useCallback[runFilterByCategory]"], [
        products
    ]);
    const runLowStock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runLowStock]": ()=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["filterLowStockProducts"])(products);
        }
    }["useDashboard.useCallback[runLowStock]"], [
        products
    ]);
    const runSortByStock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runSortByStock]": (order)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sortProductsByStock"])(products, order);
        }
    }["useDashboard.useCallback[runSortByStock]"], [
        products
    ]);
    const runSortCarriers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runSortCarriers]": (order)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$collections$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sortCarriersByReliability"])(carriers, order);
        }
    }["useDashboard.useCallback[runSortCarriers]"], [
        carriers
    ]);
    // ── Search ──
    const runFindBySKU = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runFindBySKU]": (sku)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findProductBySKU"])(products, sku);
        }
    }["useDashboard.useCallback[runFindBySKU]"], [
        products
    ]);
    const runFindShipmentById = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runFindShipmentById]": (id)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findShipmentById"])(shipments, id);
        }
    }["useDashboard.useCallback[runFindShipmentById]"], [
        shipments
    ]);
    const runBinarySearch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runBinarySearch]": (weight)=>{
            const sorted = [
                ...products
            ].sort({
                "useDashboard.useCallback[runBinarySearch].sorted": (a, b)=>a.weightKg - b.weightKg
            }["useDashboard.useCallback[runBinarySearch].sorted"]);
            const idx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$search$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["binarySearchProductByWeight"])(sorted, weight);
            if (idx === -1) return null;
            return sorted[idx];
        }
    }["useDashboard.useCallback[runBinarySearch]"], [
        products
    ]);
    // ── Transformations ──
    const runScoreCarrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runScoreCarrier]": (carrierIdx, shipmentIdx, productIdx)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scoreCarrierForShipment"])(carriers[carrierIdx], shipments[shipmentIdx], products[productIdx]);
        }
    }["useDashboard.useCallback[runScoreCarrier]"], [
        products,
        shipments,
        carriers
    ]);
    const runSelectBest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runSelectBest]": (shipmentIdx, productIdx)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["selectBestCarrier"])(carriers, shipments[shipmentIdx], products[productIdx]);
        }
    }["useDashboard.useCallback[runSelectBest]"], [
        products,
        shipments,
        carriers
    ]);
    const runCountByCategory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runCountByCategory]": ()=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["countProductsByCategory"])(products);
        }
    }["useDashboard.useCallback[runCountByCategory]"], [
        products
    ]);
    const runInventoryValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runInventoryValue]": ()=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateTotalInventoryValue"])(products);
        }
    }["useDashboard.useCallback[runInventoryValue]"], [
        products
    ]);
    const runAvgDistance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runAvgDistance]": ()=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateAverageShipmentDistance"])(shipments);
        }
    }["useDashboard.useCallback[runAvgDistance]"], [
        shipments
    ]);
    const runGroupByStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runGroupByStatus]": ()=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["groupShipmentsByStatus"])(shipments);
        }
    }["useDashboard.useCallback[runGroupByStatus]"], [
        shipments
    ]);
    const runTopCarriers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runTopCarriers]": (n)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$transformations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findTopCarriers"])(shipments, n);
        }
    }["useDashboard.useCallback[runTopCarriers]"], [
        shipments
    ]);
    // ── Validations ──
    const runValidateProduct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runValidateProduct]": (productIdx)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateProduct"])(products[productIdx]);
        }
    }["useDashboard.useCallback[runValidateProduct]"], [
        products
    ]);
    const runValidateShipment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runValidateShipment]": (shipmentIdx)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateShipment"])(shipments[shipmentIdx]);
        }
    }["useDashboard.useCallback[runValidateShipment]"], [
        shipments
    ]);
    const runValidateCarrier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useDashboard.useCallback[runValidateCarrier]": (carrierIdx)=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCarrier"])(carriers[carrierIdx]);
        }
    }["useDashboard.useCallback[runValidateCarrier]"], [
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
_s(useDashboard, "0tYMWHA1KBxFn8E8c5JGCkS8Exc=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=uis_backoffice_0_8oiel._.js.map