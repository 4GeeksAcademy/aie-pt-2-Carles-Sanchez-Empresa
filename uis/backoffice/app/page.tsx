"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getToken } from "@trackflow/core/services/auth";
import { useTranslation } from "@/lib/i18n";

interface RfpNotification {
  ticket_id: string;
  rfp_id: string;
  client_name: string | null;
  client_country: string | null;
  status: string;
  processing_failed: boolean;
  created_at: string;
}

const VISIBLE_NOTIFICATIONS = 3;
const POLL_INTERVAL_MS = 4_000;
const INACTIVE_STATUSES = new Set(["done", "descartado", "archived", "returned_to_client"]);
const STATUS_KEYS: Record<string, string> = {
  analizando: "rfp.status_analyzing",
  analisis_completo: "rfp.status_complete",
  descartado: "rfp.status_discarded",
  waiting_for_approval: "rfp.status_waiting_approval",
  needs_human_review: "rfp.status_needs_human_review",
  returned_to_client: "rfp.status_returned_to_client",
  archived: "rfp.status_archived",
  done: "rfp.status_done",
  generando_borrador: "rfp.status_generating_draft",
  "en_evaluación": "rfp.status_evaluating",
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<RfpNotification[]>([]);
  const [connection, setConnection] = useState<"connecting" | "connected" | "reconnecting">("connecting");
  const [recovered, setRecovered] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const lastEventId = useRef(typeof window === "undefined" ? "0" : window.sessionStorage.getItem("rfp-sse-last-id") ?? "0");

  useEffect(() => {
    let stopped = false;
    let recovering = false;
    let retryDelay = 1000;
    let reconnectTimer: number | undefined;
    let controller: AbortController | undefined;
    const recoveryController = new AbortController();

    const recoverMissed = async () => {
      if (stopped || recovering) return;
      recovering = true;
      try {
        const token = getToken();
        if (!token) throw new Error("Missing access token");
        const response = await fetch("/api/rfp-intake/tickets", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: recoveryController.signal,
        });
        if (!response.ok) throw new Error(`Ticket recovery failed: ${response.status}`);
        const tickets = await response.json() as RfpNotification[];
        if (stopped) return;
        setNotifications(tickets.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)));
        setRecovered(true);
        setRecoveryFailed(false);
      } catch (error) {
        if (stopped) return;
        console.error("RFP dashboard ticket refresh failed", error);
        setRecoveryFailed(true);
      } finally {
        recovering = false;
      }
    };

    const parseStream = async (response: Response) => {
      if (!response.body) throw new Error("SSE response has no readable body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventName = "";
      let data = "";
      let frameId = "";
      const dispatch = () => {
        if (eventName === "rfp_ticket_created" && data) {
          void recoverMissed();
          if (frameId) {
            lastEventId.current = frameId;
            window.sessionStorage.setItem("rfp-sse-last-id", frameId);
          }
        }
        eventName = "";
        data = "";
        frameId = "";
      };

      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          for (const line of frame.split("\n")) {
            if (line.startsWith(":")) continue;
            const colon = line.indexOf(":");
            const field = colon < 0 ? line : line.slice(0, colon);
            const valueText = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
            if (field === "event") eventName = valueText;
            if (field === "data") data += `${data ? "\n" : ""}${valueText}`;
            if (field === "id") frameId = valueText;
          }
          dispatch();
          boundary = buffer.indexOf("\n\n");
        }
      }
      await reader.cancel().catch(() => undefined);
      if (!stopped) throw new Error("SSE stream closed");
    };

    const connect = async () => {
      if (stopped) return;
      controller = new AbortController();
      try {
        const token = getToken();
        if (!token) throw new Error("Missing access token");
        const headers: Record<string, string> = { Authorization: `Bearer ${token}`, Accept: "text/event-stream" };
        headers["Last-Event-ID"] = lastEventId.current;
        const response = await fetch("/api/rfp-intake/tickets/events", {
          headers,
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`SSE request failed: ${response.status}`);
        setConnection("connected");
        retryDelay = 1000;
        await parseStream(response);
      } catch (error) {
        if (stopped || (error instanceof DOMException && error.name === "AbortError")) return;
        setConnection("reconnecting");
        await recoverMissed();
        const delay = retryDelay;
        retryDelay = Math.min(retryDelay * 2, 30_000);
        reconnectTimer = window.setTimeout(() => void connect(), delay);
      }
    };

    const refreshTimer = window.setInterval(() => void recoverMissed(), POLL_INTERVAL_MS);
    void recoverMissed().finally(() => {
      if (!stopped) void connect();
    });
    return () => {
      stopped = true;
      controller?.abort();
      recoveryController.abort();
      window.clearInterval(refreshTimer);
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
    };
  }, []);

  const pendingNotifications = notifications.filter((item) => !INACTIVE_STATUSES.has(item.status));
  const additionalCount = Math.max(0, pendingNotifications.length - VISIBLE_NOTIFICATIONS);
  const connectionLabel = connection === "connected" ? t("dashboard.sse.connected")
    : connection === "reconnecting" ? t("dashboard.sse.reconnecting") : t("dashboard.sse.connecting");

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold text-[#14263a]">{t("dashboard.home.title")}</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">{t("dashboard.home.subtitle")}</p>
      </header>
      <section className="rounded-xl border-2 border-[#c89d66] bg-[#f3ddba] p-5 shadow-sm" aria-labelledby="rfp-notifications-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c89d66] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="rfp-notifications-title" className="text-lg font-semibold text-[#14263a]">{t("dashboard.rfp.title")}</h2>
              {additionalCount > 0 && (
                <Link href="/rfp-intake" className="inline-flex min-h-11 items-center rounded-full bg-red-700 px-3 py-1 text-sm font-semibold text-white hover:bg-red-800">
                  +{additionalCount} {t("dashboard.rfp.more")}
                </Link>
              )}
            </div>
            <p className="mt-1 text-sm">{t("dashboard.rfp.subtitle")}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connection === "connected" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`} role="status">
            {connectionLabel}{recovered ? ` · ${t("dashboard.sse.recovered")}` : ""}
          </span>
        </div>
        {recoveryFailed && <p role="alert" className="mt-4 text-sm text-red-800">{t("rfp.error_list")}</p>}
        {!recovered ? (
          <p role="status" className="py-8 text-center text-sm">{t("rfp.loading")}</p>
        ) : pendingNotifications.length === 0 ? (
          <p className="py-8 text-center text-sm">{t("dashboard.rfp.empty")}</p>
        ) : (
          <ul className="mt-4 space-y-3" aria-live="polite">
            {pendingNotifications.slice(0, VISIBLE_NOTIFICATIONS).map((item) => (
              <li key={item.ticket_id} className="flex flex-col gap-4 rounded-lg border-l-4 border-[#1d4f7a] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[#14263a]">{t("dashboard.rfp.new_ticket")}</p>
                  <p className="mt-1 break-all font-mono text-xs">{item.ticket_id}</p>
                  <p className="mt-1 text-sm">{t("dashboard.rfp.reference")}: {item.rfp_id}</p>
                  <p className="mt-1 text-xs">{t("dashboard.rfp.status")}: {item.processing_failed ? t("rfp.status_failed") : STATUS_KEYS[item.status] ? t(STATUS_KEYS[item.status]) : item.status} · {new Date(item.created_at).toLocaleString()}</p>
                </div>
                <Link href="/rfp-intake" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#14263a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4f7a]">
                  {t("dashboard.rfp.open")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}