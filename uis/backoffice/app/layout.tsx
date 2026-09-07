import "./globals.css";
import { BackofficeClientLayout } from "./BackofficeClientLayout";

export const dynamic = "force-dynamic";

export function reportWebVitals() {}

export { metadata } from "./layout.server";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#c6dced] text-[#2f4a62]">
        <BackofficeClientLayout>{children}</BackofficeClientLayout>
      </body>
    </html>
  );
}