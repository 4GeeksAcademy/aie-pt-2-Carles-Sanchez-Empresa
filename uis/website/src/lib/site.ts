/** Origen público del sitio; sobreescribible por entorno para previews y staging. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trackflow.com";

export const LOCALES = ["es", "en"] as const;
