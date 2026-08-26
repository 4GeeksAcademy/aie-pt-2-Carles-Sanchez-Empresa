import type { ApplicationFormData, FormErrors } from "../types/application";
import type { Translations } from "../i18n/en";

const WEB_PATTERN = /^(https?:\/\/).+/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+\d[\d\s()-]*$/;

export const MAX_COMMENT_LENGTH = 500;

export function getRemainingCharacters(comments: string): number {
  return MAX_COMMENT_LENGTH - comments.length;
}

export function getProductVolumeWarning(producto: string, volumen: string, t: Translations["validation"]): string {
  const lowerProduct = producto.trim().toLowerCase();
  const isOtherProduct = lowerProduct === "otro" || lowerProduct === "otros";
  const shouldWarn = producto !== "" && !isOtherProduct && volumen === "0-100";

  if (!shouldWarn) {
    return "";
  }

  return t.volumeWarning;
}

export function validateApplicationForm(data: ApplicationFormData, t: Translations["validation"]): FormErrors {
  const errors: FormErrors = {};

  if (data.empresa.trim().length < 2) {
    errors.empresa = t.empresaMinLength;
  }

  if (data.contacto.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.contacto = t.contactoFullName;
  }

  if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = t.emailInvalid;
  }

  if (!PHONE_PATTERN.test(data.telefono.trim())) {
    errors.telefono = t.phoneInvalid;
  }

  if (!WEB_PATTERN.test(data.web.trim())) {
    errors.web = t.webInvalid;
  }

  if (data.pais === "") {
    errors.pais = t.paisRequired;
  }

  if (data.producto === "") {
    errors.producto = t.productoRequired;
  }

  if (data.volumen === "") {
    errors.volumen = t.volumenRequired;
  }

  if (data.servicios.length === 0) {
    errors.servicios = t.serviciosRequired;
  }

  if (data.otro_3pl === "") {
    errors.otro_3pl = t.otro3plRequired;
  }

  const remaining = getRemainingCharacters(data.comentarios);
  if (remaining < 0) {
    errors.comentarios = t.comentariosMax(remaining);
  }

  if (!data.politica_privacidad) {
    errors.politica_privacidad = t.politicaRequired;
  }

  return errors;
}
