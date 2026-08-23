"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/services/auth";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

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
            {!isAuthPage && (
              <>
                <li>
                  <Link href="/" className="block rounded-md px-3 py-2 hover:bg-[#e5be83] hover:text-[#14263a]">
                    Candidaturas
                  </Link>
                </li>
                <li>
                  <Link href="/account/profile" className="block rounded-md px-3 py-2 hover:bg-[#e5be83] hover:text-[#14263a]">
                    Mi perfil
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block rounded-md px-3 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
                  >
                    Cerrar sesión
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      {/* Navegación móvil inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#c89d66] bg-[#f3ddba] md:hidden">
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-1 px-2 py-2 text-center text-xs font-medium text-[#2f4a62]">
          {!isAuthPage && (
            <>
              <li>
                <Link href="/" className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]">
                  Candidaturas
                </Link>
              </li>
              <li>
                <Link href="/account/profile" className="block rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]">
                  Mi perfil
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded-md px-2 py-2 hover:bg-[#e5be83] hover:text-[#14263a]"
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}