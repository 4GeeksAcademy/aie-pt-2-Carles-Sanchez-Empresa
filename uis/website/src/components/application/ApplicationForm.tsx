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
import { useTranslation } from "@/lib/i18n";
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
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const remainingComments = useMemo(() => getRemainingCharacters(formData.comentarios), [formData.comentarios]);
  const productWarning = useMemo(
    () => getProductVolumeWarning(formData.producto, formData.volumen, t),
    [formData.producto, formData.volumen, t]
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
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validateApplicationForm(formData, t);
    const hasErrors = Object.keys(nextErrors).length > 0;

    setErrors(nextErrors);
    if (hasErrors) {
      setSuccessVisible(false);
      return;
    }

    setSubmitting(true);
    try {
      // ── Simular envío: aquí se conectaría con la API real ──
      // TODO: Reemplazar por llamada real a backend cuando esté disponible
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setSuccessVisible(true);
      window.scrollTo(0, 0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("form.error.unexpected");
      setSubmitError(message);
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form noValidate className="mt-8 space-y-6 rounded-2xl bg-[#ffffff] p-6 shadow-sm" onSubmit={handleSubmit}>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField htmlFor="empresa" label={t("form.label.empresa")} error={errors.empresa}>
          <input
            id="empresa"
            type="text"
            name="empresa"
            value={formData.empresa}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.empresa))}
            placeholder={t("form.placeholder.empresa")}
          />
        </FormField>

        <FormField htmlFor="contacto" label={t("form.label.contacto")} error={errors.contacto}>
          <input
            id="contacto"
            type="text"
            name="contacto"
            value={formData.contacto}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.contacto))}
            placeholder={t("form.placeholder.contacto")}
          />
        </FormField>

        <FormField htmlFor="email" label={t("form.label.email")} error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.email))}
            placeholder={t("form.placeholder.email")}
          />
        </FormField>

        <FormField htmlFor="telefono" label={t("form.label.telefono")} error={errors.telefono}>
          <input
            id="telefono"
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.telefono))}
            placeholder={t("form.placeholder.telefono")}
          />
        </FormField>

        <FormField
          htmlFor="web"
          label={t("form.label.web")}
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
            placeholder={t("form.placeholder.web")}
          />
        </FormField>

        <FormField htmlFor="pais" label={t("form.label.pais")} error={errors.pais}>
          <select
            id="pais"
            name="pais"
            value={formData.pais}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.pais))}
          >
            <option value="">{t("form.select.default")}</option>
            <option value="Estados Unidos">{t("form.select.pais.us")}</option>
            <option value="España">{t("form.select.pais.es")}</option>
            <option value="Ambos">{t("form.select.pais.ambos")}</option>
            <option value="Otro">{t("form.select.pais.otro")}</option>
          </select>
        </FormField>

        <FormField htmlFor="producto" label={t("form.label.producto")} error={errors.producto}>
          <select
            id="producto"
            name="producto"
            value={formData.producto}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.producto))}
          >
            <option value="">{t("form.select.default")}</option>
            <option value="Moda">{t("form.select.producto.moda")}</option>
            <option value="Electrónica">{t("form.select.producto.electronica")}</option>
            <option value="Cosmética">{t("form.select.producto.cosmetica")}</option>
            <option value="Alimentación">{t("form.select.producto.alimentacion")}</option>
            <option value="Otro">{t("form.select.producto.otro")}</option>
          </select>
        </FormField>

        <FormField htmlFor="volumen" label={t("form.label.volumen")} error={errors.volumen}>
          <select
            id="volumen"
            name="volumen"
            value={formData.volumen}
            onChange={handleTextChange}
            className={withValidationClass(Boolean(errors.volumen))}
          >
            <option value="">{t("form.select.default")}</option>
            <option value="0-100">{t("form.select.volumen.0-100")}</option>
            <option value="101-500">{t("form.select.volumen.101-500")}</option>
            <option value="501-2000">{t("form.select.volumen.501-2000")}</option>
            <option value="2000+">{t("form.select.volumen.2000+")}</option>
            <option value="No estoy seguro">{t("form.select.volumen.no_seguro")}</option>
          </select>
        </FormField>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="mb-2 text-sm font-semibold text-[#14263a]">{t("form.label.servicios")}</p>
          <div
            className={`rounded-2xl border bg-[#f3ddba] p-5 ${
              errors.servicios ? "border-red-600 ring-2 ring-red-500/40" : "border-[#c89d66]"
            }`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(["Almacenaje", "Última milla", "Logística inversa"] as ServiceType[]).map((service) => {
                const serviceKey =
                  service === "Almacenaje"
                    ? "form.option.almacenaje"
                    : service === "Última milla"
                      ? "form.option.ultima_milla"
                      : "form.option.logistica_inversa";
                return (
                  <label key={service} className="inline-flex items-center gap-3 rounded-xl border border-[#c89d66] bg-white px-4 py-3">
                    <input
                      type="checkbox"
                      value={service}
                      checked={formData.servicios.includes(service)}
                      onChange={handleServiceChange}
                      className="h-4 w-4 text-[#14263a] accent-[#14263a]"
                    />
                    <span className="text-sm text-[#2f4a62]">{t(serviceKey)}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <p className={`mt-2 text-sm text-red-600 ${errors.servicios ? "" : "hidden"}`}>{errors.servicios || ""}</p>
        </div>

        <div className="space-y-2">
          <p className="mb-2 text-sm font-semibold text-[#14263a]">{t("form.label.otro_3pl")}</p>
          <div
            className={`rounded-2xl border bg-[#f3ddba] p-5 ${
              errors.otro_3pl ? "border-red-600 ring-2 ring-red-500/40" : "border-[#c89d66]"
            }`}
          >
            <div className="space-y-3">
              {(["Sí", "No", "Estoy evaluando opciones"] as Other3plType[])
                .filter((value) => value !== "")
                .map((option) => {
                  const optionKey =
                    option === "Sí"
                      ? "form.option.otro_3pl.si"
                      : option === "No"
                        ? "form.option.otro_3pl.no"
                        : "form.option.otro_3pl.evaluando";
                  return (
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
                      <span className="text-sm text-[#2f4a62]">{t(optionKey)}</span>
                    </label>
                  );
                })}
            </div>
          </div>
          <p className={`mt-2 text-sm text-red-600 ${errors.otro_3pl ? "" : "hidden"}`}>{errors.otro_3pl || ""}</p>
        </div>

        <FormField htmlFor="comentarios" label={t("form.label.comentarios")} error={errors.comentarios}>
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
              placeholder={t("form.placeholder.comentarios")}
            />
            <div className="mt-2 flex items-center justify-between gap-4">
              <p className={`text-sm text-red-600 ${errors.comentarios ? "" : "hidden"}`} role="alert">
                {errors.comentarios || ""}
              </p>
              <p className="text-sm text-[#2f4a62]">{t("form.char_remaining", { count: remainingComments })}</p>
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
        <span className="text-sm text-[#2f4a62]">{t("form.label.politica_privacidad")}</span>
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

      <div
        role="alert"
        aria-live="assertive"
        className={`mt-6 rounded-2xl border border-red-400 bg-red-50 px-6 py-4 text-sm text-red-800 ${
          submitError ? "" : "hidden"
        }`}
      >
        <p className="mb-1 font-semibold">{t("form.error.title")}</p>
        <p className="mb-3">{submitError}</p>
        <button
          type="button"
          onClick={() => setSubmitError(null)}
          className="rounded-lg border border-red-400 bg-white px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
        >
          {t("form.error.dismiss")}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#2f4a62]">{t("form.review_text")}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={clearForm}
            className="inline-flex items-center justify-center rounded-xl border border-[#14263a] bg-transparent px-5 py-3 text-sm font-semibold text-[#14263a] transition hover:bg-[#f3ddba]"
          >
            {t("form.clear_btn")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-[#14263a] px-5 py-3 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:cursor-not-allowed disabled:opacity-60"
          >
{submitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("form.sending")}
              </span>
            ) : (
              t("form.submit_btn")
            )}
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
        <p className="mb-3 font-semibold">{t("form.success.title")}</p>
        <p className="mb-3">
          {t("form.success.message")}
        </p>
        <p>
          {t("form.success.urgent")}<a href="mailto:comercial@trackflow.com" className="font-semibold underline">
            comercial@trackflow.com
          </a>
        </p>
      </div>
    </form>
  );
}
