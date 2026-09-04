"use client";

import { useTranslation } from "@/lib/i18n";
import type { SKUItem } from "@/services/api";

const STOCK_THRESHOLDS = { OUT: 0, LOW: 10 };

interface Props {
  products: SKUItem[];
  loading: boolean;
  error: string | null;
  categoryFilter: string;
  warehouseFilter: string;
  onCategoryChange: (v: string) => void;
  onWarehouseChange: (v: string) => void;
  onRefresh: () => void;
}

export function StockTable({
  products,
  loading,
  error,
  categoryFilter,
  warehouseFilter,
  onCategoryChange,
  onWarehouseChange,
  onRefresh,
}: Props) {
  const { t } = useTranslation();

  const filtered = products.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (warehouseFilter && p.warehouse !== warehouseFilter) return false;
    return true;
  });

  const stockLabel = (stock: number) => {
    if (stock <= STOCK_THRESHOLDS.OUT) return { label: t("inventory.stock.out"), color: "text-red-600 bg-red-100" };
    if (stock <= STOCK_THRESHOLDS.LOW) return { label: t("inventory.stock.low"), color: "text-yellow-600 bg-yellow-100" };
    return { label: t("inventory.stock.ok"), color: "text-green-600 bg-green-100" };
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62]"
        >
          <option value="">{t("inventory.stock.all")}</option>
          <option value="fashion">Moda</option>
          <option value="electronics">Electrónica</option>
          <option value="cosmetics">Cosmética</option>
        </select>
        <select
          value={warehouseFilter}
          onChange={(e) => onWarehouseChange(e.target.value)}
          className="rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62]"
        >
          <option value="">{t("inventory.stock.all_warehouses")}</option>
          <option value="LA">Los Ángeles (LA)</option>
          <option value="ZGZ">Zaragoza (ZGZ)</option>
        </select>
        <button
          onClick={onRefresh}
          className="rounded-lg bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]"
        >
          ↻ {t("app.loading")}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">{error}</div>}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#14263a] border-t-transparent" />
          <span className="ml-3 text-sm text-[#2f4a62]">{t("inventory.loading")}</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 text-center shadow-sm">
          <p className="text-lg text-[#2f4a62]">{t("inventory.stock.empty")}</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#c89d66] bg-[#f8fbff] shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#14263a] text-[#f8fbff]">
              <tr>
                <th className="px-4 py-3">{t("inventory.product.id")}</th>
                <th className="px-4 py-3">{t("inventory.product.name")}</th>
                <th className="px-4 py-3">{t("inventory.product.sku")}</th>
                <th className="px-4 py-3">{t("inventory.product.client")}</th>
                <th className="px-4 py-3">{t("inventory.product.category")}</th>
                <th className="px-4 py-3">{t("inventory.product.warehouse")}</th>
                <th className="px-4 py-3">{t("inventory.product.stock")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c89d66] bg-[#f3ddba]">
              {filtered.map((p) => {
                const sl = stockLabel(p.current_stock);
                return (
                  <tr key={p.id} className="transition hover:bg-[#f8fbff]">
                    <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.sku_code}</td>
                    <td className="px-4 py-3">{p.client_name}</td>
                    <td className="px-4 py-3 capitalize">{p.category}</td>
                    <td className="px-4 py-3">{p.warehouse}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${sl.color}`}>
                        {p.current_stock} — {sl.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}