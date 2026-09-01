"use client";

import type { Supplier } from "@/services/api";
import { useTranslation } from "@/lib/i18n";
import { SUPPLIER_CATEGORIES } from "@/lib/constants";

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (s: Supplier) => void;
  onDelete: (id: number) => void;
}

export function SupplierTable({ suppliers, onEdit, onDelete }: SupplierTableProps) {
  const { t, lang } = useTranslation();
  const categoryLabel = (value: string) => {
    const category = SUPPLIER_CATEGORIES.find((item) => item.value === value);
    return category ? t(category.labelKey) : value;
  };
  if (suppliers.length === 0) {
    return (
      <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 text-center shadow-sm">
        <p className="text-[#2f4a62]">{t("suppliers.empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#c89d66] shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#14263a] text-[#f8fbff]">
          <tr>
            <th className="px-4 py-3">{t("suppliers.name")}</th>
            <th className="px-4 py-3">{t("suppliers.country")}</th>
            <th className="px-4 py-3">{t("suppliers.rate")}</th>
            <th className="px-4 py-3">{t("suppliers.categories")}</th>
            <th className="px-4 py-3">{t("suppliers.status")}</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">{t("suppliers.updated")}</th>
            <th className="px-4 py-3 text-right">{t("suppliers.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#c89d66] bg-[#f3ddba]">
          {suppliers.map((s) => (
            <tr key={s.id} className="transition hover:bg-[#f8fbff]">
              <td className="px-4 py-3 font-medium text-[#14263a]">{s.name}</td>
              <td className="px-4 py-3 text-[#2f4a62]">{s.country}</td>
              <td className="px-4 py-3 text-[#2f4a62]">{s.rate_per_shipment} {s.currency}</td>
              <td className="px-4 py-3 text-[#2f4a62]">{s.categories.map(categoryLabel).join(", ")}</td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.status === "active" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                  {t(s.status === "active" ? "suppliers.active" : "suppliers.suspended")}
                </span>
              </td>
              <td className="px-4 py-3 text-[#2f4a62]">{s.contact_email ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-[#2f4a62]">{new Date(s.updated_at).toLocaleDateString(lang)}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onEdit(s)} className="mr-2 rounded bg-[#14263a] px-3 py-1 text-xs font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a]">{t("suppliers.edit")}</button>
                <button onClick={() => onDelete(s.id)} className="rounded bg-red-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-red-800">{t("suppliers.delete")}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}