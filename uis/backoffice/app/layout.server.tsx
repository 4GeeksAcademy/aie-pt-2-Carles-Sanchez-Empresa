import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrackFlow Backoffice — Panel de Administración Logística",
    template: "%s | TrackFlow Backoffice",
  },
  description:
    "Panel de administración de TrackFlow. Gestión de inventario multi-almacén, incidencias de transportistas, proveedores y análisis logístico entre Los Ángeles y Zaragoza.",
  applicationName: "TrackFlow Backoffice",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: "/",
    languages: { es: "/", en: "/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    siteName: "TrackFlow Backoffice",
    locale: "es_ES",
    alternateLocale: "en_US",
    url: "/",
    title: "TrackFlow Backoffice — Panel de Administración Logística",
    description:
      "Inventario, incidencias, proveedores y analítica logística de TrackFlow en una única consola.",
    images: [{ url: "/Logo TrackFlow.webp", width: 112, height: 56, alt: "TrackFlow" }],
  },
  twitter: {
    card: "summary",
    title: "TrackFlow Backoffice",
    description: "Panel de administración logística de TrackFlow.",
  },
};
