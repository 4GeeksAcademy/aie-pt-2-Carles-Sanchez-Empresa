/**
 * i18n/es.ts — Traducciones al español para el website de TrackFlow.
 */
const es: Record<string, string> = {
  // ─── General ───
  "app.loading": "Cargando...",
  "app.footer.copyright": "© 2025 TrackFlow. Todos los derechos reservados.",
  "app.footer.linkedin": "LinkedIn",
  "app.meta.title": "TrackFlow — Logística Inteligente",
  "app.meta.description":
    "Logística transfronteriza entre Estados Unidos y España — Almacenaje, entregas de última milla y logística inversa.",

  // ─── SiteHeader ───
  "nav.home": "Inicio",
  "nav.services": "Servicios",
  "nav.coverage": "Cobertura",
  "nav.contact": "Contacto",
  "nav.back_home": "Inicio",
  "nav.aria_main": "Navegación principal",
  "nav.aria_mobile": "Navegación principal móvil",

  // ─── Application Form ───
  "app.page.title": "Formulario de solicitud",
  "app.page.subtitle":
    "Completa este formulario para que nuestro equipo comercial pueda ofrecerte una propuesta adaptada a tu empresa.",

  // ─── Form fields ───
  "form.label.empresa": "Nombre de la empresa",
  "form.label.contacto": "Persona de contacto",
  "form.label.email": "Email corporativo",
  "form.label.telefono": "Teléfono",
  "form.label.web": "Sitio web de la empresa",
  "form.label.pais": "País de operación principal",
  "form.label.producto": "Tipo de producto",
  "form.label.volumen": "Volumen mensual estimado de envíos",
  "form.label.servicios": "Servicios de interés",
  "form.label.otro_3pl": "¿Actualmente trabajas con otro 3PL?",
  "form.label.comentarios": "Comentarios o necesidades específicas",
  "form.label.politica_privacidad": "Acepto la política de privacidad",

  "form.placeholder.empresa": "Ej. ModaExpress",
  "form.placeholder.contacto": "Ej. Laura García",
  "form.placeholder.email": "contacto@empresa.com",
  "form.placeholder.telefono": "+34 612 345 678",
  "form.placeholder.web": "https://www.empresa.com",
  "form.placeholder.comentarios": "Cuéntanos cualquier requisito especial o detalle adicional",

  "form.select.default": "Selecciona una opción",
  "form.select.pais.us": "Estados Unidos",
  "form.select.pais.es": "España",
  "form.select.pais.ambos": "Ambos",
  "form.select.pais.otro": "Otro",
  "form.select.producto.moda": "Moda",
  "form.select.producto.electronica": "Electrónica",
  "form.select.producto.cosmetica": "Cosmética",
  "form.select.producto.alimentacion": "Alimentación",
  "form.select.producto.otro": "Otro",
  "form.select.volumen.0-100": "0-100",
  "form.select.volumen.101-500": "101-500",
  "form.select.volumen.501-2000": "501-2000",
  "form.select.volumen.2000+": "2000+",
  "form.select.volumen.no_seguro": "No estoy seguro",

  "form.option.almacenaje": "Almacenaje",
  "form.option.ultima_milla": "Última milla",
  "form.option.logistica_inversa": "Logística inversa",

  "form.option.otro_3pl.si": "Sí",
  "form.option.otro_3pl.no": "No",
  "form.option.otro_3pl.evaluando": "Estoy evaluando opciones",

  "form.char_remaining": "{count} caracteres restantes",
  "form.review_text": "Revisa todos los datos antes de enviar tu solicitud.",
  "form.clear_btn": "Limpiar",
  "form.submit_btn": "Enviar solicitud",
  "form.sending": "Enviando…",

  "form.success.title": "¡Gracias por tu interés en TrackFlow!",
  "form.success.message":
    "Hemos recibido tu solicitud. Nuestro equipo comercial revisará tu información y te contactará en las próximas 24-48 horas para agendar una llamada y conocer tus necesidades logísticas en detalle.",
  "form.success.urgent":
    "Si tienes alguna consulta urgente, escríbenos directamente a ",

  // ─── Error display ───
  "form.error.title": "Error al enviar",
  "form.error.dismiss": "Descartar",
  "form.error.unexpected": "Ocurrió un error inesperado. Inténtalo de nuevo.",

  // ─── Validation errors ───
  "form.error.empresa": "El nombre de la empresa debe tener al menos 2 caracteres.",
  "form.error.contacto": "Ingresa nombre y apellido del contacto.",
  "form.error.email": "Ingresa un email corporativo válido (ejemplo: nombre@empresa.com).",
  "form.error.telefono": "El teléfono debe incluir código de país (ejemplo: +1 213 555 0147).",
  "form.error.web": "Ingresa el sitio web de la empresa en formato válido (https://www.empresa.com).",
  "form.error.pais": "Selecciona el país de operación principal.",
  "form.error.producto": "Selecciona el tipo de producto que manejas.",
  "form.error.volumen": "Selecciona el volumen mensual estimado.",
  "form.error.servicios": "Selecciona al menos un servicio de interés.",
  "form.error.otro_3pl": "Indica si actualmente trabajas con otro proveedor logístico.",
  "form.error.comentarios": "Los comentarios no pueden exceder 500 caracteres (quedan {count}).",
  "form.error.politica_privacidad": "Debes aceptar la política de privacidad para continuar.",

  "form.warning.volumen":
    "Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?",

  // ─── Homepage ───
  "home.hero.title": "Logística que escala con tu e-commerce",
  "home.hero.subtitle":
    "Gestión de almacenes, entregas de última milla y logística inversa en Estados Unidos y España. Más de 15 años ayudando a marcas de moda, electrónica y cosmética a crecer sin preocuparse por la operación.",
  "home.hero.cta": "Solicitar información",

  "home.section.services": "Servicios",
  "home.section.coverage": "Cobertura",
  "home.section.why": "¿Por qué TrackFlow?",
  "home.section.contact": "Contacto",

  "home.service.1.title": "Gestión de Almacenes",
  "home.service.1.point.1": "Almacenamiento, picking y packing",
  "home.service.1.point.2": "Inventario en tiempo real",
  "home.service.1.point.3": "Operamos almacenes en Los Ángeles y Zaragoza",
  "home.service.1.img_alt": "Gestión de Almacenes",

  "home.service.2.title": "Entregas de Última Milla",
  "home.service.2.point.1": "Red de carriers certificados en ambos países",
  "home.service.2.point.2": "Seguimiento unificado de envíos",
  "home.service.2.point.3": "Gestión de incidencias y devoluciones",
  "home.service.2.img_alt": "Entregas de Última Milla",

  "home.service.3.title": "Logística Inversa",
  "home.service.3.point.1": "Gestión completa de devoluciones",
  "home.service.3.point.2": "Inspección y reacondicionamiento",
  "home.service.3.point.3": "Integración con tu plataforma de ventas",
  "home.service.3.img_alt": "Logística Inversa",

  "home.coverage.1.title": "Estados Unidos",
  "home.coverage.1.point.1": "Almacén en Los Ángeles",
  "home.coverage.1.point.2": "Cobertura nacional",
  "home.coverage.1.point.3": "Carriers: UPS, FedEx, DHL",

  "home.coverage.2.title": "España",
  "home.coverage.2.point.1": "Almacén en Zaragoza",
  "home.coverage.2.point.2": "Cobertura peninsular e islas",
  "home.coverage.2.point.3": "Carriers: MRW, SEUR, DHL",

  "home.why.1": "<strong>Operación binacional:</strong> El único operador con infraestructura propia en Estados Unidos y España",
  "home.why.2": "<strong>+130 profesionales</strong> dedicados a tu logística",
  "home.why.3": "<strong>Tecnología propia</strong> para visibilidad total de tu inventario",
  "home.why.4": "<strong>Especialización e-commerce</strong> en moda, electrónica y cosmética",

  "home.contact.email": "comercial@trackflow.com",
  "home.contact.la": "Los Ángeles: +1 213 555 0147",
  "home.contact.zgz": "Zaragoza: +34 976 123 456",
};

export default es;