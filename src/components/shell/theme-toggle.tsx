"use client";

import { clsx } from "@/lib/clsx";

const STORAGE_KEY = "educallai-theme";

/**
 * Açık/koyu tema düğmesi — html.dark sınıfını değiştirir.
 * Başlangıç tercihi root layout'taki inline script uygular (FOUC yok);
 * ikon seçimi CSS ile yapılır (dark: varyantı), bileşen state tutmaz.
 */
export function ThemeToggle({
  className,
  iconClassName = "text-[20px]",
}: {
  className?: string;
  iconClassName?: string;
}) {
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage kapalıysa yalnız bu sekme için geçerli
    }
  };

  return (
    <button
      aria-label="Temayı değiştir"
      title="Temayı değiştir"
      className={clsx(
        "flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface",
        className
      )}
      type="button"
      onClick={toggle}
    >
      {/* Not: sarmalayıcı span'lar şart — material-symbols span'ının kendisi
          Google CDN CSS'indeki katmansız `display:inline-block` yüzünden
          hidden/dark:hidden utility'lerine yenik düşer. */}
      <span className="dark:hidden">
        <span className={clsx("material-symbols-outlined", iconClassName)}>
          dark_mode
        </span>
      </span>
      <span className="hidden dark:block">
        <span className={clsx("material-symbols-outlined", iconClassName)}>
          light_mode
        </span>
      </span>
    </button>
  );
}
