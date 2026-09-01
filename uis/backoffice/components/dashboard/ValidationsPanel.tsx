"use client";

import { useState } from "react";

interface ValidationsPanelProps {
  products: unknown[];
  shipments: unknown[];
  carriers: unknown[];
  onValidateProduct: (idx: number) => unknown;
  onValidateShipment: (idx: number) => unknown;
  onValidateCarrier: (idx: number) => unknown;
}

export function ValidationsPanel({ products, shipments, carriers, onValidateProduct, onValidateShipment, onValidateCarrier }: ValidationsPanelProps) {
  const [prodIdx, setProdIdx] = useState("0");
  const [shipIdx, setShipIdx] = useState("0");
  const [carrierIdx, setCarrierIdx] = useState("0");
  const [results, setResults] = useState<Record<string, string>>({});

  const clamp = (v: string, max: number) => Math.max(0, Math.min(parseInt(v) || 0, max - 1));

  const showResult = (key: string, data: unknown) => {
    setResults((prev) => ({ ...prev, [key]: JSON.stringify(data, null, 2) }));
  };

  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        Validaciones de negocio
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">Validar producto</p>
          <div className="mb-2 flex gap-2">
            <input type="number" min="0" max={products.length - 1} value={prodIdx} onChange={(e) => setProdIdx(e.target.value)} className="w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs" />
            <button onClick={() => showResult("prod", onValidateProduct(clamp(prodIdx, products.length)))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Validar</button>
          </div>
          <pre className="min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.prod}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">Validar envío</p>
          <div className="mb-2 flex gap-2">
            <input type="number" min="0" max={shipments.length - 1} value={shipIdx} onChange={(e) => setShipIdx(e.target.value)} className="w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs" />
            <button onClick={() => showResult("ship", onValidateShipment(clamp(shipIdx, shipments.length)))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Validar</button>
          </div>
          <pre className="min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.ship}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">Validar transportista</p>
          <div className="mb-2 flex gap-2">
            <input type="number" min="0" max={carriers.length - 1} value={carrierIdx} onChange={(e) => setCarrierIdx(e.target.value)} className="w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs" />
            <button onClick={() => showResult("carrier", onValidateCarrier(clamp(carrierIdx, carriers.length)))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Validar</button>
          </div>
          <pre className="min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{results.carrier}</pre>
        </div>
      </div>
    </section>
  );
}