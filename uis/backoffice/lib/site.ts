/** Origen público del backoffice; sobreescribible por entorno para previews y staging. */
export const SITE_URL = process.env.NEXT_PUBLIC_BACKOFFICE_URL ?? "https://backoffice.trackflow.com";

export const LOCALES = ["es", "en"] as const;
