"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import type { StockEntryInput, StockEntryResult } from "@/services/api";

interface Props {
  products: { id: number; name: string; warehouse: string }[];
  onSubmit: (data: StockEntryInput) => Promise<StockEntryResult>;
}

export function InboundForm({ products, onSubmit }: Props) {
  const { t } = useTranslation();
  const [skuId, setSkuId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
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
        reference,
        warehouse,
      });
      setSuccess(true);
      setSkuId("");
      setQuantity("");
      setReference("");
      setWarehouse("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#14263a]">{t("inventory.inbound.title")}</h3>

      {success && <div className="rounded-lg border border-green-300 bg-green-100 p-3 text-sm text-green-700">{t("inventory.inbound.created")}</div>}
      {error && <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2f4a62]">{t("inventory.inbound.sku_id")}</label>
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
          <label className="mb-1 block text-sm font-medium text-[#2f4a62]}">{t("inventory.inbound.quantity")}</label>
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
          <label className="mb-1 block text-sm font-medium text-[#2f4a62]">{t("inventory.inbound.reference")}</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
            placeholder={t("inventory.inbound.reference_placeholder")}
            className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2f4a62]">{t("inventory.inbound.warehouse")}</label>
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
        className="rounded-lg bg-[#10b981] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#059669] disabled:opacity-50"
      >
        {submitting ? t("inventory.inbound.submitting") : t("inventory.inbound.submit")}
      </button>
    </form>
  );
}