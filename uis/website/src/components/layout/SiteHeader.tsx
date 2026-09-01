import Link from "next/link";

type HeaderVariant = "home" | "application";

interface SiteHeaderProps {
  variant: HeaderVariant;
}

const navItems = [
  { href: "#inicio", label: "Inicio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#cobertura", label: "Cobertura" },
  { href: "#contacto", label: "Contacto" },
];

export function SiteHeader({ variant }: SiteHeaderProps) {
  if (variant === "application") {
    return (
      <div className="sticky top-0 z-20">
        <header className="border-b border-[#c89d66] bg-[#f3ddba]">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" aria-label="TrackFlow" className="inline-flex items-center bg-transparent">
              <img
                src="/media/Logo TrackFlow.png"
                alt="Logo TrackFlow"
                className="h-20 w-auto bg-transparent"
              />
            </Link>
            <Link
              href="/"
              className="rounded-md border border-[#14263a] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] hover:bg-[#1d4f7a]"
            >
              Inicio
            </Link>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-20">
      <header className="border-b border-[#c89d66] bg-[#f3ddba]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <a href="#inicio" aria-label="TrackFlow" className="inline-flex items-center bg-transparent">
            <img
              src="/media/Logo TrackFlow.png"
              alt="Logo TrackFlow"
              className="h-14 w-auto bg-transparent md:h-16"
            />
          </a>

          <nav aria-label="Navegacion principal" className="hidden md:block">
            <ul className="flex items-center gap-4 text-center text-sm font-medium text-[#2f4a62]">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <nav
        aria-label="Navegacion principal movil"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#c89d66] bg-[#f3ddba] md:hidden"
      >
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-4 gap-1 px-2 py-2 text-center text-xs font-medium text-[#2f4a62]">
          {navItems.map((item) => (
            <li key={`mobile-${item.href}`}>
              <a
                href={item.href}
                className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
