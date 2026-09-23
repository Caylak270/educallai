"use client";

import { AppLogo } from "./app-logo";
import { SidebarNav } from "./sidebar-nav";
import { ProfileMenu } from "./profile-menu";
import { clsx } from "@/lib/clsx";

/**
 * Masaüstü sidebar — collapsed=true'da ikon moduna küçülür (etiketler gizlenir,
 * nav öğeleri tooltip gösterir). Durum AppFrame tarafından yönetilir.
 */
export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 z-50 hidden h-full flex-col bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-72"
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={clsx(
            "flex h-16 shrink-0 items-center",
            collapsed ? "flex-col justify-center gap-1 px-0" : "justify-between px-space-lg"
          )}
        >
          <div className={clsx("flex items-center", collapsed ? "justify-center" : "gap-space-sm")}>
            <AppLogo showText={false} className="h-9 w-auto" />
            {!collapsed ? (
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm leading-tight tracking-tight text-on-surface">
                  educallai
                </span>
                <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
                  Dershane AI Hub
                </span>
              </div>
            ) : null}
          </div>
          <button
            aria-label={collapsed ? "Menüyü Aç" : "Menüyü Katla"}
            title={collapsed ? "Menüyü Aç" : "Menüyü Katla"}
            className={clsx(
              "rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface",
              collapsed && "hidden lg:block"
            )}
            type="button"
            onClick={onToggle}
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? "menu" : "menu_open"}
            </span>
          </button>
        </div>
        {/* Menü öğeleri arttığında taşmayı engeller — yalnız nav alanı kayar */}
        <div
          className={clsx(
            "min-h-0 flex-1 overflow-y-auto py-space-sm",
            collapsed ? "px-2" : "px-space-md"
          )}
        >
          <SidebarNav collapsed={collapsed} />
        </div>
      </div>
      <div
        className={clsx(
          "flex shrink-0 flex-col gap-space-sm bg-surface-container-low",
          collapsed ? "m-2 items-center rounded-xl p-2" : "m-space-md rounded-xl p-space-md"
        )}
      >
        {!collapsed ? (
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
                Limit Dershane
              </span>
              <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
                Beylikdüzü Şubesi
              </span>
            </div>
            <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-xs text-label-xs text-on-secondary-container">
              Profesyonel Plan
            </span>
          </div>
        ) : null}
        <ProfileMenu variant="sidebar" collapsed={collapsed} />
      </div>
    </aside>
  );
}
