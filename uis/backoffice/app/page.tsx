"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { DataEditor } from "@/components/dashboard/DataEditor";
import { CollectionsPanel } from "@/components/dashboard/CollectionsPanel";
import { SearchPanel } from "@/components/dashboard/SearchPanel";
import { TransformationsPanel } from "@/components/dashboard/TransformationsPanel";
import { ValidationsPanel } from "@/components/dashboard/ValidationsPanel";
import { useTranslation } from "@/lib/i18n";

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
        <p className="text-sm text-[#2f4a62]">
          Prueba y verifica las funciones de colecciones, búsqueda, transformaciones y validaciones desde <code className="rounded bg-[#f3ddba] px-1 text-xs">@trackflow/core</code>
        </p>
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