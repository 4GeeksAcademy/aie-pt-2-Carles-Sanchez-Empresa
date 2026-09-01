"use client";

import { useState } from "react";
import { SUPPLIER_CATEGORIES, COUNTRIES } from "@/lib/constants";

interface SupplierFormData {
  name: string;
  country: string;
  rate_per_shipment: string;
  currency: string;
  categories: string;
  service_zone?: string;
  contact_email?: string;
  notes?: string;
  status: "active" | "suspended";
}

interface NewSupplierFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
  initial?: SupplierFormData;
  isEditing?: boolean;
  onCancel?: () => void;
}

const defaultForm: SupplierFormData = {
  name: "",
  country: "Spain",
  rate_per_shipment: "",
  currency: "EUR",
  categories: "",
  service_zone: "",
  contact_email: "",
  notes: "",
  status: "active",
};

export function NewSupplierForm({ onSubmit, initial, isEditing, onCancel }: NewSupplierFormProps) {
  const [form, setForm] = useState(initial ?? defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (field: keyof SupplierFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!form.name.trim()) { setLocalError("El nombre es obligatorio"); return; }
    if (!form.rate_per_shipment || parseFloat(form.rate_per_shipment) < 0) { setLocalError("Tarifa inválida"); return; }

    setSubmitting(true);
    const ok = await onSubmit({
      name: form.name.trim(),
      country: form.country,
      rate_per_shipment: parseFloat(form.rate_per_shipment),
      currency: form.currency,
      categories: form.categories,
      service_zone: form.service_zone || undefined,
      contact_email: form.contact_email || undefined,
      notes: form.notes || undefined,
      status: form.status,
    });
    setSubmitting(false);

    if (ok) {
      if (!isEditing) setForm(defaultForm);
    } else {
      setLocalError("Error al guardar el proveedor");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-6 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-[#14263a]">{isEditing ? "Editar proveedor" : "Nuevo proveedor"}</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#14263a]">Nombre *</label>
          <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#14263a]">País</label>
          <select value={form.country} onChange={(e) => handleChange("country", e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]">
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#14263a]">Tarifa por envío *</label>
          <input type="number" step="0.01" min="0" value={form.rate_per_shipment} onChange={(e) => handleChange("rate_per_shipment", e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#14263a]">Moneda</label>
          <input type="text" value={form.currency} onChange={(e) => handleChange("currency", e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]" placeholder="EUR" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#14263a]">Categorías</label>
          <select value={form.categories} onChange={(e) => handleChange("categories", e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]">
            <option value="">Seleccionar...</option>
            {SUPPLIER_CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#14263a]">Zona de servicio</label>
          <input type="text" value={form.service_zone ?? ""} onChange={(e) => handleChange("service_zone", e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]" placeholder="Nacional / Internacional" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#14263a]">Email de contacto</label>
          <input type="email" value={form.contact_email ?? ""} onChange={(e) => handleChange("contact_email", e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]" placeholder="proveedor@email.com" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#14263a]">Estado</label>
          <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]">
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#14263a]">Notas</label>
        <textarea value={form.notes ?? ""} onChange={(e) => handleChange("notes", e.target.value)} rows={3} className="w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#14263a]" />
      </div>

      {localError && <p className="text-sm text-red-600">{localError}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="rounded-lg bg-[#14263a] px-6 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50">
          {submitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear proveedor"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-[#c89d66] bg-[#f8fbff] px-6 py-2 text-sm font-medium text-[#14263a] transition hover:bg-[#f3ddba]">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}