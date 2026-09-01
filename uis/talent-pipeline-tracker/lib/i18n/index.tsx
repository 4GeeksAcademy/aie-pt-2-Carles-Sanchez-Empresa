"use client";

/**
 * i18n/index.tsx — Sistema de internacionalización para el Talent Pipeline Tracker.
 *
 * Uso:
 *   const { t } = useTranslation();
 *   <h1>{t("candidates.title")}</h1>
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import es from "./es";
import en from "./en";

type Messages = Record<string, string>;

const messages: Record<string, Messages> = { es, en };

function getBrowserLanguage(): string {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem("lang");
  if (stored && (stored === "es" || stored === "en")) return stored;
  const html = document.documentElement.getAttribute("lang");
  if (html === "en") return "en";
  return "es";
}

function formatMessage(msg: string, vars?: Record<string, string | number>): string {
  if (!vars) return msg;
  return msg.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export interface TranslationFn {
  (key: string): string;
  (key: string, vars: Record<string, string | number>): string;
}

interface LanguageContextValue {
  t: TranslationFn;
  lang: string;
  setLang: (newLang: string) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Store externo: el idioma vive en localStorage y se comparte entre pestañas.
const listeners = new Set<() => void>();

function subscribeLang(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(
    subscribeLang,
    getBrowserLanguage,
    () => "es",
  );

  const setLang = useCallback((newLang: string) => {
    if (newLang !== "es" && newLang !== "en") return;
    localStorage.setItem("lang", newLang);
    listeners.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const value = useMemo<LanguageContextValue>(() => {
    const t: TranslationFn = (key: string, vars?: Record<string, string | number>): string => {
      const msg = messages[lang]?.[key] ?? messages["es"]?.[key] ?? key;
      return formatMessage(msg, vars);
    };
    return { t, lang, setLang };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation debe usarse dentro de <LanguageProvider>");
  return ctx;
}