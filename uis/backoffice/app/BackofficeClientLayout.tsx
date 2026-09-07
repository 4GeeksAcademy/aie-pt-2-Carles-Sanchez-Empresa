"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { LanguageProvider, useTranslation } from "@/lib/i18n";

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

export default function BackofficeClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthGuard>
        <BackofficeContent>{children}</BackofficeContent>
      </AuthGuard>
    </LanguageProvider>
  );
}