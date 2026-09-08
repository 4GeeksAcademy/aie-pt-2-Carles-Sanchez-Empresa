"use client";

import dynamic from "next/dynamic";
import { useDashboard } from "@/hooks/useDashboard";
import { DataEditor } from "@/components/dashboard/DataEditor";
import { useTranslation } from "@/lib/i18n";

// Componentes pesados cargados dinámicamente para mejorar LCP y reducir JS inicial
const CollectionsPanel = dynamic(() => import("@/components/dashboard/CollectionsPanel").then(m => m.CollectionsPanel), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl border border-[#c89d66] bg-[#f3ddba]/50 p-6 animate-pulse" />,
});
const SearchPanel = dynamic(() => import("@/components/dashboard/SearchPanel").then(m => m.SearchPanel), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl border border-[#c89d66] bg-[#f3ddba]/50 p-6 animate-pulse" />,
});
const TransformationsPanel = dynamic(() => import("@/components/dashboard/TransformationsPanel").then(m => m.TransformationsPanel), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl border border-[#c89d66] bg-[#f3ddba]/50 p-6 animate-pulse" />,
});
const ValidationsPanel = dynamic(() => import("@/components/dashboard/ValidationsPanel").then(m => m.ValidationsPanel), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl border border-[#c89d66] bg-[#f3ddba]/50 p-6 animate-pulse" />,
});

export default function DashboardPage() {
  const { t } = useTranslation();
  const {
    products, shipments, carriers,
    updateProducts, updateShipments, updateCarriers,
    runFilterByWarehouse, runFilterByCategory, runLowStock,
    runSortByStock, runSortCarriers,
    runFindBySKU, runFindShipmentById, runBinarySearch,
    runScoreCarrier, runSelectBest, runCountByCategory,
    runInventoryValue, runAvgDistance, runGroupByStatus, runTopCarriers,
    runValidateProduct, runValidateShipment, runValidateCarrier,
  } = useDashboard();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#14263a]">{t("dashboard.title")}</h1>
        <p className="text-sm text-[#2f4a62]">{t("dashboard.subtitle", { lib: "@trackflow/core" })}</p>
      </div>

      <DataEditor
        products={products}
        shipments={shipments}
        carriers={carriers}
        onUpdateProducts={updateProducts}
        onUpdateShipments={updateShipments}
        onUpdateCarriers={updateCarriers}
      />

      <CollectionsPanel
        onFilterByWarehouse={runFilterByWarehouse}
        onFilterByCategory={runFilterByCategory}
        onLowStock={runLowStock}
        onSortByStock={runSortByStock}
        onSortCarriers={runSortCarriers}
      />

      <SearchPanel
        onFindBySKU={runFindBySKU}
        onFindShipmentById={runFindShipmentById}
        onBinarySearch={runBinarySearch}
      />

      <TransformationsPanel
        carriers={carriers}
        shipments={shipments}
        products={products}
        onScoreCarrier={runScoreCarrier}
        onSelectBest={runSelectBest}
        onCountByCategory={runCountByCategory}
        onInventoryValue={runInventoryValue}
        onAvgDistance={runAvgDistance}
        onGroupByStatus={runGroupByStatus}
        onTopCarriers={runTopCarriers}
      />

      <ValidationsPanel
        products={products}
        shipments={shipments}
        carriers={carriers}
        onValidateProduct={runValidateProduct}
        onValidateShipment={runValidateShipment}
        onValidateCarrier={runValidateCarrier}
      />
    </div>
  );
}