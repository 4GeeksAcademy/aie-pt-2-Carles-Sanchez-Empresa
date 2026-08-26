export const en = {
  /* ───── SiteHeader ───── */
  header: {
    inicio: "Home",
    servicios: "Services",
    cobertura: "Coverage",
    contacto: "Contact",
    solicitarInfo: "Request information",
  },

  /* ───── Hero ───── */
  hero: {
    title: "Logistics that scales with your e-commerce",
    description:
      "Warehouse management, last-mile delivery, and reverse logistics in the United States and Spain. Over 15 years helping fashion, electronics, and cosmetics brands grow without worrying about operations.",
    cta: "Request information",
  },

  /* ───── Services section ───── */
  services: {
    title: "Services",
    warehouse: {
      title: "Warehouse Management",
      points: [
        "Storage, picking and packing",
        "Real-time inventory",
        "We operate warehouses in Los Angeles and Zaragoza",
      ],
      imgAlt: "Warehouse Management",
    },
    lastMile: {
      title: "Last-Mile Delivery",
      points: [
        "Certified carrier network in both countries",
        "Unified shipment tracking",
        "Incident and returns management",
      ],
      imgAlt: "Last-Mile Delivery",
    },
    reverse: {
      title: "Reverse Logistics",
      points: [
        "Complete returns management",
        "Inspection and refurbishment",
        "Integration with your sales platform",
      ],
      imgAlt: "Reverse Logistics",
    },
  },

  /* ───── Coverage section ───── */
  coverage: {
    title: "Coverage",
    us: {
      title: "United States",
      points: ["Warehouse in Los Angeles", "Nationwide coverage", "Carriers: UPS, FedEx, DHL"],
    },
    spain: {
      title: "Spain",
      points: ["Warehouse in Zaragoza", "Peninsular & island coverage", "Carriers: MRW, SEUR, DHL"],
    },
  },

  /* ───── Why TrackFlow ───── */
  whyTrackFlow: {
    title: "Why TrackFlow?",
    points: [
      "<strong>Binational operation:</strong> The only operator with its own infrastructure in the US and Spain",
      "<strong>+130 professionals</strong> dedicated to your logistics",
      "<strong>Own technology</strong> for total inventory visibility",
      "<strong>E-commerce specialization</strong> in fashion, electronics and cosmetics",
    ],
  },

  /* ───── Contact section ───── */
  contact: {
    title: "Contact",
    email: "Email: comercial@trackflow.com",
    losAngeles: "Los Angeles: +1 213 555 0147",
    zaragoza: "Zaragoza: +34 976 123 456",
  },

  /* ───── Footer ───── */
  footer: {
    rights: "© 2025 TrackFlow. All rights reserved.",
  },

  /* ───── Application page ───── */
  application: {
    title: "Application form",
    description:
      "Fill out this form so our sales team can offer you a proposal tailored to your company.",
  },

  /* ───── Application form ───── */
  form: {
    empresa: "Company name",
    empresaPlaceholder: "e.g. ModaExpress",
    contacto: "Contact person",
    contactoPlaceholder: "e.g. Laura García",
    email: "Corporate email",
    emailPlaceholder: "contact@company.com",
    telefono: "Phone",
    telefonoPlaceholder: "+34 612 345 678",
    web: "Company website",
    webPlaceholder: "https://www.company.com",
    pais: "Main country of operation",
    paisPlaceholder: "Select an option",
    paisUs: "United States",
    paisSpain: "Spain",
    paisBoth: "Both",
    paisOther: "Other",
    producto: "Product type",
    productoPlaceholder: "Select an option",
    productFashion: "Fashion",
    productElectronics: "Electronics",
    productCosmetics: "Cosmetics",
    productFood: "Food",
    productOther: "Other",
    volumen: "Estimated monthly shipping volume",
    volumenPlaceholder: "Select an option",
    servicios: "Services of interest",
    serviceWarehousing: "Warehousing",
    serviceLastMile: "Last mile",
    serviceReverse: "Reverse logistics",
    otro3pl: "Do you currently work with another 3PL?",
    otro3plYes: "Yes",
    otro3plNo: "No",
    otro3plEvaluating: "I am evaluating options",
    comentarios: "Comments or specific needs",
    comentariosPlaceholder: "Tell us about any special requirements or additional details",
    comentariosRestantes: "characters remaining",
    politicaPrivacidad: "I accept the privacy policy",
    revisionText: "Please review all data before submitting your request.",
    limpiar: "Clear",
    enviar: "Send request",
    successTitle: "Thank you for your interest in TrackFlow!",
    successBody:
      "We have received your request. Our sales team will review your information and contact you within 24-48 hours to schedule a call and learn about your logistics needs in detail.",
    successUrgent:
      "If you have any urgent questions, write to us directly at",
  },

  /* ───── Validation messages ───── */
  validation: {
    empresaMinLength: "The company name must be at least 2 characters.",
    contactoFullName: "Enter the contact's first and last name.",
    emailInvalid: "Enter a valid corporate email (e.g. name@company.com).",
    phoneInvalid: "Phone must include country code (e.g. +1 213 555 0147).",
    webInvalid: "Enter the company website in a valid format (https://www.company.com).",
    paisRequired: "Select the main country of operation.",
    productoRequired: "Select the type of product you handle.",
    volumenRequired: "Select the estimated monthly volume.",
    serviciosRequired: "Select at least one service of interest.",
    otro3plRequired: "Indicate if you currently work with another logistics provider.",
    comentariosMax: (remaining: number) =>
      `Comments cannot exceed 500 characters (${Math.max(0, remaining)} remaining).`,
    politicaRequired: "You must accept the privacy policy to continue.",
    volumeWarning:
      "For volumes under 100 monthly shipments, our services might not be the most efficient solution. Are you sure you want to continue?",
  },

  /* ───── Structured data (schema.org) ───── */
  structuredData: {
    orgDescription: "Warehouse management and last-mile delivery for e-commerce",
  },
};

export type Translations = typeof en;