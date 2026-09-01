"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { register, getToken } from "@trackflow/core";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.register.password_mismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.register.password_min_length"));
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ email, password, name: name || undefined });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.register.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">📝</div>
            <h2 className="text-2xl font-bold text-[#14263a]">{t("auth.register.title")}</h2>
            <p className="mt-1 text-sm text-[#2f4a62]">{t("auth.register.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nameField" className="mb-1 block text-sm font-medium text-[#14263a]">
                {t("auth.register.name_label")} <span className="font-normal text-[#2f4a62]">{t("auth.register.name_optional")}</span>
              </label>
              <input
                id="nameField"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder={t("auth.register.name_placeholder")}
              />
            </div>

            <div>
              <label htmlFor="emailField" className="mb-1 block text-sm font-medium text-[#14263a]">
                {t("auth.register.email_label")} *
              </label>
              <input
                id="emailField"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder={t("auth.register.email_placeholder")}
              />
            </div>

            <div>
              <label htmlFor="passwordField" className="mb-1 block text-sm font-medium text-[#14263a]">
                {t("auth.register.password_label")} *
              </label>
              <input
                id="passwordField"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder={t("auth.register.password_placeholder")}
              />
            </div>

            <div>
              <label htmlFor="confirmPasswordField" className="mb-1 block text-sm font-medium text-[#14263a]">
                {t("auth.register.confirm_label")} *
              </label>
              <input
                id="confirmPasswordField"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder={t("auth.register.password_placeholder")}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2.5 text-sm font-semibold text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#2f4a62]">
            {t("auth.register.has_account")}{" "}
            <Link href="/login" className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4 hover:text-[#1d4f7a]">
              {t("auth.register.login_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}