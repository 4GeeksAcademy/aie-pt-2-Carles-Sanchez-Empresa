"use client";

import { useState } from "react";
import { IncidentForm } from "@/components/incidents-manager/IncidentForm";
import { IncidentList } from "@/components/incidents-manager/IncidentList";
import { IncidentSummary } from "@/components/incidents-manager/IncidentSummary";
import { useIncidentManager } from "@/hooks/useIncidentManager";

type Tab = "form" | "list" | "summary";

const tabs: { value: Tab; label: string }[] = [
  { value: "form", label: "Nueva incidencia" },
  { value: "list", label: "Listado" },
  { value: "summary", label: "Resumen" },
];

export default function IncidentManagerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("form");
  const manager = useIncidentManager();

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "list") void manager.loadIncidents();
    if (tab === "summary") void manager.loadSummary();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div>
        <p className="text-xs font-semibold uppercase text-[#1d4f7a]">Operaciones</p>
        <h1 className="text-2xl font-bold text-[#14263a]">Gestor centralizado de incidencias</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">Registra, prioriza y supervisa incidencias de todas las sedes.</p>
      </div>

      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-1 shadow-sm">
        <div className="grid grid-cols-3" role="tablist" aria-label="Vistas del gestor">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => selectTab(tab.value)}
              className={`min-h-11 rounded-lg px-2 py-2 text-sm font-semibold transition ${activeTab === tab.value ? "bg-[#f8fbff] text-[#14263a] shadow-sm" : "text-[#2f4a62] hover:bg-[#edf5fb]"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "form" && <IncidentForm loading={manager.formLoading} error={manager.formError} onSubmit={manager.addIncident} />}
      {activeTab === "list" && <IncidentList incidents={manager.incidents} loading={manager.listLoading} error={manager.listError} updatingId={manager.updatingId} onLoad={manager.loadIncidents} onStatusChange={manager.changeStatus} />}
      {activeTab === "summary" && <IncidentSummary summary={manager.summary} loading={manager.summaryLoading} error={manager.summaryError} />}
    </div>
  );
}