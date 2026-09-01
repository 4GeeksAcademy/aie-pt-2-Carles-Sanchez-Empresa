import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  ApplicationFormData,
  FormErrors,
  Other3plType,
  ServiceType,
} from "../../types/application";
import {
  getProductVolumeWarning,
  getRemainingCharacters,
  validateApplicationForm,
} from "../../utils/applicationValidation";
import { FormField } from "./FormField";

const baseInputClass =
  "w-full rounded-xl border border-[#c89d66] bg-[#f3ddba] px-4 py-3 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20";
const invalidInputClass = "border-red-600 bg-[#fee2e2] ring-2 ring-red-500/40";

const initialFormData: ApplicationFormData = {
  empresa: "",
  contacto: "",
  email: "",
  telefono: "",
  web: "",
  pais: "",
  producto: "",
  volumen: "",
  servicios: [],
  otro_3pl: "",
  comentarios: "",
  politica_privacidad: false,
};

function withValidationClass(hasError: boolean): string {
  return `${baseInputClass} ${hasError ? invalidInputClass : ""}`.trim();
}

export function ApplicationForm() {
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successVisible, setSuccessVisible] = useState(false);

  const remainingComments = useMemo(() => getRemainingCharacters(formData.comentarios), [formData.comentarios]);
  const productWarning = useMemo(
    () => getProductVolumeWarning(formData.producto, formData.volumen),
    [formData.producto, formData.volumen]
  );

  const handleTextChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleServiceChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { checked, value } = event.target;
    const service = value as ServiceType;

    setFormData((prev) => ({
      ...prev,
      servicios: checked ? [...prev.servicios, service] : prev.servicios.filter((item) => item !== service),
    }));
    setErrors((prev) => ({ ...prev, servicios: undefined }));
  };

  const handlePolicyChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = event.target;
    setFormData((prev) => ({ ...prev, politica_privacidad: checked }));
    setErrors((prev) => ({ ...prev, politica_privacidad: undefined }));
  };

  const handleOther3plChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFormData((prev) => ({ ...prev, otro_3pl: event.target.value as Other3plType }));
    setErrors((prev) => ({ ...prev, otro_3pl: undefined }));
  };

  const clearForm = (): void => {
    setFormData(initialFormData);
    setErrors({});
    setSuccessVisible(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextErrors = validateApplicationForm(formData);
    const hasErrors = Object.keys(nextErrors).length > 0;

    setErrors(nextErrors);
    if (hasErrors) {
      setSuccessVisible(false);
      return;
    }

    setSuccessVisible(true);
    window.scrollTo(0, 0);
  };

  return (
    <form noValidate className="mt-8 space-y-6 rounded-2xl bg-[#ffffff] p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField htmlFor="empresa" label="Nombre de la empresa" error={errors.empresa}>
          <input
            id="empresa"
            type="text"
            name="empresa"
            value={formData.empresa}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.empresa))}
            placeholder="Ej. ModaExpress"
          />
        </FormField>

        <FormField htmlFor="contacto" label="Persona de contacto" error={errors.contacto}>
          <input
            id="contacto"
            type="text"
            name="contacto"
            value={formData.contacto}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.contacto))}
            placeholder="Ej. Laura García"
          />
        </FormField>

        <FormField htmlFor="email" label="Email corporativo" error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.email))}
            placeholder="contacto@empresa.com"
          />
        </FormField>

        <FormField htmlFor="telefono" label="Teléfono" error={errors.telefono}>
          <input
            id="telefono"
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.telefono))}
            placeholder="+34 612 345 678"
          />
        </FormField>

        <FormField
          htmlFor="web"
          label="Sitio web de la empresa"
          error={errors.web}
          className="sm:col-span-2"
        >
          <input
            id="web"
            type="text"
            inputMode="url"
            name="web"
            value={formData.web}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.web))}
            placeholder="https://www.empresa.com"
          />
        </FormField>

        <FormField htmlFor="pais" label="País de operación principal" error={errors.pais}>
          <select
            id="pais"
            name="pais"
            value={formData.pais}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.pais))}
          >
            <option value="">Selecciona una opción</option>
            <option value="Estados Unidos">Estados Unidos</option>
            <option value="España">España</option>
            <option value="Ambos">Ambos</option>
            <option value="Otro">Otro</option>
          </select>
        </FormField>

        <FormField htmlFor="producto" label="Tipo de producto" error={errors.producto}>
          <select
            id="producto"
            name="producto"
            value={formData.producto}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.producto))}
          >
            <option value="">Selecciona una opción</option>
            <option value="Moda">Moda</option>
            <option value="Electrónica">Electrónica</option>
            <option value="Cosmética">Cosmética</option>
            <option value="Alimentación">Alimentación</option>
            <option value="Otro">Otro</option>
          </select>
        </FormField>

        <FormField htmlFor="volumen" label="Volumen mensual estimado de envíos" error={errors.volumen}>
          <select
            id="volumen"
            name="volumen"
            value={formData.volumen}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.volumen))}
          >
            <option value="">Selecciona una opción</option>
            <option value="0-100">0-100</option>
            <option value="101-500">101-500</option>
            <option value="501-2000">501-2000</option>
            <option value="2000+">2000+</option>
            <option value="No estoy seguro">No estoy seguro</option>
          </select>
        </FormField>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="mb-2 text-sm font-semibold text-[#14263a]">Servicios de interés</p>
          <div
            className={`rounded-2xl border bg-[#f3ddba] p-5 ${
              errors.servicios ? "border-red-600 ring-2 ring-red-500/40" : "border-[#c89d66]"
            }`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(["Almacenaje", "Última milla", "Logística inversa"] as ServiceType[]).map((service) => (
                <label key={service} className="inline-flex items-center gap-3 rounded-xl border border-[#c89d66] bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    value={service}
                    checked={formData.servicios.includes(service)}
                    onChange={handleServiceChange}
                    className="h-4 w-4 text-[#14263a] accent-[#14263a]"
                  />
                  <span className="text-sm text-[#2f4a62]">{service}</span>
                </label>
              ))}
            </div>
          </div>
          <p className={`mt-2 text-sm text-red-600 ${errors.servicios ? "" : "hidden"}`}>{errors.servicios || ""}</p>
        </div>

        <div className="space-y-2">
          <p className="mb-2 text-sm font-semibold text-[#14263a]">¿Actualmente trabajas con otro 3PL?</p>
          <div
            className={`rounded-2xl border bg-[#f3ddba] p-5 ${
              errors.otro_3pl ? "border-red-600 ring-2 ring-red-500/40" : "border-[#c89d66]"
            }`}
          >
            <div className="space-y-3">
              {(["Sí", "No", "Estoy evaluando opciones"] as Other3plType[])
                .filter((value) => value !== "")
                .map((option) => (
                  <label
                    key={option}
                    className="inline-flex w-full items-center gap-3 rounded-xl border border-[#c89d66] bg-white px-4 py-3"
                  >
                    <input
                      type="radio"
                      name="otro_3pl"
                      value={option}
                      checked={formData.otro_3pl === option}
                      onChange={handleOther3plChange}
                      className="h-4 w-4 text-[#14263a] accent-[#14263a]"
                    />
                    <span className="text-sm text-[#2f4a62]">{option}</span>
                  </label>
                ))}
            </div>
          </div>
          <p className={`mt-2 text-sm text-red-600 ${errors.otro_3pl ? "" : "hidden"}`}>{errors.otro_3pl || ""}</p>
        </div>

        <FormField htmlFor="comentarios" label="Comentarios o necesidades específicas" error={errors.comentarios}>
          <div className="rounded-2xl border border-[#c89d66] bg-[#f3ddba] p-5">
            <textarea
              id="comentarios"
              name="comentarios"
              rows={5}
              value={formData.comentarios}
              onChange={handleTextChange}
              className={`w-full rounded-2xl border border-[#c89d66] bg-white px-4 py-3 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20 ${
                errors.comentarios ? invalidInputClass : ""
              }`.trim()}
              placeholder="Cuéntanos cualquier requisito especial o detalle adicional"
            />
            <div className="mt-2 flex items-center justify-between gap-4">
              <p className={`text-sm text-red-600 ${errors.comentarios ? "" : "hidden"}`} role="alert">
                {errors.comentarios || ""}
              </p>
              <p className="text-sm text-[#2f4a62]">{remainingComments} caracteres restantes</p>
            </div>
          </div>
        </FormField>
      </div>

      <label
        htmlFor="politica_privacidad"
        className={`inline-flex items-start gap-3 rounded-2xl border bg-[#f3ddba] p-5 ${
          errors.politica_privacidad ? "border-red-600 ring-2 ring-red-500/40" : "border-[#c89d66]"
        }`}
      >
        <input
          id="politica_privacidad"
          type="checkbox"
          checked={formData.politica_privacidad}
          onChange={handlePolicyChange}
          className="mt-1 h-4 w-4 text-[#14263a] accent-[#14263a]"
        />
        <span className="text-sm text-[#2f4a62]">Acepto la política de privacidad</span>
      </label>
      <p className={`mt-2 text-sm text-red-600 ${errors.politica_privacidad ? "" : "hidden"}`}>
        {errors.politica_privacidad || ""}
      </p>

      <div
        role="status"
        aria-live="polite"
        className={`mt-4 rounded-2xl border border-[#f5c46d] bg-[#fff7df] px-4 py-4 text-sm text-[#8a6d00] ${
          productWarning ? "" : "hidden"
        }`}
      >
        {productWarning}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#2f4a62]">Revisa todos los datos antes de enviar tu solicitud.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={clearForm}
            className="inline-flex items-center justify-center rounded-xl border border-[#14263a] bg-transparent px-5 py-3 text-sm font-semibold text-[#14263a] transition hover:bg-[#f3ddba]"
          >
            Limpiar
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-[#14263a] px-5 py-3 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a]"
          >
            Enviar solicitud
          </button>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`mt-6 rounded-2xl border border-[#7cb342] bg-[#f1f8e9] px-6 py-6 text-sm text-[#33691e] ${
          successVisible ? "" : "hidden"
        }`}
      >
        <p className="mb-3 font-semibold">¡Gracias por tu interés en TrackFlow!</p>
        <p className="mb-3">
          Hemos recibido tu solicitud. Nuestro equipo comercial revisará tu información y te contactará en las próximas
          24-48 horas para agendar una llamada y conocer tus necesidades logísticas en detalle.
        </p>
        <p>
          Si tienes alguna consulta urgente, escríbenos directamente a {" "}
          <a href="mailto:comercial@trackflow.com" className="font-semibold underline">
            comercial@trackflow.com
          </a>
        </p>
      </div>
    </form>
  );
}
