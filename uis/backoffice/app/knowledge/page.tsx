"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

interface QueryResponse {
  answer: string;
}

const FREQUENT_QUESTIONS = [
  "¿Cuál es la ventana de devolución estándar y cómo funcionan las internacionales?",
  "¿Qué transportistas usamos en Los Ángeles y cuál es mejor para paquetes de más de 5 kg?",
  "¿Qué garantía de SLA dais durante el Black Friday y fechas de alta demanda?",
  "¿Cómo se calculan las tarifas de almacenamiento y qué descuentos hay para más de 50 m³?",
];

export default function KnowledgePage() {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customQuestion?: string) => {
    if (e) e.preventDefault();
    const queryText = (customQuestion ?? question).trim();
    if (!queryText || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setLastQuery(queryText);

    try {
      const response = await fetch(`${API_BASE}/knowledge/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: queryText }),
      });

      if (!response.ok) {
        let errMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData?.detail) errMessage = errData.detail;
        } catch {
          // Si no es JSON válido, usamos el statusText
        }
        throw new Error(errMessage);
      }

      const data: QueryResponse = await response.json();
      setAnswer(data.answer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con la base de conocimiento.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggested = (q: string) => {
    setQuestion(q);
    void handleSubmit(undefined, q);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Encabezado */}
      <div className="border-b border-gray-200 pb-5 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            🤖
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {t("knowledge.title") || "Asistente de Base de Conocimiento"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("knowledge.subtitle") ||
                "Consulta acuerdos estándar, SLAs, políticas de devolución, transportistas y tarifas oficiales de TrackFlow."}
            </p>
          </div>
        </div>
      </div>

      {/* Sugerencias de consultas frecuentes */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t("knowledge.suggested_title") || "Preguntas frecuentes de clientes y prospectos"}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FREQUENT_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggested(q)}
              disabled={loading}
              className="group flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs font-medium text-gray-700 shadow-sm transition hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
            >
              <span className="text-blue-500 transition group-hover:translate-x-0.5">💬</span>
              <span className="line-clamp-2">{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario de consulta */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="relative">
          <label htmlFor="knowledge-question" className="sr-only">
            {t("knowledge.input_label") || "Pregunta"}
          </label>
          <textarea
            id="knowledge-question"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              t("knowledge.input_placeholder") ||
              "Escribe tu consulta sobre políticas, coberturas, SLAs o tarifas... (ej. ¿Cuál es el compromiso de entrega express en Zaragoza?)"
            }
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:disabled:bg-gray-800"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("knowledge.disclaimer") || "Las respuestas se generan en base a los acuerdos y documentos oficiales de TrackFlow."}
          </p>
          <div className="flex gap-2">
            {question && (
              <button
                type="button"
                onClick={() => setQuestion("")}
                disabled={loading}
                className="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {t("knowledge.clear") || "Limpiar"}
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{t("knowledge.consulting") || "Consultando..."}</span>
                </>
              ) : (
                <>
                  <span>{t("knowledge.ask_button") || "Preguntar al Asistente"}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Estado de carga */}
      {loading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 text-center dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="mx-auto flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400">
            <span className="sr-only">Cargando</span>
          </div>
          <p className="mt-3 text-sm font-medium text-blue-900 dark:text-blue-200">
            {t("knowledge.loading_text") || "Buscando en la base de conocimiento y redactando la respuesta..."}
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
            {t("knowledge.loading_subtext") || "Consultando Qdrant y verificando políticas comerciales oficiales."}
          </p>
        </div>
      )}

      {/* Estado de error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                {t("knowledge.error_title") || "No fue posible obtener una respuesta"}
              </h3>
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
              <button
                type="button"
                onClick={() => void handleSubmit(undefined, lastQuery ?? undefined)}
                className="mt-2 text-xs font-semibold text-red-800 underline hover:no-underline dark:text-red-300"
              >
                {t("knowledge.retry") || "Reintentar consulta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultado generado */}
      {answer && !loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t("knowledge.official_answer") || "Respuesta Oficial del Asistente Comercial"}
              </span>
            </div>
            {lastQuery && (
              <span className="line-clamp-1 max-w-xs text-xs italic text-gray-400 dark:text-gray-500 sm:max-w-md">
                &ldquo;{lastQuery}&rdquo;
              </span>
            )}
          </div>

          <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">
            {answer}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            {t("knowledge.footer_note") ||
              "Fuente: Políticas estándar de TrackFlow (SLA, Devoluciones, Transportistas y Almacenamiento)."}
          </div>
        </div>
      )}
    </div>
  );
}
