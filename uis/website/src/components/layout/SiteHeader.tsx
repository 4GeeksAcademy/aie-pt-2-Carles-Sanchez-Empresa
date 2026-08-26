import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n";

type HeaderVariant = "home" | "application";

interface SiteHeaderProps {
  variant: HeaderVariant;
}

export function SiteHeader({ variant }: SiteHeaderProps) {
  const { t, language, setLanguage } = useTranslation();

  if (variant === "application") {
    return (
      <div className="sticky top-0 z-20">
        <header className="border-b border-[#c89d66] bg-[#f3ddba]">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
            <Link to="/" aria-label="TrackFlow" className="inline-flex items-center bg-transparent">
              <img
                src="/media/Logo TrackFlow.png"
                alt="Logo TrackFlow"
                className="h-20 w-auto bg-transparent"
              />
            </Link>
            <div className="flex items-center gap-3">
              <LanguageToggle language={language} setLanguage={setLanguage} />
              <Link
                to="/"
                className="rounded-md border border-[#14263a] bg-[#14263a] px-4 py-2 text-sm font-medium text-[#f8fbff] hover:bg-[#1d4f7a]"
              >
                {t.header.inicio}
              </Link>
            </div>
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

          <div className="flex items-center gap-4">
            <nav aria-label={t.header.inicio} className="hidden md:block">
              <ul className="flex items-center gap-4 text-center text-sm font-medium text-[#2f4a62]">
                <li>
                  <a
                    href="#inicio"
                    className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
                  >
                    {t.header.inicio}
                  </a>
                </li>
                <li>
                  <a
                    href="#servicios"
                    className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
                  >
                    {t.header.servicios}
                  </a>
                </li>
                <li>
                  <a
                    href="#cobertura"
                    className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
                  >
                    {t.header.cobertura}
                  </a>
                </li>
                <li>
                  <a
                    href="#contacto"
                    className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
                  >
                    {t.header.contacto}
                  </a>
                </li>
              </ul>
            </nav>
            <LanguageToggle language={language} setLanguage={setLanguage} />
          </div>
        </div>
      </header>

      <nav
        aria-label={t.header.inicio}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#c89d66] bg-[#f3ddba] md:hidden"
      >
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-4 gap-1 px-2 py-2 text-center text-xs font-medium text-[#2f4a62]">
          <li>
            <a
              href="#inicio"
              className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
            >
              {t.header.inicio}
            </a>
          </li>
          <li>
            <a
              href="#servicios"
              className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
            >
              {t.header.servicios}
            </a>
          </li>
          <li>
            <a
              href="#cobertura"
              className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
            >
              {t.header.cobertura}
            </a>
          </li>
          <li>
            <a
              href="#contacto"
              className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
            >
              {t.header.contacto}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function LanguageToggle({
  language,
  setLanguage,
}: {
  language: "es" | "en";
  setLanguage: (lang: "es" | "en") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-[#c89d66] bg-[#e5be83]/50 p-0.5 text-xs font-semibold">
      <button
        onClick={() => setLanguage("es")}
        className={`rounded px-2 py-1 transition ${
          language === "es" ? "bg-[#14263a] text-[#f8fbff]" : "text-[#2f4a62] hover:bg-[#e5be83]"
        }`}
        aria-label="Español"
      >
        ES
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`rounded px-2 py-1 transition ${
          language === "en" ? "bg-[#14263a] text-[#f8fbff]" : "text-[#2f4a62] hover:bg-[#e5be83]"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
