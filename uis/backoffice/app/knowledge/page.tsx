"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactElement } from "react";
import { getToken } from "@trackflow/core/services/auth";
import { useTranslation } from "@/lib/i18n";
import { createChatSession } from "@/services/api";

const FREQUENT_QUESTIONS = [
  "knowledge.suggested.returns",
  "knowledge.suggested.carriers",
  "knowledge.suggested.sla",
  "knowledge.suggested.storage",
];

interface ChatMessage {
  message_id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  status: "completed" | "streaming" | "interrupted";
  created_at: string;
}

interface ChatEvent { event: string; data: Record<string, unknown> }

export default function KnowledgePage(): ReactElement {
  const { t, lang } = useTranslation();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const sessionId = useRef<string | undefined>(undefined);
  const socket = useRef<WebSocket | null>(null);
  const retryTimer = useRef<number | undefined>(undefined);
  const retryDelay = useRef(1000);
  const stopped = useRef(false);
  const pendingSession = useRef<Promise<string> | null>(null);

  const connect = async (): Promise<void> => {
    if (stopped.current || socket.current?.readyState === WebSocket.OPEN || socket.current?.readyState === WebSocket.CONNECTING) return;
    try {
      if (!sessionId.current) {
        pendingSession.current ??= createChatSession().then((session) => {
          sessionId.current = session.session_id;
          return session.session_id;
        });
        await pendingSession.current;
        pendingSession.current = null;
      }
      const token = getToken();
      if (!token) throw new Error("Sesión expirada. Inicia sesión de nuevo.");
      // In Docker, `localhost:8000` from the browser is the host-published API
      // port; the container-only hostname `api` must never be exposed here.
      // Otherwise use the same-origin API path only when an upstream proxy is
      // explicitly configured to support WebSocket upgrades.
      const configuredWsUrl = process.env.NEXT_PUBLIC_API_WS_URL?.trim();
      const wsOrigin = configuredWsUrl || `${window.location.origin.replace(/^http/, "ws")}/api`;
      const wsUrl = new URL(wsOrigin, window.location.origin.replace(/^http/, "ws"));
      if (wsUrl.hostname === "api" && window.location.hostname !== "api") {
        throw new Error("NEXT_PUBLIC_API_WS_URL debe usar un host accesible desde el navegador, no el nombre interno 'api'.");
      }
      const ws = new WebSocket(`${wsUrl.href.replace(/\/$/, "")}/agent/chat/ws/${sessionId.current}?token=${encodeURIComponent(token)}`);
      socket.current = ws;
      ws.onopen = () => { setConnected(true); retryDelay.current = 1000; };
      ws.onclose = () => {
        setConnected(false);
        if (!stopped.current) {
          const delay = retryDelay.current;
          retryDelay.current = Math.min(delay * 2, 30000);
          retryTimer.current = window.setTimeout(() => void connect(), delay);
        }
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (messageEvent) => {
        let frame: ChatEvent;
        try { frame = JSON.parse(messageEvent.data) as ChatEvent; } catch { return; }
        const data = frame.data;
        if (frame.event === "session_snapshot" && Array.isArray(data.messages)) {
          const snapshotMessages = data.messages as ChatMessage[];
          setMessages(snapshotMessages);
          setLoading(snapshotMessages.some((item) => item.status === "streaming"));
        } else if (frame.event === "user_message" && typeof data.message_id === "string") {
          setMessages((current) => [...current.filter((item) => item.message_id !== data.message_id), data as unknown as ChatMessage]);
          setLoading(true);
        } else if (frame.event === "assistant_message" && typeof data.message_id === "string") {
          setMessages((current) => [...current.filter((item) => item.message_id !== data.message_id), data as unknown as ChatMessage]);
          setLoading(true);
        } else if (frame.event === "token_chunk" && typeof data.message_id === "string" && typeof data.token === "string") {
          setMessages((current) => {
            const exists = current.some((item) => item.message_id === data.message_id);
            if (exists) {
              return current.map((item) => item.message_id === data.message_id
                ? { ...item, content: item.content + (data.token as string), status: "streaming" } : item);
            }
            return [...current, {
              message_id: data.message_id as string,
              session_id: data.session_id as string,
              role: "assistant",
              content: data.token as string,
              status: "streaming",
              created_at: new Date().toISOString(),
            }];
          });
        } else if (frame.event === "generation_completed" && typeof data.message_id === "string") {
          setMessages((current) => {
            const exists = current.some((item) => item.message_id === data.message_id);
            if (exists) {
              return current.map((item) => item.message_id === data.message_id
                ? { ...item, ...(typeof data.content === "string" ? { content: data.content } : {}), status: "completed" } : item);
            }
            return [...current, {
              message_id: data.message_id as string,
              session_id: data.session_id as string,
              role: "assistant",
              content: typeof data.content === "string" ? data.content : "",
              status: "completed",
              created_at: new Date().toISOString(),
            }];
          });
          setLoading(false);
        } else if (frame.event === "generation_interrupted" && typeof data.message_id === "string") {
          setMessages((current) => current.map((item) => item.message_id === data.message_id
            ? { ...item, ...(typeof data.content === "string" ? { content: data.content } : {}), status: "interrupted" } : item));
          setLoading(false);
        } else if (frame.event === "generation_failed") {
          setError(typeof data.message === "string" ? data.message : t("knowledge.error_connection"));
          setLoading(false);
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : t("knowledge.error_connection"));
      if (!stopped.current) {
        const delay = retryDelay.current;
        retryDelay.current = Math.min(delay * 2, 30000);
        retryTimer.current = window.setTimeout(() => void connect(), delay);
      }
    }
  };

  useEffect(() => {
    stopped.current = false;
    void connect();
    return () => {
      stopped.current = true;
      if (retryTimer.current !== undefined) window.clearTimeout(retryTimer.current);
      socket.current?.close();
    };
  }, []);

  const sendMessage = (text: string, interrupt: boolean): void => {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !sessionId.current) {
      setError(t("knowledge.error_connection"));
      return;
    }
    setError(null);
    setLastQuery(text);
    setQuestion("");
    setLoading(true);
    ws.send(JSON.stringify({
      event: interrupt ? "interrupt_requested" : "user_message",
      data: interrupt ? { session_id: sessionId.current, new_input: text } : { session_id: sessionId.current, text },
    }));
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>, customQuestion?: string): Promise<void> => {
    if (event) event.preventDefault();
    const queryText = (customQuestion ?? question).trim();
    if (!queryText) return;
    sendMessage(queryText, loading);
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
              disabled={loading || !connected}
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
            disabled={!connected}
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
                disabled={!connected}
                className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-[#2f4a62] transition-colors hover:bg-[#f3ddba] focus-visible:outline-2 focus-visible:outline-[#14263a]"
              >
                {t("knowledge.clear")}
              </button>
            )}
            <button
              type="submit"
              disabled={!connected || !question.trim()}
              className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-lg bg-[#14263a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4f7a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14263a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{loading ? "Interrumpir y enviar" : t("knowledge.ask_button")}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </form>

      <p role="status" className="text-xs text-[#2f4a62]">{connected ? "Chat conectado" : "Reconectando al chat…"}</p>
      {messages.length > 0 && (
        <section aria-live="polite" aria-label={t("knowledge.official_answer")} className="space-y-4 border-y border-[#c89d66] py-6">
          {messages.map((message) => (
            <article key={message.message_id} className={`rounded-lg p-4 ${message.role === "user" ? "ml-auto max-w-[85%] bg-[#14263a] text-white" : "mr-auto max-w-[90%] bg-[#f8fbff] text-[#14263a]"}`}>
              <p className="mb-1 text-xs font-semibold">{message.role === "user" ? "Tú" : "Trackflow Agent"}{message.status === "interrupted" ? " · interrumpido" : ""}</p>
              <div className="whitespace-pre-line break-words text-sm leading-relaxed">{message.content}{message.status === "streaming" ? "▍" : ""}</div>
            </article>
          ))}
        </section>
      )}

      {/* Estado de carga */}
      {loading && !messages.some((message) => message.status === "streaming") && (
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

      </div>
    </div>
  );
}
