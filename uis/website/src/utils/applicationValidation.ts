import type { ApplicationFormData, FormErrors } from "../types/application";

const WEB_PATTERN = /^(https?:\/\/).+/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+\d[\d\s()-]*$/;

export const MAX_COMMENT_LENGTH = 500;

export function getRemainingCharacters(comments: string): number {
  return MAX_COMMENT_LENGTH - comments.length;
}

export function getProductVolumeWarning(
  producto: string,
  volumen: string,
  t: (key: string) => string
): string {
  const lowerProduct = producto.trim().toLowerCase();
  const isOtherProduct = lowerProduct === "otro" || lowerProduct === "otros";
  const shouldWarn = producto !== "" && !isOtherProduct && volumen === "0-100";

  if (!shouldWarn) {
    return "";
  }

  return t("form.warning.volumen");
}

export function validateApplicationForm(
  data: ApplicationFormData,
  t: (key: string, vars?: Record<string, string | number>) => string
): FormErrors {
  const errors: FormErrors = {};

  if (data.empresa.trim().length < 2) {
    errors.empresa = t("form.error.empresa");
  }

  if (data.contacto.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.contacto = t("form.error.contacto");
  }

  if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = t("form.error.email");
  }

  if (!PHONE_PATTERN.test(data.telefono.trim())) {
    errors.telefono = t("form.error.telefono");
  }

  if (!WEB_PATTERN.test(data.web.trim())) {
    errors.web = t("form.error.web");
  }

  if (data.pais === "") {
    errors.pais = t("form.error.pais");
  }

  if (data.producto === "") {
    errors.producto = t("form.error.producto");
  }

  if (data.volumen === "") {
    errors.volumen = t("form.error.volumen");
  }

  if (data.servicios.length === 0) {
    errors.servicios = t("form.error.servicios");
  }

  if (data.otro_3pl === "") {
    errors.otro_3pl = t("form.error.otro_3pl");
  }

  const remaining = getRemainingCharacters(data.comentarios);
  if (remaining < 0) {
    errors.comentarios = t("form.error.comentarios", { count: Math.max(0, remaining) });
  }

  if (!data.politica_privacidad) {
    errors.politica_privacidad = t("form.error.politica_privacidad");
  }

  return errors;
}
