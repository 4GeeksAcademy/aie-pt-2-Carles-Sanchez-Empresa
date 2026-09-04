"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { LanguageProvider, useTranslation } from "@/lib/i18n";
import "./globals.css";

// Este panel es 100% cliente (usa localStorage para auth), no prerenderizar
export const dynamic = "force-dynamic";

// Previene un bug de Next.js 16.3.0 donde web-vitals intenta acceder a
// startTime de un objeto undefined. No-op seguro.
export function reportWebVitals() {}

function BackofficeContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[#c89d66] bg-[#f3ddba]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[#2f4a62] md:flex-row md:items-center md:justify-between">
          <p>{t("app.footer.copyright")}</p>
        </div>
      </footer>
    </>
  );
}

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#c6dced] text-[#2f4a62]">
        <LanguageProvider>
          <AuthGuard>
            <BackofficeContent>{children}</BackofficeContent>
          </AuthGuard>
        </LanguageProvider>
      </body>
    </html>
  );
}