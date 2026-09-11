"use client";

import dynamic from "next/dynamic";
import { Suspense, memo } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { DataEditor } from "@/components/dashboard/DataEditor";
import { useTranslation } from "@/lib/i18n";

// Los 4 paneles secundarios se cargan bajo demanda para mejorar LCP y TBT
const CollectionsPanel = dynamic(() => import("@/components/dashboard/CollectionsPanel").then(m => m.CollectionsPanel), {
  ssr: false,
});
const SearchPanel = dynamic(() => import("@/components/dashboard/SearchPanel").then(m => m.SearchPanel), {
  ssr: false,
});
const TransformationsPanel = dynamic(() => import("@/components/dashboard/TransformationsPanel").then(m => m.TransformationsPanel), {
  ssr: false,
});
const ValidationsPanel = dynamic(() => import("@/components/dashboard/ValidationsPanel").then(m => m.ValidationsPanel), {
  ssr: false,
});

// Skeletons de carga con altura específica de cada panel para evitar CLS
function PanelSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div className={`${className} rounded-xl border border-[#c89d66] bg-[#f3ddba]/50 p-6`}>
      <div className="h-5 w-48 rounded bg-[#c89d66]/30 animate-pulse mb-4" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-32 rounded bg-[#c89d66]/20 animate-pulse" />
        <div className="h-32 rounded bg-[#c89d66]/20 animate-pulse" />
        <div className="h-32 rounded bg-[#c89d66]/20 animate-pulse" />
      </div>
    </div>
  );
}

// DashboardContent separado para evitar re-renders del layout padre
const DashboardContent = memo(function DashboardContent() {
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

      {/* DataEditor es el contenido crítico para LCP — se renderiza primero */}
      <DataEditor
        products={products}
        shipments={shipments}
        carriers={carriers}
        onUpdateProducts={updateProducts}
        onUpdateShipments={updateShipments}
        onUpdateCarriers={updateCarriers}
      />

      {/* Componentes secundarios con Suspense para carga progresiva */}
      <Suspense fallback={<PanelSkeleton className="h-72" />}>
        <CollectionsPanel
          onFilterByWarehouse={runFilterByWarehouse}
          onFilterByCategory={runFilterByCategory}
          onLowStock={runLowStock}
          onSortByStock={runSortByStock}
          onSortCarriers={runSortCarriers}
        />
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        <SearchPanel
          onFindBySKU={runFindBySKU}
          onFindShipmentById={runFindShipmentById}
          onBinarySearch={runBinarySearch}
        />
      </Suspense>

      <Suspense fallback={<PanelSkeleton className="h-80" />}>
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
      </Suspense>

      <Suspense fallback={<PanelSkeleton />}>
        <ValidationsPanel
          products={products}
          shipments={shipments}
          carriers={carriers}
          onValidateProduct={runValidateProduct}
          onValidateShipment={runValidateShipment}
          onValidateCarrier={runValidateCarrier}
        />
      </Suspense>
    </div>
  );
});

export default function DashboardPage() {
  return <DashboardContent />;
}