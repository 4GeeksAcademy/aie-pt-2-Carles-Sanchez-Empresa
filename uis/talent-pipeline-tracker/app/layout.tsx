import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { AuthGuard } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "TrackFlow — Talent Pipeline Tracker",
  description: "Gestión de candidaturas para procesos de selección",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#c6dced] text-[#2f4a62]">
        <AuthGuard>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#c89d66] bg-[#f3ddba]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[#2f4a62] md:flex-row md:items-center md:justify-between">
              <p>© 2025 TrackFlow. Todos los derechos reservados.</p>
              <a
                href="https://linkedin.com/company/trackflow"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4 hover:text-[#1d4f7a]"
              >
                LinkedIn
              </a>
            </div>
          </footer>
        </AuthGuard>
      </body>
    </html>
  );
}
