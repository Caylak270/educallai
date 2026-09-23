"use client";

/**
 * Öğrenci Hareketleri — TÜM öğrencilerin tüm modüllerdeki faaliyetlerinin
 * birleşik, kronolojik akışı (A5). Veri ogrenci-durumu.ts tek kaynağından
 * türetilir; dashboard gibi genel bakış ekranlarında kullanılır.
 * Öğrenci bazlı kart için: ogrenci-ekosistem-paneli.tsx
 */

import { clsx } from "@/lib/clsx";
import { TIP_IKONU, YON_NOKTA, formatTarih } from "./ogrenci-ekosistem-paneli";
import type { OgrenciFaaliyeti } from "@/lib/types/ogrenci";

export interface HareketSatiri extends OgrenciFaaliyeti {
  /** Faaliyetin sahibi öğrencinin adı */
  ogrenci: string;
}

export function OgrenciHareketAkisi({ items }: { items: HareketSatiri[] }) {
  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      <h2 className="font-headline-sm text-headline-sm text-on-surface">
        Öğrenci Hareketleri
        <span className="ml-2 font-label-xs text-label-xs text-on-surface-variant">
          tüm modüllerden birleşik akış
        </span>
      </h2>

      {items.length === 0 ? (
        <p className="mt-3 rounded-xl bg-surface-container-low p-4 font-label-sm text-label-sm text-on-surface-variant">
          Henüz öğrenci faaliyeti kaydedilmedi — ödev, yoklama, deneme, tahsilat veya
          etkinlik modüllerinde ilk kayıt yapıldığında burada görünür.
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-1.5 lg:grid-cols-2">
          {items.map((f, i) => (
            <li
              key={`${f.ogrenci}-${f.tip}-${f.ts ?? "tarihsiz"}-${i}`}
              className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-2.5"
            >
              <span className={clsx("h-2 w-2 shrink-0 rounded-full", YON_NOKTA[f.yon])} />
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                {TIP_IKONU[f.tip]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-label-sm text-label-sm text-on-surface">
                  <span className="font-semibold">{f.ogrenci}</span>
                  {" · "}
                  {f.baslik}
                  {f.detay ? (
                    <span className="ml-1.5 text-on-surface-variant">{f.detay}</span>
                  ) : null}
                </span>
              </span>
              <span className="shrink-0 font-label-xs text-label-xs text-outline">
                {formatTarih(f.ts)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
