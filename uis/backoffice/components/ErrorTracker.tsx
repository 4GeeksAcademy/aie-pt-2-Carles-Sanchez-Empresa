"use client";

import { Component, useEffect, type ReactNode } from "react";
import { track } from "@/services/telemetry";

// ═══════════════════════════════════════════════════════════
// Error Boundary — Captura errores en componentes React
// ═══════════════════════════════════════════════════════════

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Sanitiza un string: elimina posibles PII (emails, teléfonos)
 * para no enviar datos personales en eventos de telemetría.
 */
function sanitizeMessage(msg: string): string {
  return msg
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
    .replace(/\+?\d{1,4}[ -]?\(?\d{1,4}\)?[ -]?\d{1,4}[ -]?\d{1,4}[ -]?\d{1,4}/g, "[PHONE_REDACTED]");
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    const msg = sanitizeMessage(error.message || String(error)).slice(0, 200);
    track("frontend_error_captured", {
      error_type: error.name || "Error",
      error_message_safe: msg,
      page: typeof window !== "undefined" ? window.location.pathname : "unknown",
      stack_trace: !!error.stack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#c6dced] p-6">
          <div className="max-w-md rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm text-center">
            <h2 className="text-xl font-bold text-[#14263a]">Algo salió mal</h2>
            <p className="mt-2 text-sm text-[#2f4a62]">
              Ocurrió un error inesperado. El equipo técnico ha sido notificado.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-[#14263a] px-6 py-2 text-sm font-semibold text-[#f8fbff] hover:bg-[#1d4f7a]"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════
// GlobalErrorListeners — window.onerror + unhandledrejection
// ═══════════════════════════════════════════════════════════

function GlobalErrorListeners() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = sanitizeMessage(event.message || String(event.error)).slice(0, 200);
      track("frontend_error_captured", {
        error_type: event.error?.name || "Error",
        error_message_safe: msg,
        page: window.location.pathname,
        stack_trace: !!event.error?.stack,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = sanitizeMessage(String(event.reason)).slice(0, 200);
      track("frontend_error_captured", {
        error_type: "UnhandledRejection",
        error_message_safe: msg,
        page: window.location.pathname,
        stack_trace: false,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}

// ═══════════════════════════════════════════════════════════
// WebVitalsReporter — reportWebVitals para métricas de Core Web Vitals
// ═══════════════════════════════════════════════════════════

export function reportWebVitals(metric: {
  name: string;
  value: number;
  rating?: string;
  id?: string;
}): void {
  track("web_vital_measured", {
    name: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating || "unknown",
    page: typeof window !== "undefined" ? window.location.pathname : "unknown",
    metric_id: metric.id,
  });
}

// ═══════════════════════════════════════════════════════════
// ErrorTracker — Componente combinado que envuelve la app
// ═══════════════════════════════════════════════════════════

export default function ErrorTracker({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <GlobalErrorListeners />
      {children}
    </ErrorBoundary>
  );
}