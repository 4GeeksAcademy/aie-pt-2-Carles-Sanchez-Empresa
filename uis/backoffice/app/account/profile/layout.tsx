import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi perfil",
  description:
    "Gestiona tu perfil y datos personales en TrackFlow Backoffice: nombre, teléfono y dirección de contacto.",
  alternates: {
    canonical: "/account/profile",
  },
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}