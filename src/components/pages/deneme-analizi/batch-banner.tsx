"use client";

import { useState } from "react";
import { batchBanner } from "@/lib/mock/exams";

/** Toplu arama hedefi: düşüş segmentindeki bir öğrenci (roster'dan üretilir). */
export interface BatchCallTarget {
  name: string;
  parent?: string;
  phone?: string | null;
}

/** Telefonu E.164'e çevirir; en az 10 hane yoksa null (aranamaz). */
function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `+${digits.slice(-12)}`;
}

/**
 * Toplu kampanya şeridi: düşüş segmentindeki velilere toplu AI araması.
 * İki aşamalı onay: ilk tık inline onay ister; Onayla'da en fazla 3 veli
 * sırayla POST /api/calls ile aranır, kalanlar kuyruk notuyla raporlanır.
 * Telefon yoksa dürüst mesaj gösterilir — sahte simülasyon yoktur.
 */
export function BatchBanner({ calls }: { calls?: BatchCallTarget[] }) {
  const list = calls ?? [];
  // Yalnızca gerçekten aranabilir numaralar
  const dialable = list
    .map((target) => ({ ...target, e164: target.phone ? toE164(target.phone) : null }))
    .filter((target): target is BatchCallTarget & { e164: string } => target.e164 !== null);

  const [phase, setPhase] = useState<"idle" | "confirm" | "running" | "done">("idle");
  const [note, setNote] = useState<string | null>(null);

  function start() {
    setNote(null);
    if (dialable.length === 0) {
      // Dürüst uyarı: numara yoksa arama denenmez.
      setNote("Telefon numaraları eksik — veliler CRM'den tamamlayın.");
      setPhase("done");
      return;
    }
    setPhase("confirm");
  }

  async function confirm() {
    setPhase("running");
    // Tek seferde en fazla 3 arama; kalan veliler kuyruğa alınır.
    const first = dialable.slice(0, 3);
    let ok = 0;
    let fail = 0;
    for (const target of first) {
      try {
        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: target.e164,
            name: target.parent ?? target.name,
            context: "Deneme analizi — düşüş segmenti toplu arama",
          }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
        if (res.ok && data?.ok) ok += 1;
        else fail += 1;
      } catch {
        fail += 1;
      }
    }
    const queued = dialable.length - first.length;
    setNote(
      [
        `${ok} arama başlatıldı`,
        fail > 0 ? `${fail} arama başlatılamadı` : null,
        queued > 0 ? `${queued} veli kuyruğa alındı` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    );
    setPhase("done");
  }

  // Sayaç canlı roster'dan gelir; canlı veri yoksa sahte sayı gösterilmez.
  const subtitle =
    list.length > 0
      ? `${list.length} Düşüş Öğrencisi İçin Toplu Kampanya`
      : "Düşüş segmenti için toplu bilgilendirme";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="material-symbols-outlined text-[22px] text-primary">{batchBanner.icon}</span>
        <div className="flex min-w-0 flex-col">
          <span className="font-label-md text-label-md font-bold text-on-surface">{batchBanner.title}</span>
          <span className="font-label-xs text-label-xs text-on-surface-variant">{subtitle}</span>
          {note ? (
            <span className="font-label-xs text-label-xs font-semibold text-primary">{note}</span>
          ) : null}
        </div>
      </div>

      {phase === "confirm" ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="font-label-sm text-label-sm font-semibold text-on-surface">
            {dialable.length} veli aranacak, onaylıyor musunuz?
          </span>
          <button
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-sm text-label-sm font-bold text-on-primary transition-all hover:bg-primary active:scale-95"
            type="button"
            onClick={confirm}
          >
            Onayla
          </button>
          <button
            className="flex h-10 items-center justify-center rounded-xl border border-outline-variant/60 px-3.5 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
            type="button"
            onClick={() => setPhase("idle")}
          >
            Vazgeç
          </button>
        </div>
      ) : (
        <button
          className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-sm text-label-sm font-bold text-on-primary transition-all hover:bg-primary active:scale-95 disabled:opacity-60"
          disabled={phase === "running"}
          type="button"
          onClick={start}
        >
          <span className="material-symbols-outlined text-[16px]">
            {phase === "running" ? "hourglass_top" : "play_arrow"}
          </span>
          <span>{phase === "running" ? "Aramalar başlatılıyor..." : batchBanner.ctaLabel}</span>
        </button>
      )}
    </div>
  );
}
