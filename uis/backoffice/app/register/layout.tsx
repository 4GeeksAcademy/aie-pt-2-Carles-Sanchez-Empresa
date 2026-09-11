import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Regístrate en TrackFlow para acceder al panel de administración logística. Gestión de inventario, incidencias y proveedores en una única consola.",
  alternates: {
    canonical: "/register",
    languages: { es: "/register", en: "/register", "x-default": "/register" },
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}