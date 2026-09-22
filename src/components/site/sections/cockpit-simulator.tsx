"use client";

import { CallTestForm } from "@/components/site/sections/call-test-form";
import { LivePanel } from "@/components/site/sections/live-panel";
import { CountUp } from "@/components/site/count-up";
import { WA_DEMO_CALL } from "@/components/site/links";

/*
  Canlı Deneyim Kokpiti — Stitch tasarımındaki simüle transkript/CRM
  kolonlarının yerine gerçek panel (LivePanel) gömülü; lead formu
  (Telefonunuz Çalsın) yan kolonda korunur.
*/
export function CockpitSimulator() {
  return (
    <>
      {/* Canlı bar metrik */}
      <div className="flex items-center justify-between rounded-lg border border-obsidian-border bg-obsidian-surface px-4 py-2 font-mono-data text-mono-data text-surface-container-low">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-voice-teal" />
          <span>ŞU ANDA CANLI — Türkiye geneli tüm kurslarımızda:</span>
        </div>
        <div className="flex items-center gap-4 text-outline-variant">
          <span>
            <CountUp value={14824} className="text-surface-container-lowest" /> veli
            arandı
          </span>
          <span>
            <CountUp value={4192} className="text-voice-teal" /> randevu alındı
          </span>
          <span className="hidden sm:inline">
            <strong className="text-secondary-fixed">₺2.48M</strong> geciken taksit
            kapatıldı
          </span>
        </div>
      </div>

      {/* Canlı panel tam genişlikte — iframe ≥1024px olursa panel masaüstü
          düzeninde (sabit sidebar) açılır; bölünürse mobil düzenine düşer. */}
      <LivePanel />

      {/* Ziyaretçiye canlı arama bandı */}
      <div
        id="canli-test"
        className="scroll-mt-24 rounded-2xl border border-primary/30 bg-gradient-to-r from-obsidian-surface to-slate-900 p-5 sm:p-6"
      >
        <div className="grid items-center gap-5 lg:grid-cols-12">
          <div className="space-y-1.5 lg:col-span-4">
            <span className="inline-flex items-center gap-1 rounded bg-primary/20 px-2 py-0.5 font-mono text-[11px] uppercase text-primary-fixed-dim">
              Hemen Canlı Test Edin
            </span>
            <h3 className="font-title-lg text-surface-container-lowest">
              Telefonunuz Çalsın
            </h3>
            <p className="font-body-sm text-[12px] text-outline-variant">
              Bilgilerinizi yazın; WhatsApp&apos;tan bize iletilsin. Ücretsiz test
              çağrısını biz planlayıp sizin adınıza yapalım.
            </p>
          </div>
          <div className="lg:col-span-8">
            <CallTestForm />
            <p className="mt-2 text-center font-mono text-[11px] text-outline-variant">
              Otomatik arama yapılmaz; numaranız yalnızca test çağrısı planlamak
              için kullanılır.
            </p>
          </div>
        </div>
      </div>

      {/* Alt şerit */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-obsidian-border pt-2 sm:flex-row">
        <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-voice-teal">
            auto_awesome
          </span>
          <span>
            Aynı otonom akış kendi kurumunuzda — 1 günde sıfır kurulumla entegre
            ediyoruz.
          </span>
        </div>
          <a
            href={WA_DEMO_CALL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-title-md text-body-sm text-on-primary transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>{" "}
            WhatsApp&apos;tan Görüşün
          </a>
      </div>
    </>
  );
}
