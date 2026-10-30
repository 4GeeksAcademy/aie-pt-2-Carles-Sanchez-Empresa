"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken } from "@trackflow/core/services/auth";
import { useTranslation } from "@/lib/i18n";
import { track } from "@/services/telemetry";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  // Estado inicial siempre "loading" para coincidir con SSR (evita hydration mismatch).
  // Se resuelve en useEffect justo después de la hidratación.
  const [authorizedPath, setAuthorizedPath] = useState<string | null>(null);

  const redirectsWhenAuthenticated = pathname === "/login" || pathname === "/register";
  const isPublicAuthPage =
    redirectsWhenAuthenticated || pathname === "/forgot-password" || pathname === "/reset-password";

  useEffect(() => {
    if (isPublicAuthPage) {
      const token = getToken();
      if (token && redirectsWhenAuthenticated) {
        router.replace("/");
      }
      setAuthorizedPath(pathname);
      return;
    }

    let cancelled = false;
    setAuthorizedPath(null);
    const token = getToken();
    const redirectToLogin = (expired: boolean) => {
      if (cancelled) return;
      clearToken();
      if (expired) {
        track("session_expired", {
          expired_at: new Date().toISOString(),
          token_age_minutes: 0,
          operation_attempted: pathname || "unknown",
        });
      }
      const redirect = encodeURIComponent(pathname || "/");
      router.replace(`/login?redirect=${redirect}${expired ? "&reason=session_expired" : ""}`);
    };

    if (!token) {
      redirectToLogin(false);
      return () => { cancelled = true; };
    }

    // Token presence alone is insufficient: it may be expired, revoked,
    // malformed, or belong to a deleted/disabled account.
    void fetch("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).then((response) => {
      if (!response.ok) throw new Error("Session is not valid");
      if (!cancelled) setAuthorizedPath(pathname);
    }).catch(() => redirectToLogin(true));

    return () => { cancelled = true; };
  }, [isPublicAuthPage, pathname, redirectsWhenAuthenticated, router]);

  // En páginas protegidas con token → renderizar AL INSTANTE (sin CLS)
  if (!isPublicAuthPage) {
    if (authorizedPath === pathname) return <>{children}</>;
    // SSR o hidratación: mostrar loading breve hasta resolver auth
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#c6dced] p-6">
        <p className="text-sm font-medium text-[#2f4a62]">{t("app.loading")}</p>
      </div>
    );
  }

  return <>{children}</>;
}