"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, Suspense } from "react";
import { getToken, login } from "@/services/auth";
import { useTranslation } from "@/lib/i18n";
import { LoadingSpinner } from "@/components/LoadingSpinner";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get("redirect");
    return redirect && redirect.startsWith("/") ? redirect : "/";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionExpired = searchParams.get("reason") === "session_expired";

  useEffect(() => {
    if (getToken()) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(t("auth.login.error_empty_email"));
      return;
    }

    if (!password) {
      setError(t("auth.login.error_empty_password"));
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanEmail, password);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.login.error_unknown"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#14263a]">{t("auth.login.title")}</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">{t("auth.login.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2f4a62]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder={t("auth.login.email_placeholder")}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2f4a62]">
              {t("auth.login.password_label")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#c89d66] bg-[#f8fbff] px-3 py-2 text-sm text-[#2f4a62] placeholder:text-[#9ab0c4] focus:outline-none focus:ring-2 focus:ring-[#c89d66]"
              placeholder="••••••••"
              required
            />
            <div className="mt-1 text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#2f4a62] underline decoration-[#c89d66] underline-offset-2 hover:text-[#14263a]"
              >
                {t("auth.login.forgot_password")}
              </Link>
            </div>
          </div>

          {(error || sessionExpired) && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error || t("auth.login.session_expired")}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-[#c89d66] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] transition hover:bg-[#1d4f7a] disabled:opacity-50"
          >
            {isSubmitting ? t("auth.login.loading") : t("auth.login.submit")}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#2f4a62]">
          <Link href="/register" className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4">
            {t("auth.login.register_link")}
          </Link>
        </p>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Cargando…" />}>
      <LoginForm />
    </Suspense>
  );
}
