"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { login, getToken } from "@trackflow/core";

function LoginForm() {
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
  const passwordReset = searchParams.get("reason") === "password_reset";

  useEffect(() => {
    if (getToken()) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">🔐</div>
            <h2 className="text-2xl font-bold text-[#14263a]">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-[#2f4a62]">Accede al panel de TrackFlow</p>
          </div>

          {sessionExpired && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
              ⏰ Tu sesión ha expirado. Inicia sesión de nuevo.
            </div>
          )}

          {passwordReset && (
            <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
              ✅ Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="emailField" className="mb-1 block text-sm font-medium text-[#14263a]">Email *</label>
              <input
                id="emailField"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="passwordField" className="mb-1 block text-sm font-medium text-[#14263a]">Contraseña *</label>
              <input
                id="passwordField"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#c89d66] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#14263a] outline-none transition focus:border-[#14263a] focus:ring-2 focus:ring-[#14263a]/20"
                placeholder="••••••••"
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
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#2f4a62]">
            <Link href="/forgot-password" className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4 hover:text-[#1d4f7a]">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-[#2f4a62]">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-[#14263a] underline decoration-[#c89d66] underline-offset-4 hover:text-[#1d4f7a]">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6"><p className="text-[#2f4a62]">Cargando...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}