import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackFlow",
  description: "Cross-border logistics between the United States and Spain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#c6dced] text-[#2f4a62] min-h-full">
        <LanguageProvider>
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}