/**
 * i18n/index.tsx — Sistema de internacionalización para el backoffice Next.js.
 *
 * Proporciona un hook `useTranslation()` que lee el idioma desde:
 *   1. localStorage -> "lang"
 *   2. Etiqueta <html lang="...">
 *   3. Por defecto "es"
 *
 * Uso:
 *   const { t } = useTranslation();
 *   <h1>{t("auth.login.title")}</h1>
 */

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

interface I18nContextValue {
  t: TranslationFn;
  lang: string;
  setLang: (lang: string) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>("es");

  const setLang = useCallback((newLang: string) => {
    if (newLang !== "es" && newLang !== "en") return;
    localStorage.setItem("lang", newLang);
    document.documentElement.setAttribute("lang", newLang);
    setLangState(newLang);
  }, []);

  useEffect(() => {
    setLangState(getBrowserLanguage());
  }, []);

  const t: TranslationFn = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const msg = messages[lang]?.[key] ?? messages["es"]?.[key] ?? key;
      return formatMessage(msg, vars);
    },
    [lang],
  );

  const value = useMemo(() => ({ t, lang, setLang }), [t, lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return context;
}
