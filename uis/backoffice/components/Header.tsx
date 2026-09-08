"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getToken } from "@trackflow/core/services/auth";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

interface Props {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: Props) {
  const { lang, setLang } = useTranslation();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";
  const [mounted, setMounted] = useState(false);

  // Leer token SÍNCRONAMENTE para que showAuth sea correcto desde el
  // primer render y el botón hamburguesa no aparezca después causando CLS.
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getToken();
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAuth = mounted && !!token;
  // El botón siempre está en el DOM; cuando no corresponde es invisible
  // pero ocupa su espacio (40px) para evitar layout shift.
  const hamburgerClasses = `rounded-lg p-2 transition-colors ${
    showAuth
      ? 'text-[#2f4a62] hover:bg-[#e5be83]'
      : 'invisible pointer-events-none'
  }`;

  return (
    <header className="border-b border-[#c89d66] bg-[#f3ddba]" aria-label="Encabezado del panel">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className={hamburgerClasses}
            aria-label="Toggle sidebar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="inline-flex items-center bg-transparent">
            <Image
              src="/Logo TrackFlow.webp"
              alt="TrackFlow"
              width={112}
              height={56}
              // Sin w-auto: las dimensiones intrínsecas (112x56) evitan CLS
              className="h-14 md:h-16 bg-transparent"
              priority
            />
          </Link>
        </div>

        <LanguageSelector lang={lang} setLang={setLang} />
      </div>
    </header>
  );
}

function LanguageSelector({ lang, setLang }: { lang: string; setLang: (lang: string) => void }) {
  return (
    <div className="inline-flex shrink-0 items-center rounded-md border border-[#c89d66] bg-[#f8fbff] p-1 text-xs font-semibold" aria-label="Language selector">
      {(["en", "es"] as const).map((option, index) => (
        <span key={option} className="inline-flex items-center">
          {index > 0 && <span className="px-1 text-[#c89d66]">|</span>}
          <button
            type="button"
            onClick={() => setLang(option)}
            className={`rounded px-2 py-1 transition-colors ${lang === option ? "bg-[#14263a] text-white" : "text-[#2f4a62] hover:bg-[#e5be83]"}`}
            aria-pressed={lang === option}
            aria-label={option === "es" ? "Cambiar idioma a español" : "Cambiar idioma a inglés"}
          >
            {option.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
