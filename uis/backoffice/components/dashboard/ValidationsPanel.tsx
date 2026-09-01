"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

const VALIDATION_ERROR_KEYS: Record<string, string> = {
  "El SKU del producto no puede estar vacío": "product_sku",
  "El peso del producto debe ser mayor a 0 y menor o igual a 100 kg": "product_weight",
  "Todas las dimensiones deben ser mayores a 0 y menores o iguales a 200 cm": "product_dimensions",
  "La cantidad en stock no puede ser negativa": "product_stock",
  "El umbral mínimo de stock no puede ser negativo": "product_threshold",
  "El costo unitario debe ser mayor a 0": "product_cost",
  "La cantidad del envío debe ser mayor a 0": "shipment_quantity",
  "El valor declarado del envío debe ser mayor a 0": "shipment_value",
  "La distancia del destino no puede ser negativa": "shipment_distance",
  "La tarifa base no puede ser negativa": "carrier_base_rate",
  "La tarifa por kg no puede ser negativa": "carrier_weight_rate",
  "La tarifa por km no puede ser negativa": "carrier_distance_rate",
  "Los días promedio de entrega deben ser mayores a 0": "carrier_days",
  "La tasa de entrega a tiempo debe estar entre 0 y 100": "carrier_on_time",
  "El peso máximo debe ser mayor a 0": "carrier_weight",
  "El transportista debe operar en al menos 1 país": "carrier_country",
};

interface ValidationsPanelProps {
  products: unknown[];
  shipments: unknown[];
  carriers: unknown[];
  onValidateProduct: (idx: number) => unknown;
  onValidateShipment: (idx: number) => unknown;
  onValidateCarrier: (idx: number) => unknown;
}

export function ValidationsPanel({ products, shipments, carriers, onValidateProduct, onValidateShipment, onValidateCarrier }: ValidationsPanelProps) {
  const { t } = useTranslation();
  const [prodIdx, setProdIdx] = useState("0");
  const [shipIdx, setShipIdx] = useState("0");
  const [carrierIdx, setCarrierIdx] = useState("0");
  const [results, setResults] = useState<Record<string, unknown>>({});

  const clamp = (v: string, max: number) => Math.max(0, Math.min(parseInt(v) || 0, max - 1));

  const formatResult = (data: unknown) => {
    if (typeof data === "object" && data !== null && "errors" in data && Array.isArray(data.errors)) {
      data = {
        ...data,
        errors: data.errors.map((error) => {
          const translationKey = VALIDATION_ERROR_KEYS[String(error)];
          return translationKey ? t(`dashboard.validation.error.${translationKey}`) : error;
        }),
      };
    }
    return JSON.stringify(data, null, 2);
  };

  const showResult = (key: string, data: unknown) => {
    setResults((prev) => ({ ...prev, [key]: data }));
  };

  return (
    <section className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#14263a] flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500" />
        {t("dashboard.validation.title")}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">{t("dashboard.validation.product")}</p>
          <div className="mb-2 flex gap-2">
            <input type="number" min="0" max={products.length - 1} value={prodIdx} onChange={(e) => setProdIdx(e.target.value)} className="w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs" />
            <button onClick={() => showResult("prod", onValidateProduct(clamp(prodIdx, products.length)))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">{t("dashboard.validation.action")}</button>
          </div>
          <pre className="min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{formatResult(results.prod)}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">{t("dashboard.validation.shipment")}</p>
          <div className="mb-2 flex gap-2">
            <input type="number" min="0" max={shipments.length - 1} value={shipIdx} onChange={(e) => setShipIdx(e.target.value)} className="w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs" />
            <button onClick={() => showResult("ship", onValidateShipment(clamp(shipIdx, shipments.length)))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">{t("dashboard.validation.action")}</button>
          </div>
          <pre className="min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{formatResult(results.ship)}</pre>
        </div>

        <div className="rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4">
          <p className="mb-2 text-sm font-medium text-[#14263a]">{t("dashboard.validation.carrier")}</p>
          <div className="mb-2 flex gap-2">
            <input type="number" min="0" max={carriers.length - 1} value={carrierIdx} onChange={(e) => setCarrierIdx(e.target.value)} className="w-14 rounded border border-[#c89d66] bg-[#f3ddba] px-2 py-1 text-xs" />
            <button onClick={() => showResult("carrier", onValidateCarrier(clamp(carrierIdx, carriers.length)))} className="rounded-lg bg-[#14263a] px-4 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">{t("dashboard.validation.action")}</button>
          </div>
          <pre className="min-h-[40px] overflow-auto rounded bg-[#f3ddba] p-2 text-xs">{formatResult(results.carrier)}</pre>
        </div>
      </div>
    </section>
  );
}