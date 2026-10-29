"use client";

import { useRef, useState, type FormEvent, type ReactElement } from "react";
import { useTranslation } from "@/lib/i18n";
import { querySupportAgent } from "@/services/api";

const FREQUENT_QUESTIONS = [
  "knowledge.suggested.returns",
  "knowledge.suggested.carriers",
  "knowledge.suggested.sla",
  "knowledge.suggested.storage",
];

export default function KnowledgePage(): ReactElement {
  const { t, lang } = useTranslation();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const conversationId = useRef<string | undefined>(undefined);

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>, customQuestion?: string): Promise<void> => {
    if (event) event.preventDefault();
    const queryText = (customQuestion ?? question).trim();
    if (!queryText || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setLastQuery(queryText);

    try {
      const data = await querySupportAgent(queryText, conversationId.current);
      conversationId.current = data.thread_id;
      setAnswer(data.answer);
    } catch (err: unknown) {
      const msg = err instanceof Error && !(err instanceof TypeError)
        ? err.message
        : t("knowledge.error_connection");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggested = (suggestedQuestion: string): void => {
    setQuestion(suggestedQuestion);
    void handleSubmit(undefined, suggestedQuestion);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-[#2f4a62] sm:p-6">
      {/* Encabezado */}
      <div className="border-b border-[#c89d66] pb-5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#14263a]">
              {t("knowledge.title")}
            </h1>
            <p className="text-sm text-[#2f4a62]">
              {t("knowledge.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-[#c89d66] bg-[#f3ddba] p-4 shadow-sm sm:p-6">
      {lang === "en" && (
        <p role="note" className="border-l-4 border-[#c89d66] bg-[#f8fbff] px-4 py-3 text-sm text-[#2f4a62]">
          {t("knowledge.spanish_only_notice")}
        </p>
      )}
      {/* Sugerencias de consultas frecuentes */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-[#14263a]">
          {t("knowledge.suggested_title")}
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FREQUENT_QUESTIONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectSuggested(t(key))}
              disabled={loading}
              className="flex min-h-16 items-center rounded-lg border border-[#c89d66] bg-[#f3ddba] p-4 text-left text-sm font-medium text-[#14263a] shadow-sm transition-colors hover:bg-[#e5be83] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14263a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="min-w-0 break-words">{t(key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario de consulta */}
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="knowledge-question" className="block text-sm font-semibold text-[#14263a]">
            {t("knowledge.input_label")}
          </label>
          <textarea
            id="knowledge-question"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t("knowledge.input_placeholder")}
            disabled={loading}
            className="min-h-32 w-full resize-y rounded-lg border border-[#c89d66] bg-[#f8fbff] p-4 text-base text-[#14263a] shadow-sm placeholder:text-[#2f4a62]/70 focus:border-[#14263a] focus:outline-none focus:ring-2 focus:ring-[#c89d66]/50 disabled:opacity-60 sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-xs text-[#2f4a62]">
            {t("knowledge.disclaimer")}
          </p>
          <div className="flex shrink-0 justify-end gap-2">
            {question && (
              <button
                type="button"
                onClick={() => setQuestion("")}
                disabled={loading}
                className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-[#2f4a62] transition-colors hover:bg-[#f3ddba] focus-visible:outline-2 focus-visible:outline-[#14263a]"
              >
                {t("knowledge.clear")}
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-lg bg-[#14263a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4f7a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14263a] disabled:cursor-not-allowed disabled:opacity-50"
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
                  <span>{t("knowledge.consulting")}</span>
                </>
              ) : (
                <>
                  <span>{t("knowledge.ask_button")}</span>
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Estado de carga */}
      {loading && (
        <div role="status" className="border-y border-[#c89d66] bg-[#f3ddba]/50 p-6 text-center">
          <div aria-hidden="true" className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#14263a] border-t-transparent">
          </div>
          <p className="mt-3 text-sm font-medium text-[#14263a]">
            {t("knowledge.loading_text")}
          </p>
          <p className="mt-1 text-xs text-[#2f4a62]">
            {t("knowledge.loading_subtext")}
          </p>
        </div>
      )}

      {/* Estado de error */}
      {error && !loading && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-5 text-red-900">
          <div className="flex items-start gap-3">
            <div className="min-w-0 space-y-1 break-words">
              <h3 className="text-sm font-semibold text-red-800">
                {t("knowledge.error_title")}
              </h3>
              <p className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => void handleSubmit(undefined, lastQuery ?? undefined)}
                className="mt-2 min-h-11 text-sm font-semibold text-red-800 underline hover:no-underline"
              >
                {t("knowledge.retry")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultado generado */}
      {answer && !loading && (
        <section aria-live="polite" aria-label={t("knowledge.official_answer")} className="space-y-4 border-y border-[#c89d66] py-6">
          <div className="flex flex-col gap-2 border-b border-[#c89d66]/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              <h2 className="text-sm font-semibold text-[#14263a]">
                {t("knowledge.official_answer")}
              </h2>
            </div>
            {lastQuery && (
              <span className="min-w-0 break-words text-xs italic text-[#2f4a62] sm:max-w-md">
                &ldquo;{lastQuery}&rdquo;
              </span>
            )}
          </div>

          <div className="whitespace-pre-line break-words text-sm leading-relaxed text-[#14263a]">
            {answer}
          </div>

          <div className="border-t border-[#c89d66]/50 pt-3 text-xs text-[#2f4a62]">
            {t("knowledge.footer_note")}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
