"use client";

import { useState } from "react";

interface CollectionsPanelProps {
  onFilterByWarehouse: (warehouse: string) => unknown[];
  onFilterByCategory: (category: string) => unknown[];
  onLowStock: () => unknown[];
  onSortByStock: (order: "asc" | "desc") => unknown[];
  onSortCarriers: (order: "asc" | "desc") => unknown[];
}

export function CollectionsPanel({ onFilterByWarehouse, onFilterByCategory, onLowStock, onSortByStock, onSortCarriers }: CollectionsPanelProps) {
  const [warehouse, setWarehouse] = useState("Los Angeles");
  const [category, setCategory] = useState("Fashion");
  const [stockOrder, setStockOrder] = useState<"asc" | "desc">("asc");
  const [reliabilityOrder, setReliabilityOrder] = useState<"asc" | "desc">("desc");
  const [results, setResults] = useState<Record<string, string>>({});

  const showResult = (key: string, data: unknown) => {
    setResults((prev) => ({ ...prev, [key]: JSON.stringify(data, null, 2) }));
  };

  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        Colecciones — Filtrado y Ordenación
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <label className="mb-2 block text-sm font-medium text-[#14263a]">Filtrar productos por almacén</label>
          <div className="flex gap-2">
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]">
              <option value="Los Angeles">Los Angeles</option>
              <option value="Zaragoza">Zaragoza</option>
            </select>
            <button onClick={() => showResult("warehouse", onFilterByWarehouse(warehouse))} className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Ejecutar</button>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.warehouse}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <label className="mb-2 block text-sm font-medium text-[#14263a]">Filtrar productos por categoría</label>
          <div className="flex gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]">
              <option value="Fashion">Fashion</option>
              <option value="Electronics">Electronics</option>
              <option value="Cosmetics">Cosmetics</option>
              <option value="Home">Home</option>
              <option value="Other">Other</option>
            </select>
            <button onClick={() => showResult("category", onFilterByCategory(category))} className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Ejecutar</button>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.category}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">Productos con stock bajo</p>
          <button onClick={() => showResult("lowStock", onLowStock())} className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Ejecutar</button>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.lowStock}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <label className="mb-2 block text-sm font-medium text-[#14263a]">Ordenar productos por stock</label>
          <div className="flex gap-2">
            <select value={stockOrder} onChange={(e) => setStockOrder(e.target.value as "asc" | "desc")} className="flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]">
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
            <button onClick={() => showResult("sortStock", onSortByStock(stockOrder))} className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Ejecutar</button>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.sortStock}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[#14263a]">Ordenar transportistas por fiabilidad (onTimeRate)</label>
          <div className="flex gap-2">
            <select value={reliabilityOrder} onChange={(e) => setReliabilityOrder(e.target.value as "asc" | "desc")} className="max-w-xs flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm text-[#14263a]">
              <option value="desc">Descendente (más fiable primero)</option>
              <option value="asc">Ascendente (menos fiable primero)</option>
            </select>
            <button onClick={() => showResult("sortCarriers", onSortCarriers(reliabilityOrder))} className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Ejecutar</button>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.sortCarriers}</pre>
        </div>
      </div>
    </section>
  );
}