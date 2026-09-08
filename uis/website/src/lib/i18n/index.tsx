/**
 * i18n/index.tsx — Sistema de internacionalización para el website de TrackFlow.
 *
 * Proporciona un LanguageProvider (contexto) para compartir el estado del idioma
 * entre todos los componentes, y un hook useTranslation() para consumirlo.
 *
 * Uso:
 *   const { t, lang, setLang } = useTranslation();
 *   <h1>{t("nav.home")}</h1>
 */

"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

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

interface LanguageContextValue {
  lang: string;
  setLang: (lang: string) => void;
  t: TranslationFn;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Cache de módulos de traducción ya cargados */
const loadedModules: Record<string, Messages | undefined> = {};

async function loadMessages(lang: string): Promise<Messages> {
  if (loadedModules[lang]) return loadedModules[lang]!;
  const mod = await import(`./${lang}`);
  loadedModules[lang] = mod.default as Messages;
  return loadedModules[lang]!;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>(getBrowserLanguage);
  const [messages, setMessages] = useState<Messages | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    loadMessages(lang).then(setMessages);
  }, [lang]);

  const setLang = useCallback((newLang: string) => {
    if (newLang !== "es" && newLang !== "en") return;
    localStorage.setItem("lang", newLang);
    document.documentElement.setAttribute("lang", newLang);
    setLangState(newLang);
  }, []);

  const t: TranslationFn = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const msgs = messages ?? loadedModules["es"] ?? {};
      const msg = msgs[key] ?? (loadedModules["es"]?.[key]) ?? key;
      return formatMessage(msg, vars);
    },
    [messages],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a <LanguageProvider>");
  }
  return ctx;
}