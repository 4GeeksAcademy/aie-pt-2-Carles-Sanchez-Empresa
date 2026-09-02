"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPassword } from "@/services/auth";
import { useTranslation } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(t("forgot.error_empty_email"));
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(cleanEmail);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forgot.error_unknown"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#14263a]">{t("forgot.title")}</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">{t("forgot.subtitle")}</p>

        {success ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {t("forgot.success")}
            </p>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4"
            >
              {t("forgot.back_to_login")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2f4a62]">
                {t("forgot.email_label")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
                placeholder={t("forgot.email_placeholder")}
                required
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50"
            >
              {isSubmitting ? t("forgot.submitting") : t("forgot.submit")}
            </button>

            <p className="text-center text-sm text-[#2f4a62]">
              <Link
                href="/login"
                className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4"
              >
                {t("forgot.back_to_login")}
              </Link>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}