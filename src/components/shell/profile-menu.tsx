"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clsx } from "@/lib/clsx";

/**
 * Profil menüsü — topbar avatarı, mobil person ikonu ve sidebar kullanıcı kartı
 * aynı menüyü açar. Auth henüz entegre değil: "Çıkış Yap" dürüst biçimde
 * bilgilendirme gösterir, sahte çıkış yapmaz.
 */
export function ProfileMenu({
  variant = "topbar",
  collapsed = false,
}: {
  variant?: "topbar" | "mobile" | "sidebar";
  /** Sidebar ikon modu (yalnız avatar) */
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [authNote, setAuthNote] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const noteTimer = useRef<number | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    return () => {
      if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
    };
  }, []);

  const handleLogoutClick = () => {
    setAuthNote(true);
    if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setAuthNote(false), 3200);
  };

  const panelPosition =
    variant === "sidebar"
      ? "left-0 bottom-full mb-2"
      : "right-0 top-12";

  return (
    <div className="relative" ref={rootRef}>
      {/* Tetikleyici */}
      {variant === "topbar" ? (
        <button
          aria-expanded={open}
          aria-label="Profil menüsü"
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-semibold text-on-primary-fixed ring-2 ring-transparent transition-all hover:ring-primary/40",
            open && "ring-primary/60"
          )}
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          AY
        </button>
      ) : variant === "mobile" ? (
        <button
          aria-expanded={open}
          aria-label="Profil menüsü"
          className={clsx(
            "ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary shadow-[0_1px_4px_rgba(53,37,205,0.2)]",
            open && "ring-2 ring-primary/40"
          )}
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="material-symbols-outlined text-[18px] text-on-primary">person</span>
        </button>
      ) : (
        <button
          aria-expanded={open}
          className={clsx(
            "w-full rounded-xl text-left transition-colors hover:bg-surface-container-high",
            collapsed
              ? "flex justify-center p-1"
              : "flex items-center gap-3 p-1"
          )}
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-semibold text-on-primary-fixed"
            title={collapsed ? "Ahmet Yıldız · Müdür" : undefined}
          >
            AY
          </div>
          {!collapsed ? (
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <span className="truncate font-label-md text-label-md font-medium text-on-surface">
                Ahmet Yıldız
              </span>
              <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
                Müdür
              </span>
            </div>
          ) : null}
          {!collapsed ? (
            <span
              className={clsx(
                "material-symbols-outlined shrink-0 text-[16px] text-on-surface-variant transition-transform",
                open && "rotate-180"
              )}
            >
              unfold_more
            </span>
          ) : null}
        </button>
      )}

      {/* Panel */}
      {open ? (
        <div
          className={clsx(
            "absolute z-50 w-64 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-xl",
            panelPosition
          )}
          role="menu"
        >
          {/* Kimlik başlığı */}
          <div className="flex items-center gap-3 border-b border-outline-variant/40 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-semibold text-on-primary-fixed">
              AY
            </div>
            <div className="min-w-0">
              <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                Ahmet Yıldız
              </p>
              <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                Müdür · Beylikdüzü Şubesi
              </p>
            </div>
          </div>

          {/* Plan satırı */}
          <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 px-4 py-2.5">
            <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-xs text-label-xs text-on-secondary-container">
              Profesyonel Plan
            </span>
            <span className="font-label-xs text-label-xs text-outline">
              Limit Dershane
            </span>
          </div>

          {/* Bağlantılar */}
          <div className="py-1">
            <Link
              className="flex items-center gap-2.5 px-4 py-2 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container"
              href="/ayarlar"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                settings
              </span>
              Ayarlar
            </Link>
            <a
              className="flex items-center gap-2.5 px-4 py-2 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container"
              download
              href="/legal/kvkk-aydinlatma-metni.txt"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                verified_user
              </span>
              KVKK Aydınlatma Metni
            </a>
            <button
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left font-label-sm text-label-sm text-error transition-colors hover:bg-error-container/30"
              role="menuitem"
              type="button"
              onClick={handleLogoutClick}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Çıkış Yap
            </button>
          </div>

          {authNote ? (
            <p
              className="border-t border-outline-variant/40 bg-surface-container-low px-4 py-2.5 font-label-xs text-label-xs text-on-surface-variant"
              role="status"
            >
              Auth entegrasyonu henüz bağlı değil — şu anda tek kurum yöneticisi
              oturumu kullanılıyor.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
