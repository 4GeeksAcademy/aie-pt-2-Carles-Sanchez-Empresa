import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrackFlow Backoffice - Panel de Administración Logística",
  description: "Panel de administración de TrackFlow. Gestión de inventario, incidencias, proveedores y análisis logístico para tu cadena de suministro.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "TrackFlow Backoffice",
    description: "Panel de administración logística TrackFlow",
    type: "website",
  },
};