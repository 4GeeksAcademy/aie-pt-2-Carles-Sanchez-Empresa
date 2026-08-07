import type { ApplicationFormData, FormErrors } from "../types/application";

const WEB_PATTERN = /^(https?:\/\/).+/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+\d[\d\s()-]*$/;

export const MAX_COMMENT_LENGTH = 500;

export function getRemainingCharacters(comments: string): number {
  return MAX_COMMENT_LENGTH - comments.length;
}

export function getProductVolumeWarning(producto: string, volumen: string): string {
  const lowerProduct = producto.trim().toLowerCase();
  const isOtherProduct = lowerProduct === "otro" || lowerProduct === "otros";
  const shouldWarn = producto !== "" && !isOtherProduct && volumen === "0-100";

  if (!shouldWarn) {
    return "";
  }

  return "Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?";
}

export function validateApplicationForm(data: ApplicationFormData): FormErrors {
  const errors: FormErrors = {};

  if (data.empresa.trim().length < 2) {
    errors.empresa = "El nombre de la empresa debe tener al menos 2 caracteres.";
  }

  if (data.contacto.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.contacto = "Ingresa nombre y apellido del contacto.";
  }

  if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Ingresa un email corporativo válido (ejemplo: nombre@empresa.com).";
  }

  if (!PHONE_PATTERN.test(data.telefono.trim())) {
    errors.telefono = "El teléfono debe incluir código de país (ejemplo: +1 213 555 0147).";
  }

  if (!WEB_PATTERN.test(data.web.trim())) {
    errors.web = "Ingresa el sitio web de la empresa en formato válido (https://www.empresa.com).";
  }

  if (data.pais === "") {
    errors.pais = "Selecciona el país de operación principal.";
  }

  if (data.producto === "") {
    errors.producto = "Selecciona el tipo de producto que manejas.";
  }

  if (data.volumen === "") {
    errors.volumen = "Selecciona el volumen mensual estimado.";
  }

  if (data.servicios.length === 0) {
    errors.servicios = "Selecciona al menos un servicio de interés.";
  }

  if (data.otro_3pl === "") {
    errors.otro_3pl = "Indica si actualmente trabajas con otro proveedor logístico.";
  }

  const remaining = getRemainingCharacters(data.comentarios);
  if (remaining < 0) {
    errors.comentarios = `Los comentarios no pueden exceder 500 caracteres (quedan ${Math.max(0, remaining)}).`;
  }

  if (!data.politica_privacidad) {
    errors.politica_privacidad = "Debes aceptar la política de privacidad para continuar.";
  }

  return errors;
}
