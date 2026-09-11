"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@trackflow/core/services/auth";
import { useTranslation } from "@/lib/i18n";
import { track } from "@/services/telemetry";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  // Leer token SÍNCRONAMENTE para evitar loading flash y CLS.
  // En SSR (window=undefined) devuelve null; en hidratación cliente
  // devuelve el token real si existe.
  const [canRender] = useState(() => {
    if (typeof window === "undefined") return "loading";
    const token = getToken();
    if (!token) return "redirect";
    return "ok";
  });

  const redirectsWhenAuthenticated = pathname === "/login" || pathname === "/register";
  const isPublicAuthPage =
    redirectsWhenAuthenticated || pathname === "/forgot-password" || pathname === "/reset-password";

  useEffect(() => {
    const token = getToken();

    if (isPublicAuthPage) {
      if (token && redirectsWhenAuthenticated) {
        router.replace("/");
      }
      return;
    }

    if (!token) {
      // O9: session_expired — detectar cuando el token no existe
      track("session_expired", {
        expired_at: new Date().toISOString(),
        token_age_minutes: 0, // No tenemos acceso al token expirado
        operation_attempted: pathname || "unknown",
      });
      const redirect = encodeURIComponent(pathname || "/");
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [isPublicAuthPage, pathname, redirectsWhenAuthenticated, router]);

  // En páginas protegidas con token → renderizar AL INSTANTE (sin CLS)
  if (!isPublicAuthPage) {
    if (canRender === "ok") return <>{children}</>;
    // SSR o sin token: mostrar loading (raro porque useEffect redirige rápido)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#c6dced] p-6">
        <p className="text-sm font-medium text-[#2f4a62]">{t("app.loading")}</p>
      </div>
    );
  }

  return <>{children}</>;
}