"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import type { StockExitInput, StockExitResult } from "@/services/api";

interface Props {
  products: { id: number; name: string; warehouse: string }[];
  onSubmit: (data: StockExitInput) => Promise<StockExitResult>;
}

export function OutboundForm({ products, onSubmit }: Props) {
  const { t } = useTranslation();
  const [skuId, setSkuId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [exitType, setExitType] = useState<"dispatch" | "loss">("dispatch");
  const [tracking, setTracking] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await onSubmit({
        sku_id: parseInt(skuId, 10),
        quantity: parseInt(quantity, 10),
        exit_type: exitType,
        tracking_number: exitType === "dispatch" ? tracking : undefined,
        warehouse,
      });
      setSuccess(true);
      setSkuId("");
      setQuantity("");
      setExitType("dispatch");
      setTracking("");
      setWarehouse("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#14263a]">{t("inventory.outbound.title")}</h3>

      {success && <div className="rounded-lg border border-green-300 bg-green-100 p-3 text-sm text-green-700">{t("inventory.outbound.created")}</div>}
      {error && <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2f4a62]">{t("inventory.outbound.sku_id")}</label>
          <select
            value={skuId}
            onChange={(e) => {
              setSkuId(e.target.value);
              const selected = products.find((p) => p.id === parseInt(e.target.value));
              if (selected) setWarehouse(selected.warehouse);
            }}
            required
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm"
          >
            <option value="">-- {t("inventory.product.id")} --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} — {p.name} ({p.warehouse})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2f4a62]">{t("inventory.outbound.quantity")}</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2f4a62]">{t("inventory.outbound.type")}</label>
          <select
            value={exitType}
            onChange={(e) => setExitType(e.target.value as "dispatch" | "loss")}
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm"
          >
            <option value="dispatch">{t("inventory.outbound.type_dispatch")}</option>
            <option value="loss">{t("inventory.outbound.type_loss")}</option>
          </select>
        </div>
        {exitType === "dispatch" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2f4a62]">{t("inventory.outbound.tracking")}</label>
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder={t("inventory.outbound.tracking_placeholder")}
              className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2f4a62]">{t("inventory.outbound.warehouse")}</label>
          <input
            type="text"
            value={warehouse}
            readOnly
            className="w-full rounded-lg border border-[#c89d66] bg-[#f0ece4] px-3 py-2 text-sm text-gray-500"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[#14263a] px-5 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50"
      >
        {submitting ? t("inventory.outbound.submitting") : t("inventory.outbound.submit")}
      </button>
    </form>
  );
}