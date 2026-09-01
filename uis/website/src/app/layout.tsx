import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackFlow — Logística Inteligente",
  description:
    "Logística transfronteriza entre Estados Unidos y España — Almacenaje, entregas de última milla y logística inversa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#c6dced] text-[#2f4a62] min-h-full">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}