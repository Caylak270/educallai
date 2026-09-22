"use client";

import { useState } from "react";

import { WA_LOSS_CALCULATOR } from "@/components/site/links";

const formatTRY = (n: number) => "₺" + n.toLocaleString("tr-TR");

export function LossCalculator() {
  const [students, setStudents] = useState(500);
  const [price, setPrice] = useState(95000);
  const [ratio, setRatio] = useState(25);

  const lostStudents = Math.round(students * (ratio / 100));
  const lostRevenue = lostStudents * price;
  const savedRevenue = Math.round(lostRevenue * 0.4);

  const sliderClass =
    "h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-primary";

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-8 lg:grid-cols-12">
      {/* Sürgüler */}
      <div className="space-y-6 rounded-2xl border border-obsidian-border bg-obsidian-surface p-6 lg:col-span-7">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-title-md text-body-sm text-surface-container-lowest">
              Dönemlik Aday &amp; Mevcut Veli Sayısı
            </label>
            <span className="font-mono font-bold text-body-md text-voice-teal">
              {students} veli
            </span>
          </div>
          <input
            className={sliderClass}
            max={2500}
            min={100}
            step={50}
            type="range"
            value={students}
            onChange={(e) => setStudents(parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-title-md text-body-sm text-surface-container-lowest">
              Yıllık Ortalama Eğitim / Kurs Ücreti
            </label>
            <span className="font-mono font-bold text-body-md text-voice-teal">
              {formatTRY(price)}
            </span>
          </div>
          <input
            className={sliderClass}
            max={250000}
            min={30000}
            step={5000}
            type="range"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-title-md text-body-sm text-surface-container-lowest">
              Geri Dönülemeyen / Cevapsız Kalan Veli Oranı
            </label>
            <span className="font-mono font-bold text-body-md text-critical-rose">
              %{ratio}
            </span>
          </div>
          <input
            className={sliderClass}
            max={60}
            min={5}
            step={5}
            type="range"
            value={ratio}
            onChange={(e) => setRatio(parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* Sonuç matrisi */}
      <div className="flex flex-col justify-between space-y-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-obsidian-surface via-slate-900 to-obsidian-surface p-6 shadow-xl lg:col-span-5">
        <div className="space-y-4">
          <div>
            <span className="font-label-sm font-mono text-label-sm uppercase tracking-wider text-outline-variant">
              Ulaşılamayan Kayıp Öğrenci
            </span>
            <div className="mt-0.5 font-mono font-bold text-[32px] text-critical-rose">
              {lostStudents} Öğrenci
            </div>
          </div>
          <div className="border-t border-obsidian-border pt-2">
            <span className="font-label-sm font-mono text-label-sm uppercase tracking-wider text-outline-variant">
              Riskteki Yıllık Kayıt Geliri
            </span>
            <div className="mt-0.5 font-mono font-bold text-[32px] text-surface-container-lowest">
              {formatTRY(lostRevenue)}
            </div>
          </div>
          <div className="border-t border-obsidian-border pt-2">
            <span className="font-label-sm font-mono text-label-sm uppercase tracking-wider text-voice-teal">
              educallai ile Kurtarılabilir Ciro
            </span>
            <div className="mt-0.5 font-mono font-bold text-[36px] text-voice-teal">
              {formatTRY(savedRevenue)}
            </div>
            <p className="mt-1 font-mono text-[11px] text-outline-variant">
              %40 minimum dönüşüm artış katsayısıyla
            </p>
          </div>
        </div>
        <a
          href={WA_LOSS_CALCULATOR}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-whatsapp-deep px-4 py-3.5 font-title-md text-body-sm text-surface-container-lowest shadow-md transition-all hover:bg-secondary active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Bu Kaybı WhatsApp&apos;tan Konuşalım</span>
        </a>
      </div>
    </div>
  );
}
