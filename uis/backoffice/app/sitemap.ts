import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Solo rutas públicas: las vistas operativas viven tras AuthGuard y no deben rastrearse. */
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1 : 0.5,
  }));
}
