/**
 * M9.2 — Öğrenci başına ödev performansı hesaplayıcı (TEK KAYNAK).
 * Risk Paneli, Beceri Karnesi ve Veli Bülteni aynı haritayı kullanır;
 * yeni modüller de buradan bağlanmalı ki performans dili tek olsun.
 * Saf fonksiyondur — demo/canlı ayrımı yapmaz, DB'ye erişmez.
 */

export interface OdevPerformans {
  /** En az bir işareti olan ödev sayısı */
  total: number;
  done: number;
  partial: number;
  missing: number;
}

type SubmissionLike = { contact_id: string; status: string };

/** contact_id → OdevPerformans haritası üretir. */
export function odevPerformansHaritasi(
  submissions: SubmissionLike[]
): Map<string, OdevPerformans> {
  const harita = new Map<string, OdevPerformans>();
  for (const s of submissions) {
    if (s.status !== "done" && s.status !== "partial" && s.status !== "missing") continue;
    const p =
      harita.get(s.contact_id) ?? { total: 0, done: 0, partial: 0, missing: 0 };
    p.total += 1;
    if (s.status === "done") p.done += 1;
    else if (s.status === "partial") p.partial += 1;
    else p.missing += 1;
    harita.set(s.contact_id, p);
  }
  return harita;
}

/** "3/8 yapıldı (2 eksik)" biçiminde okunur satır; veri yoksa null. */
export function odevPerformansSatiri(p: OdevPerformans | null | undefined): string | null {
  if (!p || p.total === 0) return null;
  const eksik = p.missing > 0 ? `, ${p.missing} eksik` : "";
  return `${p.done}/${p.total} yapıldı${eksik}`;
}
