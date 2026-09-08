import "./globals.css";
import BackofficeClientLayout from "./BackofficeClientLayout";

export { metadata } from "./layout.server";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        {/* Preconnect a recursos críticos para reducir latencia */}
        <link rel="preconnect" href="/" crossOrigin="anonymous" />
        {/* Preload del logo para LCP */}
        <link rel="preload" href="/Logo TrackFlow.webp" as="image" type="image/webp" fetchPriority="high" />
        {/* Resource hints para mejorar entrega de recursos */}
        <link rel="dns-prefetch" href="/" />
        {/* Meta tag para que sea indexable */}
        <meta name="robots" content="index, follow" />
      </head>
      {/* suppressHydrationWarning evita warnings por la diferencia entre
          renderizado SSR (sin token) e hidratación cliente (con token) */}
      <body className="flex min-h-full flex-col bg-[#c6dced] text-[#2f4a62]" suppressHydrationWarning>
        <BackofficeClientLayout>{children}</BackofficeClientLayout>
      </body>
    </html>
  );
}