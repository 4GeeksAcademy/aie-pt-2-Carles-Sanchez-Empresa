/**
 * Valida un número de teléfono.
 * Acepta formatos comunes: +34 600 000 000, 600000000, +1 (234) 567-8900, etc.
 * Debe tener al menos 7 dígitos y un máximo de 15 dígitos.
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Mensaje de error para mostrar cuando el teléfono no es válido.
 */
export const PHONE_ERROR = "El formato del teléfono no es válido. Debe contener entre 7 y 15 dígitos.";