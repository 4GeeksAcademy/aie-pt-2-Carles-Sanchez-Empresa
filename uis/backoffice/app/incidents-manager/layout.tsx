import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gestor de incidencias",
  description:
    "Gestor de incidencias de TrackFlow: registro, seguimiento y resumen de incidencias de transportes B2B y B2C.",
  alternates: { canonical: "/incidents-manager" },
  robots: { index: false, follow: false },
};

export default function IncidentsManagerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}