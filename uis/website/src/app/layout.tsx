import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LanguageProvider } from "@/lib/i18n";
import { StructuredData } from "@/components/home/StructuredData";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrackFlow — Logística y almacenes entre EE. UU. y España",
    template: "%s | TrackFlow",
  },
  description:
    "Transporte, mensajería y almacenes en Los Ángeles y Zaragoza. Gestionamos inventario, última milla y devoluciones de moda, electrónica, hogar y cosmética para marcas B2B y B2C.",
  applicationName: "TrackFlow",
  keywords: [
    "logística",
    "almacenes",
    "última milla",
    "mensajería",
    "logística inversa",
    "fulfillment e-commerce",
    "Los Ángeles",
    "Zaragoza",
    "B2B",
    "B2C",
  ],
  authors: [{ name: "TrackFlow" }],
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
    siteName: "TrackFlow",
    locale: "es_ES",
    alternateLocale: "en_US",
    url: "/",
    title: "TrackFlow — Logística y almacenes entre EE. UU. y España",
    description:
      "Almacenamiento, preparación de pedidos, última milla y logística inversa para marcas de e-commerce en Estados Unidos y España.",
    images: [{ url: "/media/Logistica.webp", width: 1000, height: 667, alt: "Operativa logística de TrackFlow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackFlow — Logística y almacenes entre EE. UU. y España",
    description:
      "Almacenamiento, última milla y logística inversa para marcas de e-commerce en Estados Unidos y España.",
    images: ["/media/Logistica.webp"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#c6dced] text-[#2f4a62] min-h-full">
        <StructuredData />
        <LanguageProvider>
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}