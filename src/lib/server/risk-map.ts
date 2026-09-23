/**
 * M1 — Öğrenci Risk Paneli görüntü modeli.
 * Risk skoru (0-100) kategori + net değişimi + sınav sıklığı + duygu durumu +
 * rehberlik dokunuşundan türetilir; deterministik ve açıklanabilir tutulur.
 */

import type { RiskStudentRow } from "./queries";
import type { OdevPerformans } from "./odev-performans";
import type { OgrenciDurumu } from "@/lib/types/ogrenci";

export type RiskLevel = "yuksek" | "orta" | "dusuk";

export interface RiskStudent {
  id: string; // contact_id
  name: string;
  grade: string;
  parentName: string;
  phone: string;
  category: string | null;
  categoryLabel: string;
  riskScore: number;
  riskLevel: RiskLevel;
  net: number;
  delta: number | null;
  examCount: number;
  lastExamDate: string | null;
  sentiment: string | null;
  doNotCall: boolean;
  noteCount: number;
  /** Ödev performansı — hiç işaretli ödevi yoksa null */
  homework: OdevPerformans | null;
  /** SVG sparkline (viewBox 60x16) */
  sparkline: { points: string; color: string };
  /** Skoru oluşturan kalemler — açıklanabilirlik için */
  factors: string[];
}

export const CATEGORY_LABEL: Record<string, string> = {
  RISING: "Yükselen",
  DECLINING: "Düşüşte",
  PLATEAU: "Plato",
  TOP_PERFORMER: "Zirve",
  FIRST_TIMER: "İlk Sınav",
};

function sparkline(nets: number[]): RiskStudent["sparkline"] {
  if (nets.length < 2) return { points: "2,8 58,8", color: "#777587" };
  const min = Math.min(...nets);
  const max = Math.max(...nets);
  const span = max - min || 1;
  const pts = nets.map((n, i) => {
    const x = 2 + (56 * i) / (nets.length - 1);
    const y = 14 - ((n - min) / span) * 12;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const declining = nets[nets.length - 1] < nets[0];
  return { points: pts.join(" "), color: declining ? "#ba1a1a" : "#006b5f" };
}

export function buildRiskList(
  rows: RiskStudentRow[],
  /** Ekosistem durumu (ogrenci-durumu.ts) — canlı modda devamsızlık/taksit/etkinlik faktörleri ekler */
  durumlar?: Record<string, OgrenciDurumu>
): RiskStudent[] {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const students: RiskStudent[] = rows.map((row) => {
    const { contact, exams } = row;
    const nets = exams.map((e) => Number(e.total_net ?? 0));
    const last = exams[exams.length - 1];
    const prev = nets.length > 1 ? nets[nets.length - 2] : null;
    const delta = prev !== null ? nets[nets.length - 1] - prev : null;
    const category = last?.category ?? null;
    const factors: string[] = [];
    let score = 20;

    if (category === "DECLINING") {
      score += 40;
      factors.push("Kategori: düşüşte (+40)");
    } else if (category === "PLATEAU") {
      score += 20;
      factors.push("Kategori: plato (+20)");
    } else if (category === "FIRST_TIMER") {
      score += 10;
      factors.push("İlk sınav (+10)");
    } else if (category === "TOP_PERFORMER") {
      score -= 10;
      factors.push("Zirve performans (−10)");
    } else if (category === "RISING") {
      score -= 5;
      factors.push("Yükseliş (−5)");
    }

    if (delta !== null && delta < 0) {
      const penalty = Math.min(25, Math.round(Math.abs(delta) * 3));
      score += penalty;
      factors.push(`Net kaybı ${delta.toLocaleString("tr-TR")} (+${penalty})`);
    } else if (delta !== null && delta > 0) {
      score -= 5;
      factors.push("Net artışı (−5)");
    }

    const lastDate = last?.exam_date ? new Date(last.exam_date) : null;
    if (lastDate && now - lastDate.getTime() > 30 * DAY) {
      score += 10;
      factors.push("Son sınav >30 gün önce (+10)");
    }

    if (row.sentiment === "negative") {
      score += 15;
      factors.push("Olumsuz veli duygusu (+15)");
    }

    if (row.noteCount === 0) {
      score += 5;
      factors.push("Rehberlik kaydı yok (+5)");
    }

    // Ödev performansı (M9.2) — odev-performans.ts haritasından gelir
    const hw = row.homework;
    if (hw && hw.total > 0) {
      const missingRatio = hw.missing / hw.total;
      if (missingRatio >= 0.5) {
        score += 20;
        factors.push(`Ödevlerin çoğu yapılmadı: ${hw.missing}/${hw.total} (+20)`);
      } else if (hw.missing > 0) {
        score += 10;
        factors.push(`Eksik ödev var: ${hw.missing}/${hw.total} (+10)`);
      } else {
        score -= 5;
        factors.push("Ödevleri düzenli (−5)");
      }
    }

    // Ekosistem faktörleri — ogrenci-durumu.ts tek kaynaktan (A3):
    // artık yalnız ödev değil; devamsızlık, tahsilat ve etkinlik de skora girer.
    const durum = durumlar?.[contact.id];
    if (durum) {
      if (durum.yoklama.absent >= 2) {
        score += 10;
        factors.push(`${durum.yoklama.absent} devamsızlık (+10)`);
      }
      if (durum.tahsilat.geciken > 0) {
        score += 15;
        factors.push(`${durum.tahsilat.geciken} gecikmiş taksit (+15)`);
      }
      if (durum.etkinlik.davet >= 3 && durum.etkinlik.katildi === 0) {
        score += 5;
        factors.push(`${durum.etkinlik.davet} davete hiç katılmadı (+5)`);
      }
    }

    const riskScore = Math.max(0, Math.min(100, score));
    const riskLevel: RiskLevel = riskScore >= 60 ? "yuksek" : riskScore >= 35 ? "orta" : "dusuk";

    return {
      id: contact.id,
      name: contact.student_name ?? "Öğrenci",
      grade: [contact.student_grade, contact.exam_type].filter(Boolean).join(" · "),
      parentName: contact.parent_name ?? "Veli",
      phone: contact.phone ?? "—",
      category,
      categoryLabel: category ? CATEGORY_LABEL[category] ?? category : "—",
      riskScore,
      riskLevel,
      net: nets[nets.length - 1] ?? 0,
      delta,
      examCount: exams.length,
      lastExamDate: last?.exam_date ?? null,
      sentiment: row.sentiment,
      doNotCall: contact.do_not_call,
      noteCount: row.noteCount,
      homework: row.homework,
      sparkline: sparkline(nets),
      factors,
    };
  });

  return students.sort((a, b) => b.riskScore - a.riskScore);
}
