"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useIncidentManager } from "@/hooks/useIncidentManager";
import { useTranslation } from "@/lib/i18n";

const IncidentForm = dynamic(() => import("@/components/incidents-manager/IncidentForm").then((m) => m.IncidentForm), { ssr: false });
const IncidentList = dynamic(() => import("@/components/incidents-manager/IncidentList").then((m) => m.IncidentList), { ssr: false });
const IncidentSummary = dynamic(() => import("@/components/incidents-manager/IncidentSummary").then((m) => m.IncidentSummary), { ssr: false });

type Tab = "form" | "list" | "summary";

const tabs: { value: Tab; labelKey: string }[] = [
  { value: "form", labelKey: "incidents.mgr.tab_form" },
  { value: "list", labelKey: "incidents.mgr.tab_list" },
  { value: "summary", labelKey: "incidents.mgr.tab_summary" },
];

export default function IncidentManagerPage() {
  const { t } = useTranslation();
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
        <p className="text-xs font-semibold uppercase text-[#1d4f7a]">{t("incidents.mgr.breadcrumb")}</p>
        <h1 className="text-2xl font-bold text-[#14263a]">{t("incidents.mgr.title")}</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">{t("incidents.mgr.subtitle")}</p>
      </div>

      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-1 shadow-sm">
        <div className="grid grid-cols-3" role="tablist" aria-label={t("incidents.mgr.title")}>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`im-tab-${tab.value}`}
              aria-controls={`im-panel-${tab.value}`}
              aria-selected={activeTab === tab.value}
              onClick={() => selectTab(tab.value)}
              className={`min-h-11 rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${activeTab === tab.value ? "bg-[#f8fbff] text-[#14263a] shadow-sm" : "text-[#2f4a62] hover:bg-[#edf5fb]"}`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "form" && <div role="tabpanel" id="im-panel-form" aria-labelledby="im-tab-form"><IncidentForm loading={manager.formLoading} error={manager.formError} onSubmit={manager.addIncident} /></div>}
      {activeTab === "list" && <div role="tabpanel" id="im-panel-list" aria-labelledby="im-tab-list"><IncidentList incidents={manager.incidents} loading={manager.listLoading} error={manager.listError} updatingId={manager.updatingId} onLoad={manager.loadIncidents} onStatusChange={manager.changeStatus} /></div>}
      {activeTab === "summary" && <div role="tabpanel" id="im-panel-summary" aria-labelledby="im-tab-summary"><IncidentSummary summary={manager.summary} loading={manager.summaryLoading} error={manager.summaryError} /></div>}
    </div>
  );
}