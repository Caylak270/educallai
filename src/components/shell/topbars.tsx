"use client";

import { useRouter } from "next/navigation";
import { AppLogo } from "./app-logo";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";
import { DateRangeMenu, NotificationsMenu } from "./topbar-menus";
import Link from "next/link";
import { clsx } from "@/lib/clsx";

export function WebTopbar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <header
      className={clsx(
        "fixed right-0 top-0 z-40 hidden h-16 items-center justify-between gap-space-md bg-surface-container-lowest/90 px-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-[left] duration-200 lg:flex",
        collapsed ? "left-[68px]" : "left-72"
      )}
    >
      <div className="max-w-lg flex-1">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-space-sm">
        <DateRangeMenu />
        <NotificationsMenu />
        <ThemeToggle />
        <Link
          className="flex h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-container to-secondary font-label-md text-label-md text-on-primary shadow-sm transition-all hover:opacity-95 active:scale-95"
          href="/kampanyalar"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Yeni Kampanya</span>
        </Link>
        <div className="ml-1 flex items-center pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-semibold text-on-primary-fixed">
            AY
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileHeader() {
  const router = useRouter();

  return (
    <header className="fixed top-0 z-50 w-full bg-surface/85 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)] backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between gap-space-sm px-4">
        <div className="flex min-w-0 flex-1 items-center gap-space-sm">
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <AppLogo showText={false} className="h-8 w-auto" />
            <span className="font-headline-md text-headline-md lowercase tracking-tight text-on-surface">
              educall<span className="text-primary-container">ai</span>
            </span>
          </div>
          <div className="flex min-w-0 max-w-[130px] flex-shrink items-center gap-1 rounded-full bg-surface-container-low px-2 py-1">
            <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-secondary" />
            <span className="truncate font-label-sm text-label-sm text-on-surface-variant">
              Limit Dershane
            </span>
            <span className="material-symbols-outlined flex-shrink-0 text-[14px] text-outline">
              unfold_more
            </span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-0.5">
          <button
            aria-label="Ara"
            className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-on-surface"
            type="button"
            onClick={() => router.push("/veliler?odak=ara")}
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
          <button
            aria-label="Bildirimler"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-on-surface"
            type="button"
            onClick={() => router.push("/veliler")}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface" />
          </button>
          <ThemeToggle className="h-11 w-11 rounded-full" iconClassName="text-[22px]" />
          <div className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-[0_1px_4px_rgba(53,37,205,0.2)]">
            <span className="material-symbols-outlined text-[18px] text-on-primary">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
