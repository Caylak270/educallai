"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintSectionButton } from "@/components/ui/print-section-button";
import { bordroHesapla } from "@/lib/server/bordro";
import { ornekProgramYukle } from "@/lib/ornek-program";
import type { ScheduleSlotVM } from "@/components/pages/ders-programi/ders-programi-view";

export interface OgretmenUcretiVM {
  teacher: string;
  hourlyRate: number;
}

const TL_FMT = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export function OgretmenBordroView({
  slots,
  rates,
  live,
  sourceLabel,
}: {
  slots: ScheduleSlotVM[];
  rates: OgretmenUcretiVM[];
  live: boolean;
  sourceLabel?: string;
}) {
  // (router: örnek program yüklendikten sonra sunucu verisini tazeler)
  const router = useRouter();
  const [ornekYukleniyor, setOrnekYukleniyor] = useState(false);
  const [haftaSayisi, setHaftaSayisi] = useState(4);
  // Öğretmen → ücret taslağı (Kaydet'e basınca sunucuya yazılır)
  const [ucretTaslari, setUcretTaslari] = useState<Record<string, string>>(() =>
    Object.fromEntries(rates.map((r) => [r.teacher, String(r.hourlyRate)]))
  );
  // Kaydedilmiş (onaylı) ücretler — hesaplama bunlarla yapılır
  const [onayliUcretler, setOnayliUcretler] = useState<OgretmenUcretiVM[]>(rates);
  const [kaydeden, setKaydeden] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const satirlar = bordroHesapla(slots, onayliUcretler, haftaSayisi);
  const toplam = satirlar.reduce((sum, s) => sum + s.tutar, 0);

  const ucretKaydet = (teacher: string) => {
    if (kaydeden) return;
    const taslak = ucretTaslari[teacher];
    const deger = Number(taslak);
    if (taslak === undefined || taslak.trim() === "" || Number.isNaN(deger) || deger < 0) {
      setNote({ ok: false, text: "Geçerli bir saat ücreti girin." });
      return;
    }
    setKaydeden(teacher);
    setNote(null);
    fetch("/api/bordro/oran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher, hourlyRate: deger }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setNote({ ok: false, text: d.error ?? "Ücret kaydedilemedi" });
        } else if (d.persisted) {
          setOnayliUcretler((prev) => {
            const diger = prev.filter((r) => r.teacher.toLocaleLowerCase("tr-TR") !== teacher.toLocaleLowerCase("tr-TR"));
            return [...diger, { teacher, hourlyRate: deger }];
          });
          setNote({ ok: true, text: `${teacher} saat ücreti kaydedildi: ${TL_FMT.format(deger)}/saat.` });
        } else {
          setOnayliUcretler((prev) => {
            const diger = prev.filter((r) => r.teacher.toLocaleLowerCase("tr-TR") !== teacher.toLocaleLowerCase("tr-TR"));
            return [...diger, { teacher, hourlyRate: deger }];
          });
          setNote({ ok: true, text: "Demo modda kaydedildi — Supabase bağlandığında kalıcı olacak." });
        }
      })
      .catch(() => setNote({ ok: false, text: "Sunucuya ulaşılamadı" }))
      .finally(() => setKaydeden(null));
  };

  return (
    <PageShell>
      <PageHeader
        title="Öğretmen Bordro"
        description="Sabit haftalık programdaki ders saatlerinden öğretmen bazlı aylık ücret hesabı."
        actions={
          <div className="flex items-center gap-2">
            {!live ? (
              <span className="font-label-xs text-label-xs text-outline">Demo mod</span>
            ) : null}
            <PrintSectionButton
              ariaLabel="Bordro tablosunu yazdır"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 font-label-md text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
              targetId="bordro-tablosu"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Yazdır
            </PrintSectionButton>
          </div>
        }
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {note ? (
        <p
          className={clsx(
            "-mt-2 flex items-center gap-2 rounded-lg px-3 py-2 font-label-sm text-label-sm",
            note.ok
              ? "bg-secondary-container/50 text-on-secondary-container"
              : "bg-error-container/50 text-on-error-container"
          )}
          role="status"
        >
          <span className="material-symbols-outlined text-[16px]">
            {note.ok ? "info" : "warning"}
          </span>
          {note.text}
        </p>
      ) : null}

      {slots.length === 0 ? (
        <div className="flex flex-col items-center gap-4">
          <EmptyState
            description="Bordro hesabı için sabit programda ders gerekli. Ders Programı sayfasından haftalık programı oluşturabilir ya da örnek programı tek tıkla yükleyebilirsiniz."
            icon="receipt_long"
            title="Programda ders yok"
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            {live ? (
              <button
                className={clsx(
                  "flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary",
                  ornekYukleniyor && "opacity-60"
                )}
                type="button"
                onClick={async () => {
                  setOrnekYukleniyor(true);
                  const n = await ornekProgramYukle();
                  setOrnekYukleniyor(false);
                  if (n > 0) router.refresh();
                }}
              >
                <span className={clsx("material-symbols-outlined text-[18px]", ornekYukleniyor && "animate-spin")}>
                  {ornekYukleniyor ? "refresh" : "auto_awesome"}
                </span>
                Örnek Program Yükle
              </button>
            ) : null}
            <Link
              className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
              href="/ders-programi"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
              Ders Programı&apos;na Git
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Hafta sayısı seçici */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Aylık hesap hafta sayısı:
            </span>
            <select
              className="h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 font-label-sm text-label-sm text-on-surface focus:outline-none"
              onChange={(e) => setHaftaSayisi(Number(e.target.value))}
              value={haftaSayisi}
            >
              {[1, 2, 3, 4, 5].map((h) => (
                <option key={h} value={h}>
                  {h} hafta
                </option>
              ))}
            </select>
            <span className="ml-auto font-title-md text-title-md font-semibold text-on-surface">
              Toplam: {TL_FMT.format(toplam)}
            </span>
          </div>

          {/* Bordro tablosu */}
          <div id="bordro-tablosu" className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-outline-variant/50">
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Öğretmen</th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Haftalık ders</th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Haftalık saat</th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">
                    Aylık saat ({haftaSayisi} hafta)
                  </th>
                  <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">Saat ücreti</th>
                  <th className="px-4 py-3 text-right font-label-sm text-label-sm text-on-surface-variant">Aylık tutar</th>
                </tr>
              </thead>
              <tbody>
                {satirlar.map((s) => (
                  <tr key={s.teacher} className="border-b border-outline-variant/30 last:border-0">
                    <td className="px-4 py-3 font-label-md text-label-md font-semibold text-on-surface">
                      {s.teacher}
                    </td>
                    <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant">
                      {s.haftalikDers}
                    </td>
                    <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant">
                      {s.haftalikSaat.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} sa
                    </td>
                    <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant">
                      {s.aylikSaat.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} sa
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={`${s.teacher} saat ücreti`}
                          className="h-9 w-24 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 font-body-sm text-body-sm text-on-surface focus:outline-none"
                          inputMode="decimal"
                          onChange={(e) =>
                            setUcretTaslari((prev) => ({ ...prev, [s.teacher]: e.target.value }))
                          }
                          placeholder="₺/saat"
                          type="number"
                          min="0"
                          value={ucretTaslari[s.teacher] ?? ""}
                        />
                        <button
                          className={clsx(
                            "h-9 shrink-0 rounded-lg bg-surface-container px-3 font-label-xs text-label-xs font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50",
                            kaydeden === s.teacher && "opacity-60"
                          )}
                          disabled={kaydeden === s.teacher}
                          type="button"
                          onClick={() => ucretKaydet(s.teacher)}
                        >
                          {kaydeden === s.teacher ? "..." : "Kaydet"}
                        </button>
                      </div>
                      {!s.ucretTanımlı ? (
                        <span className="mt-1 block rounded bg-tertiary-container/60 px-1.5 py-0.5 font-label-xs text-label-xs text-on-tertiary-container w-fit">
                          ücret girilmedi
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-title-md text-title-md font-bold text-on-surface">
                      {s.ucretTanımlı ? TL_FMT.format(s.tutar) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-label-xs text-label-xs text-outline">
            Hesap, sabit haftalık programdaki ders sürelerinden haftalık saat × {haftaSayisi} hafta
            varsayımıyla yapılır. İzin, devamsızlık ve gerçek takvim farkları hesaba katılmaz.
          </p>
        </div>
      )}
    </PageShell>
  );
}
