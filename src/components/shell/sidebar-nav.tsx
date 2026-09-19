"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

export const NAV_ITEMS = [
  { href: "/", label: "Genel Bakış", icon: "grid_view" },
  { href: "/kampanyalar", label: "Kampanyalar", icon: "campaign" },
  { href: "/veliler", label: "Veliler (CRM)", icon: "contacts" },
  { href: "/gorusmeler", label: "Görüşmeler", icon: "headset_mic" },
  { href: "/tahsilat", label: "Tahsilat", icon: "payments" },
  { href: "/deneme-analizi", label: "Deneme Analizi", icon: "monitoring" },
  { href: "/randevular", label: "Randevular", icon: "event_available" },
  { href: "/raporlar", label: "Raporlar", icon: "analytics" },
  { href: "/ayarlar", label: "Ayarlar", icon: "settings" },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "group flex items-center gap-3 rounded-xl px-space-md py-2.5 font-label-md text-label-md transition-all",
              active
                ? "bg-primary-container font-semibold text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
          >
            <span className="material-symbols-outlined text-[20px] transition-colors">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
