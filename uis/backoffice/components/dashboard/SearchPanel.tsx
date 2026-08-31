"use client";

import { useState } from "react";

interface SearchPanelProps {
  onFindBySKU: (sku: string) => unknown;
  onFindShipmentById: (id: string) => unknown;
  onBinarySearch: (weight: number) => unknown;
}

export function SearchPanel({ onFindBySKU, onFindShipmentById, onBinarySearch }: SearchPanelProps) {
  const [sku, setSku] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [searchWeight, setSearchWeight] = useState("95");
  const [results, setResults] = useState<Record<string, string>>({});

  const showResult = (key: string, data: unknown) => {
    setResults((prev) => ({ ...prev, [key]: JSON.stringify(data, null, 2) }));
  };

  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        Búsqueda
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <label className="mb-2 block text-sm font-medium text-[#14263a]">Buscar producto por SKU (lineal)</label>
          <div className="flex gap-2">
            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-..." className="flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm" />
            <button onClick={() => showResult("sku", onFindBySKU(sku))} className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Buscar</button>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.sku}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <label className="mb-2 block text-sm font-medium text-[#14263a]">Buscar envío por ID (lineal)</label>
          <div className="flex gap-2">
            <input type="text" value={shipmentId} onChange={(e) => setShipmentId(e.target.value)} placeholder="SHP-..." className="flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm" />
            <button onClick={() => showResult("shipment", onFindShipmentById(shipmentId))} className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Buscar</button>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.shipment}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <label className="mb-2 block text-sm font-medium text-[#14263a]">Búsqueda binaria por peso (kg)</label>
          <div className="flex gap-2">
            <input type="number" step="0.1" value={searchWeight} onChange={(e) => setSearchWeight(e.target.value)} className="flex-1 rounded-lg border border-[#c89d66] bg-[#f3ddba] px-3 py-2 text-sm" />
            <button onClick={() => showResult("binary", onBinarySearch(parseFloat(searchWeight) || 0))} className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Buscar</button>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.binary}</pre>
        </div>
      </div>
    </section>
  );
}