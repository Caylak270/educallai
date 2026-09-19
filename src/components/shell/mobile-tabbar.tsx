"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

const TABS = [
  { href: "/", label: "Genel", icon: "dashboard" },
  { href: "/veliler", label: "Veliler", icon: "contact_phone" },
  { href: "/gorusmeler", label: "Aramalar", icon: "graphic_eq" },
  { href: "/randevular", label: "Randevu", icon: "event_available" },
  { href: "/ayarlar", label: "Ayarlar", icon: "settings" },
] as const;

export function MobileTabbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 z-50 w-full bg-surface/90 pb-safe shadow-[0_-2px_12px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-around px-space-xs">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex h-full min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                active
                  ? "font-headline-md text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
              <span className="font-label-sm text-label-sm">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
