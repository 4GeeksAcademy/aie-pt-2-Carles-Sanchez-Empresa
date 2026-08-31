"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import "./globals.css";

// Este panel es 100% cliente (usa localStorage para auth), no prerenderizar
export const dynamic = "force-dynamic";

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#c6dced] text-[#2f4a62]">
        <AuthGuard>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#c89d66] bg-[#f3ddba]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[#2f4a62] md:flex-row md:items-center md:justify-between">
              <p>© 2025 TrackFlow. Todos los derechos reservados.</p>
            </div>
          </footer>
        </AuthGuard>
      </body>
    </html>
  );
}