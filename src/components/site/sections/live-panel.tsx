"use client";

/*
  Canlı vitrin — statik resim yerine gerçek bir demo ekranı iframe ile
  gömülür (porsyon.com.tr "Ürün vitrini" mantığı). Demo ekranının KENDİ
  sidebar menüsü bölümler arasında gezinmeyi sağlar; dış sekme yok.
*/

export function LivePanel() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-obsidian-border bg-obsidian-canvas/60 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-critical-rose" />
              <span className="inline-block h-3 w-3 rounded-full bg-amber-notice" />
              <span className="inline-block h-3 w-3 rounded-full bg-voice-teal" />
            </div>
            <span className="truncate font-mono text-[12px] text-outline-variant">
              app.educallai.com/demo
            </span>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-obsidian-border bg-obsidian-surface px-2.5 py-0.5 font-mono text-[11px] text-voice-teal sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-voice-teal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-voice-teal" />
            </span>
            CANLI DEMO
          </span>
        </div>
        <iframe
          src="/demo"
          title="educallai canlı panel demosu"
          loading="lazy"
          className="block h-[560px] w-full border-0 bg-white sm:h-[840px]"
        />
      </div>

      <p className="text-center font-mono text-[11px] text-on-surface-variant">
        Bu bir ekran görüntüsü değil — canlı demo. Soldaki menüden Veliler CRM,
        Görüşmeler ve Tahsilat arasında geçiş yapabilirsiniz.
      </p>
    </div>
  );
}
