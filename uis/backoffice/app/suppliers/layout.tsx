import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Proveedores",
  description:
    "Directorio de proveedores de TrackFlow: alta, edición y filtrado de proveedores logísticos por categoría y estado.",
  alternates: { canonical: "/suppliers" },
  robots: { index: false, follow: false },
};

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}