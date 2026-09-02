"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/services/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isAuthPage = useMemo(
    () =>
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password",
    [pathname],
  );

  useEffect(() => {
    const token = getToken();

    if (isAuthPage) {
      if (token) {
        router.replace("/");
        return;
      }
      // En páginas de auth sin token, se permite mostrar el contenido
      setIsAuthorized(true);
      return;
    }

    if (!token) {
      const redirect = encodeURIComponent(pathname || "/");
      router.replace(`/login?redirect=${redirect}`);
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  }, [isAuthPage, pathname, router]);

  // Mientras se determina el estado de autenticación, no renderizar nada
  // para evitar el flash de contenido sensible.
  if (!isAuthorized && !isAuthPage) return null;

  return <>{children}</>;
}
