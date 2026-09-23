/**
 * /ders-programi ekranı için demo sabit haftalık program — canlı veri
 * yokken gösterilir. Slotlar gün-of-week bazlıdır (her hafta aynı görünür).
 */
import type { ScheduleSlotVM } from "@/components/pages/ders-programi/ders-programi-view";
import type { OgretmenUcretiVM } from "@/components/pages/ogretmen-bordro/ogretmen-bordro-view";

/** Demo öğretmen ücretleri (bordro modülü demo modu). */
export const demoOgretmenUcretleri: OgretmenUcretiVM[] = [
  { teacher: "Merve Hoca", hourlyRate: 300 },
  { teacher: "Serkan Hoca", hourlyRate: 250 },
];

export function buildDemoScheduleSlots(): ScheduleSlotVM[] {
  return [
    {
      id: "slot-1",
      name: "TYT Matematik",
      subject: "Matematik",
      classLevel: "12. Sınıf",
      teacher: "Merve Hoca",
      room: "Derslik 1",
      dayOfWeek: 1,
      startTime: "15:00",
      durationMinutes: 90,
    },
    {
      id: "slot-2",
      name: "TYT Türkçe",
      subject: "Türkçe",
      classLevel: "12. Sınıf",
      teacher: "Serkan Hoca",
      room: "Derslik 1",
      dayOfWeek: 2,
      startTime: "15:00",
      durationMinutes: 60,
    },
    {
      id: "slot-3",
      name: "LGS Matematik",
      subject: "Matematik",
      classLevel: "8. Sınıf",
      teacher: "Merve Hoca",
      room: "Derslik 2",
      dayOfWeek: 3,
      startTime: "17:00",
      durationMinutes: 60,
    },
    {
      id: "slot-4",
      name: "AYT Fizik",
      subject: "Fizik",
      classLevel: "12. Sınıf",
      teacher: "Serkan Hoca",
      room: "Derslik 2",
      dayOfWeek: 5,
      startTime: "10:00",
      durationMinutes: 90,
    },
  ];
}
