import "./globals.css";
import BackofficeClientLayout from "./BackofficeClientLayout";
import ErrorTracker from "@/components/ErrorTracker";

export { metadata } from "./layout.server";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        {/* Resource hints para mejorar entrega de recursos */}
        <link rel="dns-prefetch" href="/" />
        {/* Meta tag para que sea indexable */}
        <meta name="robots" content="index, follow" />
      </head>
      <body className="flex min-h-full flex-col bg-[#c6dced] text-[#2f4a62]">
        <ErrorTracker>
          <BackofficeClientLayout>{children}</BackofficeClientLayout>
        </ErrorTracker>
      </body>
    </html>
  );
}