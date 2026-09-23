/**
 * Raporlar sayfası canlı veri — conversation_signals üzerinden telemetri.
 * Mock tipleri (src/lib/mock/reports.ts) birebir üretilir.
 */

import type { ConversationSignal } from "@/lib/types/db";

export interface ReportKpi {
  label: string;
  value: string;
  hint: string;
  delta: string;
  deltaTone: "positive" | "negative";
}

function last7DaysLabels(): string[] {
  const fmt = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(fmt.format(d));
  }
  return out;
}

/** Canlı telemetri raporu üretir. */
export function buildReportsView(signals: ConversationSignal[]) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const last7 = signals.filter((s) => now - new Date(s.created_at).getTime() <= 7 * DAY);
  const prev7 = signals.filter((s) => {
    const age = now - new Date(s.created_at).getTime();
    return age > 7 * DAY && age <= 14 * DAY;
  });

  const answered = last7.filter((s) => (s.duration_seconds ?? 0) > 15).length;
  const answeredPrev = prev7.filter((s) => (s.duration_seconds ?? 0) > 15).length;
  const missed = last7.length - answered;
  const handoff = last7.filter((s) => s.recommend_handoff).length;
  const positive = last7.filter((s) => s.sentiment === "positive").length;
  const durations = last7
    .map((s) => s.duration_seconds ?? 0)
    .filter((d) => d > 0);
  const avgMin = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length / 60
    : 0;

  const trend = (curr: number, prev: number): string => {
    if (prev === 0) return curr > 0 ? "yeni" : "—";
    const pct = Math.round(((curr - prev) / prev) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}% geçen haftaya göre`;
  };
  const tone = (curr: number, prev: number): "positive" | "negative" =>
    curr >= prev ? "positive" : "negative";

  const kpis: ReportKpi[] = [
    {
      label: "Haftalık Görüşme",
      value: String(last7.length),
      hint: "Son 7 günde tamamlanan",
      delta: trend(last7.length, prev7.length),
      deltaTone: tone(last7.length, prev7.length),
    },
    {
      label: "Cevaplanma Oranı",
      value: `%${last7.length ? Math.round((answered / last7.length) * 100) : 0}`,
      hint: `${answered} cevaplanan · ${missed} kısa/cevapsız`,
      delta: trend(answered, answeredPrev),
      deltaTone: tone(answered, answeredPrev),
    },
    {
      label: "Danışman Handoff",
      value: String(handoff),
      hint: "Yönlendirme önerilen görüşme",
      delta: trend(handoff, prev7.filter((s) => s.recommend_handoff).length),
      deltaTone: tone(handoff, prev7.filter((s) => s.recommend_handoff).length),
    },
    {
      label: "Ortalama Süre",
      value: `${avgMin.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} dk`,
      hint: `${positive} pozitif duygu saptandı`,
      delta: "son 7 gün",
      deltaTone: "positive",
    },
  ];

  // Günlük hacim (son 7 gün)
  const labels = last7DaysLabels();
  const weekly = labels.map((day, i) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (6 - i));
    const dayEnd = dayStart.getTime() + DAY;
    const daySignals = signals.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= dayStart.getTime() && t < dayEnd;
    });
    const a = daySignals.filter((s) => (s.duration_seconds ?? 0) > 15).length;
    return { day, answered: a, missed: daySignals.length - a };
  });

  // Kanal dağılımı: conversation_signals yalnız sesli; kanal kırılımı şimdilik ses odaklı
  const total = signals.length;
  const channelBreakdown = [
    {
      label: "Sesli arama (AI)",
      value: total,
      color: "bg-primary-container",
      percent: 100,
    },
  ];

  return { kpis, weekly, channelBreakdown, total };
}
