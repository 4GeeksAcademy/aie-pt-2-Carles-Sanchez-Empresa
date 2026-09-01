"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier } from "@/services/api";
import { useTranslation } from "@/lib/i18n";

export function useSuppliers() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("suppliers.error.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (data: Record<string, unknown>) => {
    setError(null);
    try {
      const created = await createSupplier(data);
      setSuppliers((prev) => [...prev, created]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("suppliers.error.create"));
      return false;
    }
  }, [t]);

  const edit = useCallback(async (id: number, data: Record<string, unknown>) => {
    setError(null);
    try {
      const updated = await updateSupplier(id, data);
      setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("suppliers.error.update"));
      return false;
    }
  }, [t]);

  const remove = useCallback(async (id: number) => {
    setError(null);
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("suppliers.error.delete"));
      return false;
    }
  }, [t]);

  return { suppliers, loading, error, add, edit, remove, reload: load };
}