"use client";

import { useState } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { SupplierFilters } from "@/components/suppliers/SupplierFilters";
import { NewSupplierForm } from "@/components/suppliers/NewSupplierForm";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import type { Supplier } from "@/services/api";
import { useTranslation } from "@/lib/i18n";

export default function SuppliersPage() {
  const { t } = useTranslation();
  const { suppliers, loading, error, add, edit, remove } = useSuppliers();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filtered = suppliers.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.contact_email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && !s.categories?.includes(categoryFilter)) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    return true;
  });

  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t("suppliers.delete_confirm"))) {
      await remove(id);
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editingSupplier) {
      return edit(editingSupplier.id, data);
    }
    return add(data);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#14263a]">{t("suppliers.title")}</h1>
          <p className="text-sm text-[#2f4a62]">{t("suppliers.subtitle")}</p>
        </div>
        <button onClick={() => { setEditingSupplier(null); setShowForm(!showForm); }} className="rounded-lg bg-[#14263a] px-5 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">
          {showForm ? t("suppliers.cancel") : t("suppliers.add")}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <NewSupplierForm
          key={editingSupplier?.id ?? "new"}
          onSubmit={handleFormSubmit}
          initial={editingSupplier ? {
            name: editingSupplier.name,
            country: editingSupplier.country,
            rate_per_shipment: String(editingSupplier.rate_per_shipment),
            currency: editingSupplier.currency,
            categories: editingSupplier.categories[0] ?? "",
            service_zone: editingSupplier.service_zone ?? "",
            contact_email: editingSupplier.contact_email ?? "",
            notes: editingSupplier.notes ?? "",
            status: editingSupplier.status,
          } : undefined}
          isEditing={!!editingSupplier}
          onCancel={closeForm}
        />
      )}

      <SupplierFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loading ? (
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 text-center shadow-sm">
          <p className="text-[#2f4a62]">{t("suppliers.loading")}</p>
        </div>
      ) : (
        <SupplierTable suppliers={filtered} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}