import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  description:
    "Establece una nueva contraseña para tu cuenta de TrackFlow Backoffice. Esta página es privada y requiere un token válido.",
  alternates: {
    canonical: "/reset-password",
  },
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}