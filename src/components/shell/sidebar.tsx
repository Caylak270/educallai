import { AppLogo } from "./app-logo";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between px-space-lg">
          <div className="flex items-center gap-space-sm">
            <AppLogo className="h-8 w-auto" />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm leading-tight tracking-tight text-on-surface">
                educallai
              </span>
              <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
                Dershane AI Hub
              </span>
            </div>
          </div>
          <button
            aria-label="Menüyü Katla"
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">menu_open</span>
          </button>
        </div>
        <div className="px-space-md py-space-sm">
          <SidebarNav />
        </div>
      </div>
      <div className="m-space-md flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
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
        <div className="flex items-center gap-3 pt-space-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-semibold text-on-primary-fixed">
            AY
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate font-label-md text-label-md font-medium text-on-surface">
              Ahmet Yıldız
            </span>
            <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
              Müdür
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
