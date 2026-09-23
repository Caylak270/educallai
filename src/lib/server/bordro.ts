/**
 * M11 — Öğretmen Bordro hesaplayıcı (TEK KAYNAK).
 * Sabit haftalık program (schedule_slots) + saat ücretlerinden öğretmen
 * başına bordro satırı üretir. Saf fonksiyondur — DB'ye erişmez.
 *
 * Aylık saat = haftalık saat × hafta sayısı (varsayılan 4).
 * Gerçek takvim/izin/devamsızlık hesabı devirde eklenecek (bkz. docs).
 */

export interface BordroSlot {
  teacher: string | null;
  durationMinutes: number;
}

export interface BordroSatiri {
  teacher: string;
  /** Haftalık ders sayısı */
  haftalikDers: number;
  /** Haftalık toplam saat (ders sayısı değil!) */
  haftalikSaat: number;
  /** haftalikSaat × haftaSayısı */
  aylikSaat: number;
  /** Saat ücreti (₺/saat) — tanımlı değilse 0 */
  ucret: number;
  /** ucret tanımlı mı (0 iken bile 0 ücretli öğretmen ayırt edilebilsin diye) */
  ucretTanımlı: boolean;
  /** aylikSaat × ucret */
  tutar: number;
}

export function bordroHesapla(
  slots: BordroSlot[],
  rates: Array<{ teacher: string; hourlyRate: string | number }>,
  haftaSayisi: number
): BordroSatiri[] {
  const hafta = Math.max(1, Math.min(5, haftaSayisi));
  const ogretmenBazli = new Map<string, { ders: number; dakika: number }>();
  for (const s of slots) {
    const ad = s.teacher?.trim();
    if (!ad) continue;
    const k = ogretmenBazli.get(ad) ?? { ders: 0, dakika: 0 };
    k.ders += 1;
    k.dakika += s.durationMinutes;
    ogretmenBazli.set(ad, k);
  }

  const rateHaritasi = new Map<string, { ucret: number; tanımlı: boolean }>();
  for (const r of rates) {
    const ad = r.teacher.trim();
    const deger = Number(r.hourlyRate);
    if (!ad || Number.isNaN(deger)) continue;
    // 0 da geçerli bir tanımlı değerdir (ücretsiz/gönüllü)
    rateHaritasi.set(ad.toLocaleLowerCase("tr-TR"), { ucret: deger, tanımlı: true });
  }

  return Array.from(ogretmenBazli.entries())
    .map(([ad, k]) => {
      const haftalikSaat = Math.round((k.dakika / 60) * 100) / 100;
      const aylikSaat = Math.round(haftalikSaat * hafta * 100) / 100;
      const rate = rateHaritasi.get(ad.toLocaleLowerCase("tr-TR"));
      const ucret = rate?.ucret ?? 0;
      return {
        teacher: ad,
        haftalikDers: k.ders,
        haftalikSaat,
        aylikSaat,
        ucret,
        ucretTanımlı: rate?.tanımlı ?? false,
        tutar: Math.round(aylikSaat * ucret * 100) / 100,
      };
    })
    .sort((a, b) => b.tutar - a.tutar || a.teacher.localeCompare(b.teacher, "tr-TR"));
}
