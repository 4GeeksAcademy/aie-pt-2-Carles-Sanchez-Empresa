"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold text-[#14263a] mb-2">{t("auth.reset.invalid_title")}</h2>
            <p className="text-sm text-[#2f4a62] mb-4">
              {t("auth.reset.invalid_body")}
            </p>
            <Link
              href="/forgot-password"
              className="inline-block rounded-lg bg-[#14263a] px-6 py-2.5 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a]"
            >
              {t("auth.reset.request_new")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError(t("auth.reset.error.password_length"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.reset.error.password_mismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (res.ok) {
        router.push("/login?reason=password_reset");
      } else {
        const data = await res.json();
        setError(data.detail || t("auth.reset.error.invalid_token"));
      }
    } catch {
      setError(t("auth.reset.error.connection"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">🔐</div>
            <h2 className="text-2xl font-bold text-[#14263a]">{t("auth.reset.title")}</h2>
            <p className="mt-1 text-sm text-[#2f4a62]">
              {t("auth.reset.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="passwordField" className="mb-1 block text-sm font-medium text-[#14263a]">{t("auth.reset.password_label")}</label>
              <input
                id="passwordField"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder={t("auth.reset.password_placeholder")}
              />
            </div>
            <div>
              <label htmlFor="confirmField" className="mb-1 block text-sm font-medium text-[#14263a]">{t("auth.reset.confirm_label")}</label>
              <input
                id="confirmField"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder={t("auth.reset.confirm_placeholder")}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
                {error}{" "}
                <Link href="/forgot-password" className="underline font-medium">{t("auth.reset.request_new_link")}</Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2.5 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("auth.reset.submitting") : t("auth.reset.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6"><p className="text-[#2f4a62]">{t("app.loading")}</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}