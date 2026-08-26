import type { Translations } from "./en";

export const es: Translations = {
  /* ───── SiteHeader ───── */
  header: {
    inicio: "Inicio",
    servicios: "Servicios",
    cobertura: "Cobertura",
    contacto: "Contacto",
    solicitarInfo: "Solicitar información",
  },

  /* ───── Hero ───── */
  hero: {
    title: "Logística que escala con tu e-commerce",
    description:
      "Gestión de almacenes, entregas de última milla y logística inversa en Estados Unidos y España. Más de 15 años ayudando a marcas de moda, electrónica y cosmética a crecer sin preocuparse por la operación.",
    cta: "Solicitar información",
  },

  /* ───── Services section ───── */
  services: {
    title: "Servicios",
    warehouse: {
      title: "Gestión de Almacenes",
      points: [
        "Almacenamiento, picking y packing",
        "Inventario en tiempo real",
        "Operamos almacenes en Los Ángeles y Zaragoza",
      ],
      imgAlt: "Gestión de Almacenes",
    },
    lastMile: {
      title: "Entregas de Última Milla",
      points: [
        "Red de carriers certificados en ambos países",
        "Seguimiento unificado de envíos",
        "Gestión de incidencias y devoluciones",
      ],
      imgAlt: "Entregas de Última Milla",
    },
    reverse: {
      title: "Logística Inversa",
      points: [
        "Gestión completa de devoluciones",
        "Inspección y reacondicionamiento",
        "Integración con tu plataforma de ventas",
      ],
      imgAlt: "Logística Inversa",
    },
  },

  /* ───── Coverage section ───── */
  coverage: {
    title: "Cobertura",
    us: {
      title: "Estados Unidos",
      points: ["Almacén en Los Ángeles", "Cobertura nacional", "Carriers: UPS, FedEx, DHL"],
    },
    spain: {
      title: "España",
      points: ["Almacén en Zaragoza", "Cobertura peninsular e islas", "Carriers: MRW, SEUR, DHL"],
    },
  },

  /* ───── Why TrackFlow ───── */
  whyTrackFlow: {
    title: "¿Por qué TrackFlow?",
    points: [
      "<strong>Operación binacional:</strong> El único operador con infraestructura propia en Estados Unidos y España",
      "<strong>+130 profesionales</strong> dedicados a tu logística",
      "<strong>Tecnología propia</strong> para visibilidad total de tu inventario",
      "<strong>Especialización e-commerce</strong> en moda, electrónica y cosmética",
    ],
  },

  /* ───── Contact section ───── */
  contact: {
    title: "Contacto",
    email: "Email: comercial@trackflow.com",
    losAngeles: "Los Ángeles: +1 213 555 0147",
    zaragoza: "Zaragoza: +34 976 123 456",
  },

  /* ───── Footer ───── */
  footer: {
    rights: "© 2025 TrackFlow. Todos los derechos reservados.",
  },

  /* ───── Application page ───── */
  application: {
    title: "Formulario de solicitud",
    description:
      "Completa este formulario para que nuestro equipo comercial pueda ofrecerte una propuesta adaptada a tu empresa.",
  },

  /* ───── Application form ───── */
  form: {
    empresa: "Nombre de la empresa",
    empresaPlaceholder: "Ej. ModaExpress",
    contacto: "Persona de contacto",
    contactoPlaceholder: "Ej. Laura García",
    email: "Email corporativo",
    emailPlaceholder: "contacto@empresa.com",
    telefono: "Teléfono",
    telefonoPlaceholder: "+34 612 345 678",
    web: "Sitio web de la empresa",
    webPlaceholder: "https://www.empresa.com",
    pais: "País de operación principal",
    paisPlaceholder: "Selecciona una opción",
    paisUs: "Estados Unidos",
    paisSpain: "España",
    paisBoth: "Ambos",
    paisOther: "Otro",
    producto: "Tipo de producto",
    productoPlaceholder: "Selecciona una opción",
    productFashion: "Moda",
    productElectronics: "Electrónica",
    productCosmetics: "Cosmética",
    productFood: "Alimentación",
    productOther: "Otro",
    volumen: "Volumen mensual estimado de envíos",
    volumenPlaceholder: "Selecciona una opción",
    servicios: "Servicios de interés",
    serviceWarehousing: "Almacenaje",
    serviceLastMile: "Última milla",
    serviceReverse: "Logística inversa",
    otro3pl: "¿Actualmente trabajas con otro 3PL?",
    otro3plYes: "Sí",
    otro3plNo: "No",
    otro3plEvaluating: "Estoy evaluando opciones",
    comentarios: "Comentarios o necesidades específicas",
    comentariosPlaceholder: "Cuéntanos cualquier requisito especial o detalle adicional",
    comentariosRestantes: "caracteres restantes",
    politicaPrivacidad: "Acepto la política de privacidad",
    revisionText: "Revisa todos los datos antes de enviar tu solicitud.",
    limpiar: "Limpiar",
    enviar: "Enviar solicitud",
    successTitle: "¡Gracias por tu interés en TrackFlow!",
    successBody:
      "Hemos recibido tu solicitud. Nuestro equipo comercial revisará tu información y te contactará en las próximas 24-48 horas para agendar una llamada y conocer tus necesidades logísticas en detalle.",
    successUrgent:
      "Si tienes alguna consulta urgente, escríbenos directamente a",
  },

  /* ───── Validation messages ───── */
  validation: {
    empresaMinLength: "El nombre de la empresa debe tener al menos 2 caracteres.",
    contactoFullName: "Ingresa nombre y apellido del contacto.",
    emailInvalid: "Ingresa un email corporativo válido (ejemplo: nombre@empresa.com).",
    phoneInvalid: 'El teléfono debe incluir código de país (ejemplo: +1 213 555 0147).',
    webInvalid: "Ingresa el sitio web de la empresa en formato válido (https://www.empresa.com).",
    paisRequired: "Selecciona el país de operación principal.",
    productoRequired: "Selecciona el tipo de producto que manejas.",
    volumenRequired: "Selecciona el volumen mensual estimado.",
    serviciosRequired: "Selecciona al menos un servicio de interés.",
    otro3plRequired: "Indica si actualmente trabajas con otro proveedor logístico.",
    comentariosMax: (remaining: number) =>
      `Los comentarios no pueden exceder 500 caracteres (quedan ${Math.max(0, remaining)}).`,
    politicaRequired: "Debes aceptar la política de privacidad para continuar.",
    volumeWarning:
      "Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?",
  },

  /* ───── Structured data (schema.org) ───── */
  structuredData: {
    orgDescription: "Gestión de almacenes y entregas de última milla para e-commerce",
  },
};