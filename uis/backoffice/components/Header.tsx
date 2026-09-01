"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getToken, logout } from "@trackflow/core";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

interface HeaderLink {
  href: string;
  labelKey: string;
}

export function Header() {
  const { t, lang, setLang } = useTranslation();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const [mounted, setMounted] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);

  const toggleLang = () => {
    setLang(lang === "es" ? "en" : "es");
  };

  const protectedLinks: HeaderLink[] = [
    { href: "/", labelKey: "nav.dashboard" },
    { href: "/suppliers", labelKey: "nav.suppliers" },
    { href: "/incidents", labelKey: "nav.analyzer" },
    { href: "/incidents-manager", labelKey: "nav.manager" },
  ];

  useEffect(() => {
    setMounted(true);
    setTokenState(getToken());
  }, [pathname]);

  // Durante SSR y primer render en cliente mostramos siempre la versión no-auth
  // para evitar errores de hydratación por diferencias en localStorage
  const showAuth = mounted && !!token;

  if (isAuthPage) {
    return (
      <header className="border-b border-[#c89d66] bg-[#f3ddba]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex items-center bg-transparent">
            <Image
              src="/Logo TrackFlow.png"
              alt="TrackFlow"
              width={112}
              height={56}
              className="h-14 w-auto md:h-16 bg-transparent"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={toggleLang}
            className="rounded-md border border-[#c89d66] bg-[#f8fbff] px-2.5 py-1.5 text-xs font-medium text-[#2f4a62] hover:bg-[#e5be83] transition"
            aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-[#c89d66] bg-[#f3ddba]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="inline-flex items-center bg-transparent">
            <Image
              src="/Logo TrackFlow.png"
              alt="TrackFlow"
              width={112}
              height={56}
              className="h-14 w-auto md:h-16 bg-transparent"
              priority
            />
          </Link>
          {showAuth && (
            <nav className="hidden md:flex items-center gap-2">
              {protectedLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#14263a] text-[#f8fbff]"
                        : "text-[#2f4a62] hover:bg-[#e5be83] hover:text-[#14263a]"
                    }`}
                  >
                    {t(link.labelKey)}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {showAuth && (
          <div className="flex items-center gap-2">
            <Link
              href="/account/profile"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#2f4a62] hover:bg-[#e5be83] hover:text-[#14263a] transition"
            >
              👤 {t("nav.profile")}
            </Link>
            <button
              onClick={() => logout()}
              className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-500/30 transition"
            >
              🚪 {t("nav.logout")}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={toggleLang}
          className="rounded-md border border-[#c89d66] bg-[#f8fbff] px-2.5 py-1.5 text-xs font-medium text-[#2f4a62] hover:bg-[#e5be83] transition"
          aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
        >
          {lang === "es" ? "EN" : "ES"}
        </button>
      </div>
    </header>
  );
}