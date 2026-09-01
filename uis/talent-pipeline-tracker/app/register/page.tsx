"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getToken, isValidPhoneForRegister, register } from "@/services/auth";
import { useTranslation } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);
    setGenericError(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    let hasError = false;

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setEmailError(t("auth.register.error_invalid_email"));
      hasError = true;
    }

    if (!password || password.length < 6) {
      setPasswordError(t("auth.register.error_password_min"));
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmError(t("auth.register.error_password_mismatch"));
      hasError = true;
    }

    if (cleanPhone && !isValidPhoneForRegister(cleanPhone)) {
      setEmailError(t("auth.register.error_invalid_phone"));
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await register({
        email: cleanEmail,
        password,
        name: cleanName || undefined,
        phone: cleanPhone || undefined,
      });
      router.replace("/");
    } catch (err) {
      setGenericError(err instanceof Error ? err.message : t("auth.register.error_unknown"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#14263a]">{t("auth.register.title")}</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">{t("auth.register.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#2f4a62]">
              {t("auth.register.name_label")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder={t("auth.register.name_placeholder")}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-[#2f4a62]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="tu@email.com"
              required
            />
            {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-[#2f4a62]">
              {t("auth.register.phone_label")}
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-[#2f4a62]">
              {t("auth.register.password_label")} <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="••••••••"
              required
            />
            {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-[#2f4a62]">
              {t("auth.register.confirm_label")} <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="••••••••"
              required
            />
            {confirmError && <p className="mt-1 text-xs text-red-600">{confirmError}</p>}
          </div>

          {genericError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{genericError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50"
          >
            {isSubmitting ? t("auth.register.loading") : t("auth.register.submit")}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#2f4a62]">
          <Link href="/login" className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4">
            {t("auth.register.login_link")}
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-[#2f4a62]">
          <Link
            href="/forgot-password"
            className="font-medium underline decoration-[#c89d66] underline-offset-2 hover:text-[#14263a]"
          >
            {t("auth.register.forgot_password")}
          </Link>
        </p>
      </section>
    </div>
  );
}
