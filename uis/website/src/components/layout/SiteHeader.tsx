"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

type HeaderVariant = "home" | "application";

interface SiteHeaderProps {
  variant: HeaderVariant;
}

const navItems = [
  { href: "#inicio", labelKey: "nav.home" },
  { href: "#servicios", labelKey: "nav.services" },
  { href: "#cobertura", labelKey: "nav.coverage" },
  { href: "#contacto", labelKey: "nav.contact" },
];

export function SiteHeader({ variant }: SiteHeaderProps) {
  const { t, lang, setLang } = useTranslation();

  const toggleLang = () => {
    setLang(lang === "es" ? "en" : "es");
  };

  if (variant === "application") {
    return (
      <div className="sticky top-0 z-20">
        <header className="border-b border-[#c89d66] bg-[#f3ddba]">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" aria-label="TrackFlow" className="inline-flex items-center bg-transparent">
              <img
                src="/media/Logo TrackFlow.png"
                alt="Logo TrackFlow"
                className="h-14 w-auto bg-transparent md:h-16"
              />
            </Link>
            <Link
              href="/"
              className="rounded-md border border-[#14263a] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] hover:bg-[#1d4f7a]"
            >
              {t("nav.back_home")}
            </Link>
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-0 overflow-hidden rounded-md border border-[#c89d66] text-xs font-medium transition"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
            >
              <span
                className={`px-2 py-1.5 transition ${
                  lang === "en"
                    ? "bg-[#14263a] text-[#f8fbff]"
                    : "bg-[#f8fbff] text-[#2f4a62] hover:bg-[#e5be83]"
                }`}
              >
                EN
              </span>
              <span
                className={`px-2 py-1.5 transition ${
                  lang === "es"
                    ? "bg-[#14263a] text-[#f8fbff]"
                    : "bg-[#f8fbff] text-[#2f4a62] hover:bg-[#e5be83]"
                }`}
              >
                ES
              </span>
            </button>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-20">
      <header className="border-b border-[#c89d66] bg-[#f3ddba]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <a href="#inicio" aria-label="TrackFlow" className="inline-flex items-center bg-transparent">
            <img
              src="/media/Logo TrackFlow.png"
              alt="Logo TrackFlow"
              className="h-14 w-auto bg-transparent md:h-16"
            />
          </a>

          <div className="flex items-center gap-3">
            <nav aria-label={t("nav.aria_main")} className="hidden md:block">
              <ul className="flex items-center gap-4 text-center text-sm font-medium text-[#2f4a62]">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
                    >
                      {t(item.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Language selector */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-0 overflow-hidden rounded-md border border-[#c89d66] text-xs font-medium transition"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
            >
              <span
                className={`px-2 py-1.5 transition ${
                  lang === "en"
                    ? "bg-[#14263a] text-[#f8fbff]"
                    : "bg-[#f8fbff] text-[#2f4a62] hover:bg-[#e5be83]"
                }`}
              >
                EN
              </span>
              <span
                className={`px-2 py-1.5 transition ${
                  lang === "es"
                    ? "bg-[#14263a] text-[#f8fbff]"
                    : "bg-[#f8fbff] text-[#2f4a62] hover:bg-[#e5be83]"
                }`}
              >
                ES
              </span>
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label={t("nav.aria_mobile")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#c89d66] bg-[#f3ddba] md:hidden"
      >
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-4 gap-1 px-2 py-2 text-center text-xs font-medium text-[#2f4a62]">
          {navItems.map((item) => (
            <li key={`mobile-${item.href}`}>
              <a
                href={item.href}
                className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
              >
                {t(item.labelKey)}
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={toggleLang}
              className="flex w-full items-center justify-center gap-0 overflow-hidden rounded-md text-xs font-medium"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
            >
              <span
                className={`flex-1 px-2 py-2 transition ${
                  lang === "en"
                    ? "bg-[#14263a] text-[#f8fbff]"
                    : "bg-transparent text-[#2f4a62] hover:bg-[#e5be83]"
                }`}
              >
                EN
              </span>
              <span
                className={`flex-1 px-2 py-2 transition ${
                  lang === "es"
                    ? "bg-[#14263a] text-[#f8fbff]"
                    : "bg-transparent text-[#2f4a62] hover:bg-[#e5be83]"
                }`}
              >
                ES
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
