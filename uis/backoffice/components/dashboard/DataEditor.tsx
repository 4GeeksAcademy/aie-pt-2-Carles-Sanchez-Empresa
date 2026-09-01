"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

interface DataEditorProps {
  products: unknown[];
  shipments: unknown[];
  carriers: unknown[];
  onUpdateProducts: (raw: string) => void;
  onUpdateShipments: (raw: string) => void;
  onUpdateCarriers: (raw: string) => void;
}

export function DataEditor({ products, shipments, carriers, onUpdateProducts, onUpdateShipments, onUpdateCarriers }: DataEditorProps) {
  const { t } = useTranslation();
  const [productsRaw, setProductsRaw] = useState(() => JSON.stringify(products, null, 2));
  const [shipmentsRaw, setShipmentsRaw] = useState(() => JSON.stringify(shipments, null, 2));
  const [carriersRaw, setCarriersRaw] = useState(() => JSON.stringify(carriers, null, 2));
  const [updated, setUpdated] = useState(false);

  const applyAll = () => {
    onUpdateProducts(productsRaw);
    onUpdateShipments(shipmentsRaw);
    onUpdateCarriers(carriersRaw);
    setUpdated(true);
  };

  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        {t("dashboard.data.title")}
      </h2>
      <div className="mb-3 flex items-center gap-2">
        <button onClick={applyAll} className="rounded-lg bg-[#14263a] px-5 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">
          {t("dashboard.data.apply")}
        </button>
        <span className="text-xs text-[#2f4a62] italic">{t(updated ? "dashboard.data.updated" : "dashboard.data.loaded")}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3">
          <p className="mb-1 font-medium text-[#14263a]">{t("dashboard.data.products")}</p>
          <textarea className="h-48 w-full resize-y rounded border border-[#c89d66] bg-[#f3ddba] p-2 font-mono text-xs text-[#14263a]" value={productsRaw} onChange={(e) => setProductsRaw(e.target.value)} />
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3">
          <p className="mb-1 font-medium text-[#14263a]">{t("dashboard.data.shipments")}</p>
          <textarea className="h-48 w-full resize-y rounded border border-[#c89d66] bg-[#f3ddba] p-2 font-mono text-xs text-[#14263a]" value={shipmentsRaw} onChange={(e) => setShipmentsRaw(e.target.value)} />
        </div>
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-3">
          <p className="mb-1 font-medium text-[#14263a]">{t("dashboard.data.carriers")}</p>
          <textarea className="h-48 w-full resize-y rounded border border-[#c89d66] bg-[#f3ddba] p-2 font-mono text-xs text-[#14263a]" value={carriersRaw} onChange={(e) => setCarriersRaw(e.target.value)} />
        </div>
      </div>
    </section>
  );
}