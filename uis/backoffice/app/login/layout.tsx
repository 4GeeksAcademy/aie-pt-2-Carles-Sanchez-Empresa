import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Accede al panel de administración logística de TrackFlow para gestionar inventario, incidencias y proveedores.",
  alternates: {
    canonical: "/login",
    languages: { es: "/login", en: "/login", "x-default": "/login" },
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}