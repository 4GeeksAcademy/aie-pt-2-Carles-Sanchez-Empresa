import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitud de servicio logístico",
  description:
    "Solicita una propuesta de almacenamiento, última milla o logística inversa para tu marca de moda, electrónica, hogar o cosmética en Estados Unidos y España.",
  alternates: {
    canonical: "/application",
    languages: { es: "/application", en: "/application", "x-default": "/application" },
  },
  openGraph: {
    type: "website",
    url: "/application",
    title: "Solicitud de servicio logístico | TrackFlow",
    description:
      "Cuéntanos tu operativa y te preparamos una propuesta de fulfillment entre Los Ángeles y Zaragoza.",
  },
};

export default function ApplicationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
