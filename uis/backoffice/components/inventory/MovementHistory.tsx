"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import type { Movement } from "@/services/api";

interface Props {
  movements: Movement[];
  loading: boolean;
  error: string | null;
}

export function MovementHistory({ movements, loading, error }: Props) {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  const warehouses = useMemo(() => {
    const unique = new Set(movements.map((m) => m.warehouse).filter(Boolean));
    return Array.from(unique).sort();
  }, [movements]);

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      if (typeFilter && m.type !== typeFilter) return false;
      if (warehouseFilter && m.warehouse !== warehouseFilter) return false;
      return true;
    });
  }, [movements, typeFilter, warehouseFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62]"
        >
          <option value="">{t("inventory.order.filter_all_types")}</option>
          <option value="inbound">{t("inventory.order.inbound")}</option>
          <option value="outbound">{t("inventory.order.outbound")}</option>
        </select>
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62]"
        >
          <option value="">{t("inventory.order.filter_all_warehouses")}</option>
          {warehouses.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#14263a] border-t-transparent" />
          <span className="ml-3 text-sm text-[#2f4a62]">{t("inventory.loading")}</span>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 text-center shadow-sm">
          <p className="text-lg text-[#2f4a62]">{t("inventory.order.empty")}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#c89d66] bg-[#f8fbff] shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#14263a] text-[#f8fbff]">
              <tr>
                <th className="px-4 py-3">{t("inventory.order.type")}</th>
                <th className="px-4 py-3">{t("inventory.order.product")}</th>
                <th className="px-4 py-3">{t("inventory.order.quantity")}</th>
                <th className="px-4 py-3">{t("inventory.order.warehouse")}</th>
                <th className="px-4 py-3">{t("inventory.order.reference")}</th>
                <th className="px-4 py-3">{t("inventory.order.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c89d66] bg-[#f3ddba]">
              {filtered.map((m) => (
                <tr key={`${m.type}-${m.id}`} className="hover:bg-[#f8fbff]">
                  <td className="px-4 py-3">
                    {m.type === "inbound" ? (
                      <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {t("inventory.order.inbound")}
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        {t("inventory.order.outbound")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{m.sku_name || `#${m.sku_id}`}</td>
                  <td className="px-4 py-3 font-mono">{m.quantity}</td>
                  <td className="px-4 py-3">{m.warehouse}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {m.reference_or_exit || m.tracking_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}