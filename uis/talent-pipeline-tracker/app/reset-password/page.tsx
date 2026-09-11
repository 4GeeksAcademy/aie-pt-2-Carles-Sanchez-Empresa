"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { resetPassword } from "@/services/auth";
import { useTranslation } from "@/lib/i18n";

function ResetForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t("reset.invalid_link"));
      return;
    }

    if (password.length < 6) {
      setError(t("reset.error_min_length"));
      return;
    }

    if (password !== confirm) {
      setError(t("reset.error_mismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reset.invalid_link"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token && !success) {
    return (
      <div className="mt-6 space-y-4">
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t("reset.invalid_link")}
        </p>
        <Link
          href="/forgot-password"
          className="block text-center text-sm font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4"
        >
          {t("reset.request_new_link")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {success ? (
        <div className="mt-6 space-y-4">
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t("reset.success")}
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
            <label htmlFor="reset-password" className="block text-sm font-medium text-[#2f4a62]">
              {t("reset.password_label")}
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder={t("reset.password_placeholder")}
              required
            />
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-[#2f4a62]">
              {t("reset.confirm_label")}
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder={t("reset.confirm_placeholder")}
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
            {isSubmitting ? t("reset.submitting") : t("reset.submit")}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#14263a]">{t("reset.title")}</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">{t("reset.subtitle")}</p>

        <Suspense fallback={<p className="mt-6 text-sm text-[#2f4a62]">Loading...</p>}>
          <ResetForm />
        </Suspense>
      </section>
    </div>
  );
}