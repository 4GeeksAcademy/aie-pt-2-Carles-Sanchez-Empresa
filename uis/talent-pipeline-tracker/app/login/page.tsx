"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getToken, login } from "@/services/auth";

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
      setError("Introduce tu email.");
      return;
    }

    if (!password) {
      setError("Introduce tu contraseña.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanEmail, password);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[#c89d66] bg-[#f3ddba] p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#14263a]">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-[#2f4a62]">Accede al Talent Pipeline Tracker de TrackFlow.</p>

        {sessionExpired && (
          <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            Tu sesión ha expirado. Inicia sesión de nuevo.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2f4a62]">
              Contraseña
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#c89d66] px-4 py-2 text-sm font-medium text-[#14263a] transition hover:bg-[#b88a4d] disabled:opacity-50"
          >
            {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#2f4a62]">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-[#c89d66] hover:underline">
            Regístrate
          </Link>
        </p>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-10">
        <p className="text-[#2f4a62]">⏳ Cargando...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
