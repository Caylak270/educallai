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

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={clsx("flex gap-1", collapsed ? "flex-col items-center" : "flex-col")}>
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={clsx(
              "group flex items-center rounded-xl font-label-md text-label-md transition-all",
              collapsed
                ? clsx(
                    "h-10 w-10 justify-center",
                    active
                      ? "bg-primary-container text-on-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )
                : clsx(
                    "gap-3 px-space-md py-2.5",
                    active
                      ? "bg-primary-container font-semibold text-on-primary-container shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )
            )}
          >
            <span className="material-symbols-outlined shrink-0 text-[20px] transition-colors">
              {item.icon}
            </span>
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
