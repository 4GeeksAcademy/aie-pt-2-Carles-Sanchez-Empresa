"use client";

import { useEffect, useState, useRef } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { LanguageProvider, useTranslation } from "@/lib/i18n";
import { initTelemetry, track } from "@/services/telemetry";

// ── Web Vitals ──
interface WebVitalMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
}

function onWebVital(metric: WebVitalMetric) {
  // O17: web_vital_measured
  track("web_vital_measured", {
    metric_name: metric.name,
    metric_value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    metric_delta: Math.round(metric.delta),
    metric_id: metric.id,
  });
}

function BackofficeContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastPageViewRef = useRef<number>(0);

  // ── Telemetry: page_viewed (navegación) con throttle 30s ──
  useEffect(() => {
    const now = Date.now();
    if (now - lastPageViewRef.current > 30_000) {
      lastPageViewRef.current = now;
      track("page_viewed", {
        page: window.location.pathname,
        referrer: document.referrer || undefined,
      });
    }
  }, []);

  // ── Telemetry: page_load_timed (rendimiento) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Esperar a que la página termine de cargar
    if (document.readyState === "complete") {
      reportPageLoad();
    } else {
      window.addEventListener("load", reportPageLoad, { once: true });
    }
    function reportPageLoad() {
      requestAnimationFrame(() => {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        if (nav) {
          track("page_load_timed", {
            page: window.location.pathname,
            load_time_ms: Math.round(nav.loadEventEnd - nav.startTime),
            ttfb_ms: Math.round(nav.responseStart - nav.requestStart),
          });
        }
      });
    }
  }, []);

  // ── Web Vitals: CLS, LCP, FID, TTFB, INP ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    // PerformanceObserver para CLS, LCP, FID, INP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const entryAny = entry as PerformanceEntry & { value?: number; name?: string };
        if (entryAny.name === "largest-contentful-paint") {
          onWebVital({ name: "LCP", value: entryAny.startTime, delta: entryAny.startTime, id: entryAny.startTime.toString() });
        }
        if (entryAny.name === "first-input") {
          onWebVital({ name: "FID", value: entryAny.startTime, delta: entryAny.startTime, id: entryAny.startTime.toString() });
        }
        if (entryAny.name === "layout-shift" && !(entry as LayoutShift).hadRecentInput) {
          onWebVital({ name: "CLS", value: (entry as LayoutShift).value, delta: (entry as LayoutShift).value, id: entryAny.startTime.toString() });
        }
        if (entryAny.name === "interaction" && entryAny.duration > 0) {
          onWebVital({ name: "INP", value: entryAny.duration, delta: entryAny.duration, id: entryAny.startTime.toString() });
        }
      }
    });

    try {
      observer.observe({ type: "largest-contentful-paint", buffered: true });
      observer.observe({ type: "first-input", buffered: true });
      observer.observe({ type: "layout-shift", buffered: true });
      observer.observe({ type: "event", durationThreshold: 40, buffered: true });
    } catch {
      // Algunos navegadores no soportan todos los tipos
    }

    // TTFB desde Navigation Timing
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (nav) {
      onWebVital({ name: "TTFB", value: nav.responseStart - nav.requestStart, delta: nav.responseStart - nav.requestStart, id: "ttfb" });
    }

    return () => observer.disconnect();
  }, []);

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
  // Inicializar TelemetryService al montar el layout
  useEffect(() => {
    initTelemetry();
  }, []);

  return (
    <LanguageProvider>
      <AuthGuard>
        <BackofficeContent>{children}</BackofficeContent>
      </AuthGuard>
    </LanguageProvider>
  );
}