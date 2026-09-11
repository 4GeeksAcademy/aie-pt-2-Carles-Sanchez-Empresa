import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Inventario multi-almacén",
  description:
    "Gestión de inventario de TrackFlow: stock por almacén en Los Ángeles y Zaragoza, entradas, salidas y movimientos de productos de moda, electrónica, hogar y cosmética.",
  alternates: { canonical: "/inventory" },
  robots: { index: false, follow: false },
};

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}