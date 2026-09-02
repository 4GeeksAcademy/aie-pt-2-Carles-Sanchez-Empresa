import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { AuthGuard } from "@/components/AuthGuard";
import { Footer } from "./Footer";
import es from "@/lib/i18n/es";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: es["app.meta.title"],
  description: es["app.meta.description"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#c6dced] text-[#2f4a62]">
        <LanguageProvider>
          <AuthGuard>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthGuard>
        </LanguageProvider>
      </body>
    </html>
  );
}
