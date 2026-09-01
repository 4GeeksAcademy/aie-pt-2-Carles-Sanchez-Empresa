"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@trackflow/core";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = useMemo(
    () => pathname === "/login" || pathname === "/register",
    [pathname]
  );

  useEffect(() => {
    const token = getToken();

    if (isAuthPage) {
      if (token) {
        router.replace("/");
      }
      return;
    }

    if (!token) {
      const redirect = encodeURIComponent(pathname || "/");
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [isAuthPage, pathname, router]);

  return <>{children}</>;
}