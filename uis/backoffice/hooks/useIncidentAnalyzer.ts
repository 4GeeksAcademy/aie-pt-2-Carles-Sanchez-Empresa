"use client";

import { useState, useCallback } from "react";

export interface IncidentRow {
  [key: string]: string;
}

export interface IncidentStats {
  total: number;
  resolved: number;
  pending: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionTime?: number;
}

export function useIncidentAnalyzer() {
  const [rows, setRows] = useState<IncidentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = useCallback((text: string) => {
    setError(null);
    try {
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        setError("El CSV debe tener al menos una cabecera y una fila de datos");
        setRows([]);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const parsed: IncidentRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: IncidentRow = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] ?? "";
        });
        parsed.push(row);
      }

      setRows(parsed);
    } catch (err) {
      setError("Error al parsear el CSV");
      setRows([]);
    }
  }, []);

  const getStats = useCallback((): IncidentStats | null => {
    if (rows.length === 0) return null;

    const resolved = rows.filter((r) => {
      const status = (r.status || r.Status || "").toLowerCase();
      return status === "resolved" || status === "closed";
    }).length;

    const pending = rows.length - resolved;

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    let totalResolutionHours = 0;
    let resolutionCount = 0;

    rows.forEach((r) => {
      const type = (r.type || r.Type || r.category || r.Category || "unknown").toLowerCase();
      byType[type] = (byType[type] || 0) + 1;

      const priority = (r.priority || r.Priority || "unknown").toLowerCase();
      byPriority[priority] = (byPriority[priority] || 0) + 1;

      const resolutionTime = parseFloat(r.resolution_hours || r.ResolutionHours || "");
      if (!isNaN(resolutionTime)) {
        totalResolutionHours += resolutionTime;
        resolutionCount++;
      }
    });

    return {
      total: rows.length,
      resolved,
      pending,
      byType,
      byPriority,
      avgResolutionTime: resolutionCount > 0 ? totalResolutionHours / resolutionCount : undefined,
    };
  }, [rows]);

  return { rows, error, parseCSV, getStats };
}