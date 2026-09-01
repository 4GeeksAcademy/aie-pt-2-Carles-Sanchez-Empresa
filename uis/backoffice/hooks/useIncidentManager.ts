"use client";

import { useCallback, useState } from "react";
import {
  createIncident,
  fetchIncidents,
  fetchIncidentSummary,
  updateIncidentStatus,
  type Incident,
  type IncidentCreateInput,
  type IncidentFilters,
  type IncidentStatus,
  type IncidentSummary,
} from "@/services/api";
import { useTranslation } from "@/lib/i18n";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useIncidentManager() {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadIncidents = useCallback(async (filters: IncidentFilters = {}) => {
    setListLoading(true);
    setListError(null);
    try {
      setIncidents(await fetchIncidents(filters));
    } catch (error) {
      setListError(errorMessage(error, t("incidents.mgr.error.load")));
    } finally {
      setListLoading(false);
    }
  }, [t]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      setSummary(await fetchIncidentSummary());
    } catch (error) {
      setSummaryError(errorMessage(error, t("incidents.mgr.error.summary")));
    } finally {
      setSummaryLoading(false);
    }
  }, [t]);

  const addIncident = useCallback(async (input: IncidentCreateInput): Promise<boolean> => {
    setFormLoading(true);
    setFormError(null);
    try {
      const created = await createIncident(input);
      setIncidents((current) => [created, ...current]);
      setSummary(null);
      return true;
    } catch (error) {
      setFormError(errorMessage(error, t("incidents.mgr.error.create")));
      return false;
    } finally {
      setFormLoading(false);
    }
  }, [t]);

  const changeStatus = useCallback(async (id: number, status: IncidentStatus): Promise<boolean> => {
    setUpdatingId(id);
    setListError(null);
    try {
      const updated = await updateIncidentStatus(id, status);
      setIncidents((current) => current.map((incident) => incident.id === id ? updated : incident));
      setSummary(null);
      return true;
    } catch (error) {
      setListError(errorMessage(error, t("incidents.mgr.error.status")));
      return false;
    } finally {
      setUpdatingId(null);
    }
  }, [t]);

  return {
    incidents,
    summary,
    listLoading,
    summaryLoading,
    formLoading,
    updatingId,
    listError,
    summaryError,
    formError,
    loadIncidents,
    loadSummary,
    addIncident,
    changeStatus,
  };
}