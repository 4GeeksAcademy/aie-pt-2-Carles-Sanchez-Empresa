/**
 * i18n/en.ts — English translations for the TrackFlow website.
 */
const en: Record<string, string> = {
  // ─── General ───
  "app.loading": "Loading...",
  "app.footer.copyright": "© 2025 TrackFlow. All rights reserved.",
  "app.footer.linkedin": "LinkedIn",
  "app.meta.title": "TrackFlow — Smart Logistics",
  "app.meta.description":
    "Cross-border logistics between the United States and Spain — Warehousing, last-mile delivery, and reverse logistics.",

  // ─── SiteHeader ───
  "nav.home": "Home",
  "nav.services": "Services",
  "nav.coverage": "Coverage",
  "nav.contact": "Contact",
  "nav.back_home": "Home",
  "nav.aria_main": "Main navigation",
  "nav.aria_mobile": "Main mobile navigation",

  // ─── Application Form ───
  "app.page.title": "Application form",
  "app.page.subtitle":
    "Complete this form so our commercial team can offer you a tailored proposal for your company.",

  // ─── Form fields ───
  "form.label.empresa": "Company name",
  "form.label.contacto": "Contact person",
  "form.label.email": "Business email",
  "form.label.telefono": "Phone number",
  "form.label.web": "Company website",
  "form.label.pais": "Main country of operation",
  "form.label.producto": "Product type",
  "form.label.volumen": "Estimated monthly shipment volume",
  "form.label.servicios": "Services of interest",
  "form.label.otro_3pl": "Do you currently work with another 3PL?",
  "form.label.comentarios": "Comments or specific needs",
  "form.label.politica_privacidad": "I accept the privacy policy",

  "form.placeholder.empresa": "E.g. ModaExpress",
  "form.placeholder.contacto": "E.g. Laura García",
  "form.placeholder.email": "contact@company.com",
  "form.placeholder.telefono": "+1 213 555 0147",
  "form.placeholder.web": "https://www.company.com",
  "form.placeholder.comentarios": "Tell us any special requirements or additional details",

  "form.select.default": "Select an option",
  "form.select.pais.us": "United States",
  "form.select.pais.es": "Spain",
  "form.select.pais.ambos": "Both",
  "form.select.pais.otro": "Other",
  "form.select.producto.moda": "Fashion",
  "form.select.producto.electronica": "Electronics",
  "form.select.producto.cosmetica": "Cosmetics",
  "form.select.producto.alimentacion": "Food",
  "form.select.producto.otro": "Other",
  "form.select.volumen.0-100": "0-100",
  "form.select.volumen.101-500": "101-500",
  "form.select.volumen.501-2000": "501-2000",
  "form.select.volumen.2000+": "2000+",
  "form.select.volumen.no_seguro": "Not sure",

  "form.option.almacenaje": "Warehousing",
  "form.option.ultima_milla": "Last-mile",
  "form.option.logistica_inversa": "Reverse logistics",

  "form.option.otro_3pl.si": "Yes",
  "form.option.otro_3pl.no": "No",
  "form.option.otro_3pl.evaluando": "I am evaluating options",

  "form.char_remaining": "{count} characters remaining",
  "form.review_text": "Check all data before submitting your request.",
  "form.clear_btn": "Clear",
  "form.submit_btn": "Submit request",

  "form.success.title": "Thank you for your interest in TrackFlow!",
  "form.success.message":
    "We have received your request. Our commercial team will review your information and contact you within 24-48 hours to schedule a call and learn about your logistics needs in detail.",
  "form.success.urgent":
    "If you have any urgent questions, write to us directly at ",

  // ─── Validation errors ───
  "form.error.empresa": "Company name must be at least 2 characters.",
  "form.error.contacto": "Enter first and last name of the contact person.",
  "form.error.email": "Enter a valid business email (e.g. name@company.com).",
  "form.error.telefono": "Phone must include country code (e.g. +1 213 555 0147).",
  "form.error.web": "Enter the company website in valid format (https://www.company.com).",
  "form.error.pais": "Select the main country of operation.",
  "form.error.producto": "Select the type of product you handle.",
  "form.error.volumen": "Select the estimated monthly volume.",
  "form.error.servicios": "Select at least one service of interest.",
  "form.error.otro_3pl": "Indicate whether you currently work with another logistics provider.",
  "form.error.comentarios": "Comments cannot exceed 500 characters ({count} remaining).",
  "form.error.politica_privacidad": "You must accept the privacy policy to continue.",

  "form.warning.volumen":
    "For volumes under 100 monthly shipments, our services may not be the most efficient solution. Are you sure you want to continue?",

  // ─── Homepage ───
  "home.hero.title": "Logistics that scales with your e-commerce",
  "home.hero.subtitle":
    "Warehouse management, last-mile delivery and reverse logistics in the United States and Spain. Over 15 years helping fashion, electronics and cosmetics brands grow without worrying about operations.",
  "home.hero.cta": "Request information",

  "home.section.services": "Services",
  "home.section.coverage": "Coverage",
  "home.section.why": "Why TrackFlow?",
  "home.section.contact": "Contact",

  "home.service.1.title": "Warehouse Management",
  "home.service.1.point.1": "Storage, picking and packing",
  "home.service.1.point.2": "Real-time inventory",
  "home.service.1.point.3": "We operate warehouses in Los Angeles and Zaragoza",
  "home.service.1.img_alt": "Warehouse Management",

  "home.service.2.title": "Last-Mile Delivery",
  "home.service.2.point.1": "Certified carrier network in both countries",
  "home.service.2.point.2": "Unified shipment tracking",
  "home.service.2.point.3": "Incident and return management",
  "home.service.2.img_alt": "Last-Mile Delivery",

  "home.service.3.title": "Reverse Logistics",
  "home.service.3.point.1": "Complete return management",
  "home.service.3.point.2": "Inspection and reconditioning",
  "home.service.3.point.3": "Integration with your sales platform",
  "home.service.3.img_alt": "Reverse Logistics",

  "home.coverage.1.title": "United States",
  "home.coverage.1.point.1": "Warehouse in Los Angeles",
  "home.coverage.1.point.2": "Nationwide coverage",
  "home.coverage.1.point.3": "Carriers: UPS, FedEx, DHL",

  "home.coverage.2.title": "Spain",
  "home.coverage.2.point.1": "Warehouse in Zaragoza",
  "home.coverage.2.point.2": "Peninsular and island coverage",
  "home.coverage.2.point.3": "Carriers: MRW, SEUR, DHL",

  "home.why.1": "<strong>Binational operation:</strong> The only operator with its own infrastructure in the United States and Spain",
  "home.why.2": "<strong>+130 professionals</strong> dedicated to your logistics",
  "home.why.3": "<strong>Own technology</strong> for total inventory visibility",
  "home.why.4": "<strong>E-commerce specialization</strong> in fashion, electronics and cosmetics",

  "home.contact.email": "comercial@trackflow.com",
  "home.contact.la": "Los Angeles: +1 213 555 0147",
  "home.contact.zgz": "Zaragoza: +34 976 123 456",
};

export default en;