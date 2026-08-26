const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TrackFlow",
  description: "Gestión de almacenes y entregas de última milla para e-commerce",
  url: "https://trackflow.com",
  foundingDate: "2009",
  address: [
    {
      "@type": "PostalAddress",
      addressCountry: "US",
      addressLocality: "Los Ángeles",
      addressRegion: "California",
    },
    {
      "@type": "PostalAddress",
      addressCountry: "ES",
      addressLocality: "Zaragoza",
      addressRegion: "Aragón",
    },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-213-555-0147",
    contactType: "sales",
    availableLanguage: ["Spanish", "English"],
  },
  sameAs: ["https://linkedin.com/company/trackflow"],
  areaServed: [
    { "@type": "Country", name: "US" },
    { "@type": "Country", name: "ES" },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
}
