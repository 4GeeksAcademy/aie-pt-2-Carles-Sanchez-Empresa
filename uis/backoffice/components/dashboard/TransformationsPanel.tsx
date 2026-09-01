"use client";

import { useState } from "react";

interface TransformationsPanelProps {
  carriers: unknown[];
  shipments: unknown[];
  products: unknown[];
  onScoreCarrier: (carrierIdx: number, shipmentIdx: number, productIdx: number) => unknown;
  onSelectBest: (shipmentIdx: number, productIdx: number) => unknown;
  onCountByCategory: () => unknown;
  onInventoryValue: () => unknown;
  onAvgDistance: () => unknown;
  onGroupByStatus: () => unknown;
  onTopCarriers: (n: number) => unknown;
}

export function TransformationsPanel({
  carriers, shipments, products,
  onScoreCarrier, onSelectBest, onCountByCategory, onInventoryValue,
  onAvgDistance, onGroupByStatus, onTopCarriers
}: TransformationsPanelProps) {
  const [carrierIdx, setCarrierIdx] = useState("0");
  const [shipmentIdx, setShipmentIdx] = useState("0");
  const [productIdx, setProductIdx] = useState("0");
  const [topN, setTopN] = useState("3");
  const [results, setResults] = useState<Record<string, string>>({});

  const showResult = (key: string, data: unknown) => {
    setResults((prev) => ({ ...prev, [key]: JSON.stringify(data, null, 2) }));
  };

  const clamp = (v: string, max: number) => Math.max(0, Math.min(parseInt(v) || 0, max - 1));

  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        Transformaciones — Scoring, Reportes, Agrupación
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">Puntuar transportista para envío</p>
          <div className="mb-2 flex flex-wrap gap-2">
            <label className="text-xs text-[#2f4a62]">Transportista: <input type="number" min="0" max={carriers.length - 1} value={carrierIdx} onChange={(e) => setCarrierIdx(e.target.value)} className="w-12 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs" /></label>
            <label className="text-xs text-[#2f4a62]">Envío: <input type="number" min="0" max={shipments.length - 1} value={shipmentIdx} onChange={(e) => setShipmentIdx(e.target.value)} className="w-12 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs" /></label>
            <label className="text-xs text-[#2f4a62]">Producto: <input type="number" min="0" max={products.length - 1} value={productIdx} onChange={(e) => setProductIdx(e.target.value)} className="w-12 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs" /></label>
            <button onClick={() => showResult("score", onScoreCarrier(clamp(carrierIdx, carriers.length), clamp(shipmentIdx, shipments.length), clamp(productIdx, products.length)))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Puntuar</button>
          </div>
          <pre className="mt-1 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.score}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">Seleccionar mejor transportista para envío</p>
          <div className="mb-2 flex gap-2">
            <label className="text-xs text-[#2f4a62]">Envío: <input type="number" min="0" max={shipments.length - 1} value={shipmentIdx} onChange={(e) => setShipmentIdx(e.target.value)} className="w-12 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs" /></label>
            <button onClick={() => showResult("best", onSelectBest(clamp(shipmentIdx, shipments.length), clamp(productIdx, products.length)))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Seleccionar</button>
          </div>
          <pre className="mt-1 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.best}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">Resumenes</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => showResult("countCat", onCountByCategory())} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Contar por categoría</button>
            <button onClick={() => showResult("invVal", onInventoryValue())} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Valor inventario</button>
            <button onClick={() => showResult("avgDist", onAvgDistance())} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Distancia media</button>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.countCat || results.invVal || results.avgDist}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">Agrupaciones y rankings</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => showResult("groupStatus", onGroupByStatus())} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Envíos por estado</button>
            <div className="flex gap-1">
              <label className="text-xs text-[#2f4a62] self-center">Top: <input type="number" min="1" max="10" value={topN} onChange={(e) => setTopN(e.target.value)} className="w-10 rounded border border-[#c89d66] bg-[#f3ddba] px-1 py-0.5 text-xs" /></label>
              <button onClick={() => showResult("topC", onTopCarriers(parseInt(topN) || 3))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Top transportistas</button>
            </div>
          </div>
          <pre className="mt-2 min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.groupStatus || results.topC}</pre>
        </div>
      </div>
    </section>
  );
}