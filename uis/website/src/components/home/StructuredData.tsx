const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TrackFlow",
  description: "Cross-border logistics between the United States and Spain — warehouse management and last-mile delivery for e-commerce",
  url: "https://trackflow.com",
  logo: "https://trackflow.com/media/Logo%20TrackFlow.webp",
  image: "https://trackflow.com/media/Logistica.webp",
  foundingDate: "2009",
  address: [
    {
      "@type": "PostalAddress",
      addressCountry: "US",
      addressLocality: "Los Angeles",
      addressRegion: "CA",
      postalCode: "90001",
      streetAddress: "1000 Warehouse Blvd",
    },
    {
      "@type": "PostalAddress",
      addressCountry: "ES",
      addressLocality: "Zaragoza",
      addressRegion: "Aragón",
      postalCode: "50001",
      streetAddress: "Calle Logística 42",
    },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-213-555-0147",
    contactType: "sales",
    availableLanguage: ["Spanish", "English"],
  },
  sameAs: [
    "https://linkedin.com/company/trackflow",
    "https://twitter.com/trackflow",
    "https://facebook.com/trackflow",
  ],
  areaServed: [
    { "@type": "Country", name: "US" },
    { "@type": "Country", name: "ES" },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TrackFlow",
  url: "https://trackflow.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://trackflow.com/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
