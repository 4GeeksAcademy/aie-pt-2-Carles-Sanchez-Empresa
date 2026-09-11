import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          es: `${SITE_URL}/`,
          en: `${SITE_URL}/`,
        },
      },
    },
    {
      url: `${SITE_URL}/application`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          es: `${SITE_URL}/application`,
          en: `${SITE_URL}/application`,
        },
      },
    },
  ];
}
