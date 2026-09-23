"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { batchCallBanner, installmentRecords } from "@/lib/mock/installments";

export interface BatchCallTarget {
  id: string;
  name: string;
  phone?: string;
}

type BatchStage = "idle" | "confirm" | "running" | "done" | "error";

/**
 * Toplu AI hatırlatıcı — sahte zamanlayıcı YOK.
 * Geciken taksitli velilere tek tek POST /api/calls ile gerçek (veya demo kaydı
 * atan) arama başlatır: iki aşamalı onay + "3/7 arandı" gerçek sayaç.
 * Telefon bilinmeyen veliler için /veliler?q= aramasına yönlendirir.
 */
export function BatchCallTrigger({
  targets: liveTargets,
}: {
  /** Canlı geciken veli listesi (Supabase). Verilmezse demo geciken kayıtlar kullanılır. */
  targets?: BatchCallTarget[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState<BatchStage>("idle");
  const [calledCount, setCalledCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Canlı veri yoksa demo geciken kayıtlar (telefonsuz → /veliler yönlendirmesi).
  const targets = useMemo<BatchCallTarget[]>(
    () =>
      liveTargets ??
      installmentRecords
        .filter((r) => r.filters.includes("overdue"))
        .map((r) => ({ id: r.id, name: r.parentName })),
    [liveTargets]
  );
  const callable = targets.filter((t): t is BatchCallTarget & { phone: string } => Boolean(t.phone));

  const reset = () => {
    setStage("idle");
    setCalledCount(0);
    setErrorMsg(null);
  };

  /** Onay sonrası: her veli için sırayla POST /api/calls (call-button deseni). */
  const runBatch = async () => {
    // Telefonu olan kimse yoksa veli adıyla rehber aramasına yönlendir.
    if (callable.length === 0) {
      const firstName = targets[0]?.name ?? "";
      router.push(
        firstName
          ? `/veliler?q=${encodeURIComponent(firstName)}`
          : "/veliler"
      );
      return;
    }
    setStage("running");
    setCalledCount(0);
    setErrorMsg(null);
    let ok = 0;
    for (const target of callable) {
      try {
        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: target.phone,
            name: target.name,
            leadId: target.id,
            context: "Toplu tahsilat hatırlatması",
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          setStage("error");
          setErrorMsg(
            `${target.name} aranamadı${data?.error ? ` (${data.error})` : ""} — kalan aramalar durduruldu.`
          );
          setCalledCount(ok);
          return;
        }
        ok += 1;
        setCalledCount(ok);
      } catch {
        setStage("error");
        setErrorMsg("Sunucuya ulaşılamadı — kalan aramalar durduruldu.");
        setCalledCount(ok);
        return;
      }
    }
    setStage("done");
  };

  return (
    <aside
      aria-label="Toplu İşlemler"
      className="pointer-events-none sticky bottom-4 z-30 mt-2 w-full"
    >
      <div className="pointer-events-auto flex flex-col gap-2 rounded-xl bg-inverse-surface p-3 pl-4 text-inverse-on-surface shadow-lg sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="material-symbols-outlined shrink-0 text-[20px] text-secondary">
            record_voice_over
          </span>
          <div className="min-w-0">
            <div className="truncate font-label-md text-label-md font-bold text-inverse-on-surface">
              {batchCallBanner.title}
            </div>
            <p className="truncate font-label-sm text-label-sm text-inverse-on-surface/80">
              {callable.length > 0
                ? `${callable.length} geciken veli aranacak`
                : "Telefonu olan geciken veli yok — veliler sayfasından arayın"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {/* Gerçek ilerleme sayacı */}
          {stage === "running" ? (
            <span className="font-label-sm text-label-sm font-semibold text-inverse-on-surface/90">
              {calledCount}/{callable.length} arandı
            </span>
          ) : null}
          {stage === "done" ? (
            <span className="font-label-sm text-label-sm font-semibold text-secondary">
              {calledCount}/{callable.length} veli arandı ✓
            </span>
          ) : null}

          {stage === "idle" || stage === "done" ? (
            <button
              type="button"
              onClick={() => (stage === "done" ? reset() : setStage("confirm"))}
              disabled={callable.length === 0}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary-container px-3.5 font-label-sm text-label-sm font-bold text-on-primary transition hover:bg-primary active:scale-95 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">
                {stage === "done" ? "refresh" : "play_arrow"}
              </span>
              <span>{stage === "done" ? "Yeniden Başlat" : batchCallBanner.startLabel}</span>
            </button>
          ) : null}

          {/* İki aşamalı onay: ilk tık → inline Onayla / Vazgeç */}
          {stage === "confirm" ? (
            <>
              <span className="font-label-sm text-label-sm font-semibold">
                {callable.length > 0
                  ? `${callable.length} veli aranacak — onaylıyor musunuz?`
                  : "Telefon listesi boş — veliler sayfasına yönlendirileceksiniz."}
              </span>
              <button
                type="button"
                onClick={() => void runBatch()}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-primary-container px-3.5 font-label-sm text-label-sm font-bold text-on-primary transition hover:bg-primary active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Onayla</span>
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex h-9 items-center rounded-xl border border-inverse-on-surface/30 px-3.5 font-label-sm text-label-sm font-semibold text-inverse-on-surface transition hover:bg-inverse-on-surface/10"
              >
                Vazgeç
              </button>
            </>
          ) : null}

          {/* Sıralı arama çalışıyor */}
          {stage === "running" ? (
            <button
              type="button"
              disabled
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary-container px-3.5 font-label-sm text-label-sm font-bold text-on-primary opacity-80"
            >
              <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
              <span>Aranıyor...</span>
            </button>
          ) : null}

          {/* Hata: kalan aramalar durduruldu */}
          {stage === "error" ? (
            <>
              <button
                type="button"
                onClick={reset}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-error-container px-3.5 font-label-sm text-label-sm font-bold text-on-error-container transition hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Sıfırla</span>
              </button>
            </>
          ) : null}
        </div>

        {errorMsg ? (
          <p className="font-label-sm text-label-sm font-semibold text-error-container sm:basis-full" role="alert">
            {errorMsg}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
