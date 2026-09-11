import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Análisis de incidencias",
  description:
    "Analizador de incidencias de transportistas de TrackFlow. Importa CSV, visualiza métricas y KPIs de calidad del servicio de los carriers (UPS, FedEx, MRW, SEUR).",
  alternates: { canonical: "/incidents" },
  robots: { index: false, follow: false },
};

export default function IncidentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}