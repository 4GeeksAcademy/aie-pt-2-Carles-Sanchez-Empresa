import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description:
    "Recupera el acceso a tu cuenta de TrackFlow Backoffice. Enviaremos un enlace de restablecimiento a tu correo electrónico.",
  alternates: {
    canonical: "/forgot-password",
    languages: { es: "/forgot-password", en: "/forgot-password", "x-default": "/forgot-password" },
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}