"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { track } from "@/services/telemetry";

interface DataEditorProps {
  products: unknown[];
  shipments: unknown[];
  carriers: unknown[];
  onUpdateProducts: (raw: string) => void;
  onUpdateShipments: (raw: string) => void;
  onUpdateCarriers: (raw: string) => void;
}

function DataEditorInner({ products, shipments, carriers, onUpdateProducts, onUpdateShipments, onUpdateCarriers }: DataEditorProps) {
  const { t } = useTranslation();
  // Solo serializar una vez cuando los datos llegan, evitar re-serialización en cada render
  const [productsRaw, setProductsRaw] = useState(() => JSON.stringify(products, null, 2));
  const [shipmentsRaw, setShipmentsRaw] = useState(() => JSON.stringify(shipments, null, 2));
  const [carriersRaw, setCarriersRaw] = useState(() => JSON.stringify(carriers, null, 2));
  const [updated, setUpdated] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current && products && products.length > 0) {
      setProductsRaw(JSON.stringify(products, null, 2));
      loaded.current = true;
    }
  }, [products]);

  useEffect(() => {
    if (shipments && shipments.length > 0) {
      setShipmentsRaw(JSON.stringify(shipments, null, 2));
    }
  }, [shipments]);

  useEffect(() => {
    if (carriers && carriers.length > 0) {
      setCarriersRaw(JSON.stringify(carriers, null, 2));
    }
  }, [carriers]);

  const applyAll = useCallback(() => {
    // M4: direct_stock_edit_rejected — detectar intentos de editar stock directamente
    try {
      const parsedProducts = JSON.parse(productsRaw);
      if (Array.isArray(parsedProducts)) {
        const hasDirectStockEdit = parsedProducts.some(
          (p: Record<string, unknown>) => "current_stock" in p || "stock" in p
        );
        if (hasDirectStockEdit) {
          track("direct_stock_edit_rejected", {
            warehouse: "unknown",
            attempted_new_stock: 0,
            current_stock: 0,
            method: "backoffice",
            rejection_reason: "Direct stock editing not allowed through JSON editor",
          });
        }
      }
    } catch {
      // JSON parse error — no action needed for telemetry
    }

    onUpdateProducts(productsRaw);
    onUpdateShipments(shipmentsRaw);
    onUpdateCarriers(carriersRaw);
    setUpdated(true);
  }, [productsRaw, shipmentsRaw, carriersRaw, onUpdateProducts, onUpdateShipments, onUpdateCarriers]);

  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="flex-shrink-0 w-3 h-3 rounded-full bg-blue-500" />
        {t("dashboard.data.title")}
      </h2>
      <div className="mb-3 flex items-center gap-2">
        <button onClick={applyAll} className="rounded-lg bg-[#14263a] px-5 py-2 text-sm font-medium text-[#f8fbff] transition-colors hover:bg-[#1d4f7a]">
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

export const DataEditor = memo(DataEditorInner);