"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@trackflow/core";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);

  const redirectsWhenAuthenticated = pathname === "/login" || pathname === "/register";
  const isPublicAuthPage =
    redirectsWhenAuthenticated || pathname === "/forgot-password" || pathname === "/reset-password";

  useEffect(() => {
    const token = getToken();

    if (isPublicAuthPage) {
      if (token && redirectsWhenAuthenticated) {
        setCanRender(false);
        router.replace("/");
      } else {
        setCanRender(true);
      }
      return;
    }

    if (!token) {
      setCanRender(false);
      const redirect = encodeURIComponent(pathname || "/");
      router.replace(`/login?redirect=${redirect}`);
      return;
    }

    setCanRender(true);
  }, [isPublicAuthPage, pathname, redirectsWhenAuthenticated, router]);

  if (!canRender) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#c6dced] p-6">
        <p className="text-sm font-medium text-[#2f4a62]">Cargando...</p>
      </div>
    );
  }

  return <>{children}</>;
}