import { SITE_URL } from "@/lib/site";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Verticales de producto que TrackFlow almacena y distribuye. */
const PRODUCT_VERTICALS = [
  { es: "Moda", en: "Fashion" },
  { es: "Electrónica", en: "Electronics" },
  { es: "Hogar", en: "Home" },
  { es: "Cosmética", en: "Cosmetics" },
];

const openingHours = {
  "@type": "OpeningHoursSpecification",
  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  opens: "08:00",
  closes: "20:00",
};

const losAngelesWarehouse = {
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#warehouse-los-angeles`,
  name: "TrackFlow Los Angeles",
  description:
    "Warehouse and last-mile fulfilment hub serving the United States market for fashion, electronics, home and cosmetics brands.",
  parentOrganization: { "@id": ORGANIZATION_ID },
  telephone: "+1-213-555-0147",
  priceRange: "$$",
  currenciesAccepted: "USD",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1000 Warehouse Blvd",
    addressLocality: "Los Angeles",
    addressRegion: "CA",
    postalCode: "90001",
    addressCountry: "US",
  },
  geo: { "@type": "GeoCoordinates", latitude: 34.0522, longitude: -118.2437 },
  openingHoursSpecification: [openingHours],
  areaServed: { "@type": "Country", name: "US" },
};

const zaragozaWarehouse = {
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#warehouse-zaragoza`,
  name: "TrackFlow Zaragoza",
  description:
    "Centro logístico y de última milla que da servicio al mercado español para marcas de moda, electrónica, hogar y cosmética.",
  parentOrganization: { "@id": ORGANIZATION_ID },
  telephone: "+34-976-555-0147",
  priceRange: "$$",
  currenciesAccepted: "EUR",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Calle Logística 42",
    addressLocality: "Zaragoza",
    addressRegion: "Aragón",
    postalCode: "50001",
    addressCountry: "ES",
  },
  geo: { "@type": "GeoCoordinates", latitude: 41.6488, longitude: -0.8891 },
  openingHoursSpecification: [openingHours],
  areaServed: { "@type": "Country", name: "ES" },
};

const services = [
  {
    "@type": "Service",
    name: "Warehousing & inventory management",
    serviceType: "Warehousing",
    description:
      "Multi-warehouse storage and real-time inventory management across Los Angeles and Zaragoza.",
  },
  {
    "@type": "Service",
    name: "Last-mile delivery",
    serviceType: "Courier service",
    description:
      "Order picking, packing and last-mile delivery through a network of eight carriers in the US and Spain.",
  },
  {
    "@type": "Service",
    name: "Reverse logistics",
    serviceType: "Returns management",
    description: "Returns triage, pickup, refurbishment and disposal for e-commerce brands.",
  },
  {
    "@type": "Service",
    name: "Freight forwarding",
    serviceType: "Freight forwarding",
    description: "Cross-border shipping between the United States and Spain.",
  },
].map((service) => ({
  ...service,
  provider: { "@id": ORGANIZATION_ID },
  areaServed: [
    { "@type": "Country", name: "US" },
    { "@type": "Country", name: "ES" },
  ],
  audience: [
    { "@type": "BusinessAudience", audienceType: "B2B" },
    { "@type": "Audience", audienceType: "B2C" },
  ],
}));

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "MovingCompany"],
  "@id": ORGANIZATION_ID,
  name: "TrackFlow",
  legalName: "TrackFlow",
  description:
    "Cross-border logistics between the United States and Spain — warehousing, last-mile delivery and reverse logistics for fashion, electronics, home and cosmetics e-commerce brands, B2B and B2C.",
  url: SITE_URL,
  logo: `${SITE_URL}/media/Logo%20TrackFlow.webp`,
  image: `${SITE_URL}/media/Logistica.webp`,
  foundingDate: "2009",
  foundingLocation: {
    "@type": "Place",
    address: { "@type": "PostalAddress", addressLocality: "Los Angeles", addressCountry: "US" },
  },
  numberOfEmployees: { "@type": "QuantitativeValue", value: 130 },
  knowsLanguage: ["es", "en"],
  location: [losAngelesWarehouse, zaragozaWarehouse],
  address: [losAngelesWarehouse.address, zaragozaWarehouse.address],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+1-213-555-0147",
      contactType: "sales",
      areaServed: ["US", "ES"],
      availableLanguage: ["Spanish", "English"],
    },
    {
      "@type": "ContactPoint",
      telephone: "+34-976-555-0147",
      contactType: "customer support",
      areaServed: ["ES"],
      availableLanguage: ["Spanish", "English"],
    },
  ],
  sameAs: [
    "https://linkedin.com/company/trackflow",
    "https://twitter.com/trackflow",
    "https://facebook.com/trackflow",
  ],
  areaServed: [
    { "@type": "Country", name: "US" },
    { "@type": "Country", name: "ES" },
  ],
  makesOffer: services.map((service) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: service.name },
  })),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Product verticals handled",
    itemListElement: PRODUCT_VERTICALS.map((vertical) => ({
      "@type": "OfferCatalog",
      name: vertical.en,
      alternateName: vertical.es,
    })),
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "TrackFlow",
  url: SITE_URL,
  inLanguage: ["es", "en"],
  publisher: { "@id": ORGANIZATION_ID },
};

const servicesSchema = {
  "@context": "https://schema.org",
  "@graph": services,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
    </>
  );
}
