"use client";

import type { Supplier } from "@/services/api";

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (s: Supplier) => void;
  onDelete: (id: number) => void;
}

export function SupplierTable({ suppliers, onEdit, onDelete }: SupplierTableProps) {
  if (suppliers.length === 0) {
    return (
      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 text-center shadow-sm">
        <p className="text-[#2f4a62]">No hay proveedores que coincidan con los filtros.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#c89d66] shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#14263a] text-[#f8fbff]">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">País</th>
            <th className="px-4 py-3">Tarifa</th>
            <th className="px-4 py-3">Categorías</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Actualizado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#c89d66] bg-[#f3ddba]">
          {suppliers.map((s) => (
            <tr key={s.id} className="transition hover:bg-[#f8fbff]">
              <td className="px-4 py-3 font-medium text-[#14263a]">{s.name}</td>
              <td className="px-4 py-3 text-[#2f4a62]">{s.country}</td>
              <td className="px-4 py-3 text-[#2f4a62]">{s.rate_per_shipment} {s.currency}</td>
              <td className="px-4 py-3 text-[#2f4a62]">{s.categories}</td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.status === "active" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                  {s.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[#2f4a62]">{s.contact_email ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-[#2f4a62]">{new Date(s.updated_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onEdit(s)} className="mr-2 rounded bg-[#14263a] px-3 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">Editar</button>
                <button onClick={() => onDelete(s.id)} className="rounded bg-red-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-800">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}