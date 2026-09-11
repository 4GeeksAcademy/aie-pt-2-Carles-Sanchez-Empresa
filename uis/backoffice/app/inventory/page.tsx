"use client";

import { useState, useEffect } from "react";
import { useInventory } from "@/hooks/useInventory";
import { StockTable } from "@/components/inventory/StockTable";
import { InboundForm } from "@/components/inventory/InboundForm";
import { OutboundForm } from "@/components/inventory/OutboundForm";
import { MovementHistory } from "@/components/inventory/MovementHistory";
import { useTranslation } from "@/lib/i18n";

type Tab = "stock" | "inbound" | "outbound" | "orders";

export default function InventoryPage() {
  const { t } = useTranslation();
  const { products, movements, loading, error, loadProducts, loadMovements, addProduct, registerInbound, registerOutbound } = useInventory();

  const [activeTab, setActiveTab] = useState<Tab>("stock");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  useEffect(() => {
    loadProducts();
    loadMovements();
  }, [loadProducts, loadMovements]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "stock", label: t("inventory.tab.stock") },
    { key: "inbound", label: t("inventory.tab.inbound") },
    { key: "outbound", label: t("inventory.tab.outbound") },
    { key: "orders", label: t("inventory.tab.orders") },
  ];

  const productOptions = products.map((p) => ({ id: p.id, name: p.name, warehouse: p.warehouse }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#14263a]">{t("inventory.title")}</h1>
        <p className="text-sm text-[#2f4a62]">{t("inventory.subtitle")}</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-1 shadow-sm">
        <div className="grid grid-cols-4" role="tablist" aria-label={t("inventory.title")}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`min-h-11 rounded-lg px-2 py-2 text-sm font-semibold transition ${activeTab === tab.key ? "bg-[#f8fbff] text-[#14263a] shadow-sm" : "text-[#2f4a62] hover:bg-[#edf5fb]"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "stock" && (
        <StockTable
          products={products}
          loading={loading}
          error={error}
          categoryFilter={categoryFilter}
          warehouseFilter={warehouseFilter}
          onCategoryChange={setCategoryFilter}
          onWarehouseChange={setWarehouseFilter}
          onRefresh={() => loadProducts()}
        />
      )}

      {activeTab === "inbound" && (
        <InboundForm
          products={productOptions}
          onSubmit={registerInbound}
        />
      )}

      {activeTab === "outbound" && (
        <OutboundForm
          products={productOptions}
          onSubmit={registerOutbound}
        />
      )}

      {activeTab === "orders" && (
        <MovementHistory
          movements={movements}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
}