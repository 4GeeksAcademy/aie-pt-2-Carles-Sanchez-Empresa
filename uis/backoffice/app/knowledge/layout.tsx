import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Base de Conocimiento",
  description: "Asistente comercial y base de conocimiento oficial de TrackFlow.",
  alternates: { canonical: "/knowledge" },
  robots: { index: false, follow: false },
};

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
