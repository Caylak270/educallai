/**
 * Örnek haftalık program — boş programdaki ekranlar için tek tıkla yükleme.
 * İsimler "Örnek:" önekiyle başlar; kullanıcı silmek istediğini kolayca ayırt eder.
 * Client-safe: yalnız fetch + saf veri.
 */

export interface OrnekSlot {
  name: string;
  subject: string;
  classLevel: string;
  teacher: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
}

export const ORNEK_PROGRAM: OrnekSlot[] = [
  { name: "Örnek: TYT Matematik", subject: "Matematik", classLevel: "12. Sınıf", teacher: "Merve Hoca", room: "Derslik 1", dayOfWeek: 1, startTime: "15:00", durationMinutes: 90 },
  { name: "Örnek: TYT Türkçe", subject: "Türkçe", classLevel: "12. Sınıf", teacher: "Serkan Hoca", room: "Derslik 1", dayOfWeek: 2, startTime: "15:00", durationMinutes: 60 },
  { name: "Örnek: LGS Matematik", subject: "Matematik", classLevel: "8. Sınıf", teacher: "Merve Hoca", room: "Derslik 2", dayOfWeek: 3, startTime: "17:00", durationMinutes: 60 },
  { name: "Örnek: AYT Fizik", subject: "Fizik", classLevel: "12. Sınıf", teacher: "Serkan Hoca", room: "Derslik 2", dayOfWeek: 5, startTime: "10:00", durationMinutes: 90 },
  { name: "Örnek: LGS İngilizce", subject: "İngilizce", classLevel: "8. Sınıf", teacher: "Ayşe Hoca", room: "Derslik 1", dayOfWeek: 6, startTime: "10:00", durationMinutes: 60 },
];

/** Örnek slotları sırayla kaydeder; başarıyla eklenen sayısını döner. */
export async function ornekProgramYukle(): Promise<number> {
  let eklenen = 0;
  for (const slot of ORNEK_PROGRAM) {
    try {
      const r = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slot),
      });
      const d = await r.json();
      if (d.ok) eklenen += 1;
    } catch {
      // tek tek devam et
    }
  }
  return eklenen;
}
