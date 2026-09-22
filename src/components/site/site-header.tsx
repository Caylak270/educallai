"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { WA_START_TRIAL } from "@/components/site/links";

const NAV_LINKS = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Canlı Kokpit", href: "#kokpit" },
  { label: "Nasıl Çalışır", href: "#nasil-calisir" },
  { label: "Yorumlar", href: "#kurum-yorumlari" },
  { label: "Teklif", href: "#teklif" },
  { label: "SSS", href: "#sss" },
] as const;

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/*
  Üst bar — sade ve soluksuz: logo | 6 kısa nav (xl+) | Kurum Girişi + indigo
  randevu CTA. xl altında hamburger menü; öğe taşması yok.
*/
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Menü açıyken sayfa kaydırmasını kilitle
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-container/70 bg-surface-container-lowest/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between gap-3 px-margin-mobile sm:gap-6 lg:px-margin">
        <Link
          href="/web"
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.png" alt="" className="h-9 w-auto" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.png" alt="educallai" className="h-6 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Ana menü">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-[13.5px] font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-lg px-3 py-2 text-[13.5px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface lg:inline-flex"
          >
            Kurum Girişi
          </Link>
          <a
            href={WA_START_TRIAL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-[13.5px] font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98] sm:px-4"
          >
            <WhatsAppGlyph className="h-4 w-4" />
            <span className="max-sm:hidden">Randevu Planla</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-container-high xl:hidden"
          >
            <span className="material-symbols-outlined text-[24px]">
              {open ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobil / tablet menü */}
      {open && (
        <div className="border-t border-surface-container bg-surface-container-lowest/95 backdrop-blur-xl xl:hidden">
          <nav className="mx-auto max-w-[1240px] space-y-1 px-margin-mobile py-4 lg:px-margin">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              Kurum Girişi
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
