"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { logout } from "@trackflow/core";

interface SidebarItem {
  href: string;
  icon: string;
  labelKey: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { href: "/",           icon: "🏠", labelKey: "nav.dashboard" },
  { href: "/inventory",  icon: "📦", labelKey: "nav.inventory" },
  { href: "/suppliers",  icon: "📋", labelKey: "nav.suppliers" },
  { href: "/incidents",  icon: "📊", labelKey: "nav.analyzer" },
  { href: "/incidents-manager", icon: "🚨", labelKey: "nav.manager" },
  { href: "/account/profile",   icon: "👤", labelKey: "nav.profile" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#14263a] text-[#f8fbff] shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between border-b border-[#c89d66] px-4 py-4">
          <span className="text-lg font-bold tracking-wide text-[#c89d66]">TrackFlow</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#8fa8be] hover:bg-[#c89d66] hover:text-[#14263a] transition"
            aria-label="Close sidebar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#c89d66] text-[#14263a]"
                        : "text-[#c6dced] hover:bg-[#c89d66] hover:text-[#14263a]"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-[#c89d66] px-3 py-4">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#f87171] transition hover:bg-[#c89d66] hover:text-[#14263a]"
          >
            <span className="text-lg">🚪</span>
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}