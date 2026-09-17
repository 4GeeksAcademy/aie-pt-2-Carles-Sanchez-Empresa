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

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import esMessages from "./es";

type Messages = Record<string, string>;

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

/** Cache de módulos de traducción ya cargados */
const loadedModules: Record<string, Messages | undefined> = { es: esMessages };

async function loadMessages(lang: string): Promise<Messages> {
  if (loadedModules[lang]) return loadedModules[lang]!;
  const mod = await import(`./${lang}`);
  loadedModules[lang] = mod.default as Messages;
  return loadedModules[lang]!;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Siempre inicializar con "es" para que SSR y cliente coincidan durante hidratación.
  // La preferencia real del usuario se sincroniza en el useEffect inferior.
  const [lang, setLangState] = useState<string>("es");
  const [messages, setMessages] = useState<Messages>(esMessages);
  const langRef = useRef(lang);
  langRef.current = lang;

  // Sincronizar idioma del navegador en el cliente tras la hidratación.
  useEffect(() => {
    const browserLang = getBrowserLanguage();
    if (browserLang !== lang) {
      setLangState(browserLang);
    }
    loadMessages(browserLang).then(setMessages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((newLang: string) => {
    if (newLang !== "es" && newLang !== "en") return;
    localStorage.setItem("lang", newLang);
    document.documentElement.setAttribute("lang", newLang);
    setLangState(newLang);
    loadMessages(newLang).then(setMessages);
  }, []);

  const t: TranslationFn = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const msg = messages[key] ?? key;
      return formatMessage(msg, vars);
    },
    [messages],
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
