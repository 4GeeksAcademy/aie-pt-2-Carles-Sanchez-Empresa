import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#c89d66] bg-[#f3ddba]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="inline-flex items-center bg-transparent">
          <Image
            src="/Logo TrackFlow.png"
            alt="TrackFlow"
            width={112}
            height={56}
            className="h-14 w-auto md:h-16 bg-transparent"
            priority
          />
        </Link>

        <nav className="hidden md:block">
          <ul className="flex items-center gap-4 text-center text-sm font-medium text-[#2f4a62]">
            <li>
              <Link href="/" className="block rounded-md px-3 py-2 hover:bg-[#e5be83] hover:text-[#14263a]">
                Candidaturas
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Navegación móvil inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#c89d66] bg-[#f3ddba] md:hidden">
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-1 px-2 py-2 text-center text-xs font-medium text-[#2f4a62]">
          <li>
            <Link href="/" className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]">
              Candidaturas
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}