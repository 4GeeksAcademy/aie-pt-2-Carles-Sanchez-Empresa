"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t("auth.forgot.email_required"));
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Ignoramos errores para no filtrar información
    } finally {
      setSent(true);
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-[#14263a]">{t("auth.forgot.sent_title")}</h2>
            <p className="mt-2 text-sm text-[#2f4a62]">
              {t("auth.forgot.sent_body")}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-[#14263a] px-6 py-2.5 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a]"
            >
              {t("auth.forgot.back_to_login")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">🔑</div>
            <h2 className="text-2xl font-bold text-[#14263a]">{t("auth.forgot.title")}</h2>
            <p className="mt-1 text-sm text-[#2f4a62]">
              {t("auth.forgot.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="emailField" className="mb-1 block text-sm font-medium text-[#14263a]">{t("auth.forgot.email_label")}</label>
              <input
                id="emailField"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder={t("auth.forgot.email_placeholder")}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2.5 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#2f4a62]">
            {t("auth.forgot.remembered")}{" "}
            <Link href="/login" className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4 hover:text-[#1d4f7a]">
              {t("auth.forgot.login_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6"><p className="text-[#2f4a62]">{t("app.loading")}</p></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}