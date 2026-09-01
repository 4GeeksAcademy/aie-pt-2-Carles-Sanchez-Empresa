"use client";

import { SUPPLIER_CATEGORIES } from "@/lib/constants";

interface SupplierFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
}

export function SupplierFilters({ search, onSearchChange, categoryFilter, onCategoryFilterChange, statusFilter, onStatusFilterChange }: SupplierFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs font-medium text-[#14263a]">Buscar</label>
        <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Nombre / email..." className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]" />
      </div>
      <div className="min-w-[150px]">
        <label className="mb-1 block text-xs font-medium text-[#14263a]">Categoría</label>
        <select value={categoryFilter} onChange={(e) => onCategoryFilterChange(e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]">
          <option value="">Todas</option>
          {SUPPLIER_CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
        </select>
      </div>
      <div className="min-w-[120px]">
        <label className="mb-1 block text-xs font-medium text-[#14263a]">Estado</label>
        <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]">
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
        </select>
      </div>
    </div>
  );
}