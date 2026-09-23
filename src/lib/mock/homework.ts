/**
 * /odevler ekranı için demo veri — canlı (Supabase) veri yokken gösterilir.
 * Öğrenci/veli isimleri uygulamanın diğer mock modülleriyle (randevular, CRM,
 * görüşmeler) tutarlı kurgulanmıştır. Tarihler isteğe göre üretilir ki
 * "bugüne en yakın teslim" sıralaması her gün anlamlı kalsın.
 */
import type { HomeworkAssignmentVM, HomeworkStudent } from "@/components/pages/odevler/odevler-view";

const DAY_MS = 24 * 60 * 60 * 1000;

export const demoHomeworkStudents: HomeworkStudent[] = [
  { id: "og-1", studentName: "Pelin Öztürk", parentName: "Selim Öztürk", grade: "12. Sınıf · YKS", phone: "0532 111 22 33" },
  { id: "og-2", studentName: "Miraç Demir", parentName: "Fatma Demir", grade: "8. Sınıf · LGS", phone: "0533 222 33 44" },
  { id: "og-3", studentName: "Elif Demirtaş", parentName: "Murat Demirtaş", grade: "11. Sınıf · YKS", phone: "0534 333 44 55" },
  { id: "og-4", studentName: "Emre Kaya", parentName: "Zeynep Kaya", grade: "12. Sınıf · YKS", phone: "0535 444 55 66" },
  { id: "og-5", studentName: "Kaan Çelik", parentName: "Aylin Çelik", grade: "10. Sınıf · YKS", phone: "0536 555 66 77" },
  { id: "og-6", studentName: "Zehra Yılmaz", parentName: "Ayşe Yılmaz", grade: "8. Sınıf · LGS", phone: "0537 666 77 88" },
];

function iso(daysFromNow: number, hour = 18): string {
  const d = new Date(Date.now() + daysFromNow * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function buildDemoHomework(): HomeworkAssignmentVM[] {
  return [
    {
      id: "odev-1",
      title: "TYT Matematik — Deneme Kitlesi Sayfa 42-58",
      subject: "Matematik",
      classLevel: "12. Sınıf",
      dueDate: iso(1),
      description: "Temel kavramlar + sayı basamakları karışık çözümlü testler.",
      createdBy: "Merve Hoca",
      marks: {
        "og-1": "done",
        "og-3": "done",
        "og-4": "partial",
        "og-5": "missing",
      },
    },
    {
      id: "odev-2",
      title: "LGS Deneme Analizi — Yanlış Defter Tutumu",
      subject: "Genel Deneme",
      classLevel: "8. Sınıf",
      dueDate: iso(2),
      description: "Hafta sonu denemesinde yanlış yapılan her soru için defter tutulacak.",
      createdBy: "Ahmet Bey",
      marks: {
        "og-2": "done",
        "og-6": "missing",
      },
    },
    {
      id: "odev-3",
      title: "TYT Türkçe — Paragrafta Anlam Soruları 30 Adet",
      subject: "Türkçe",
      classLevel: "Tüm Sınıflar",
      dueDate: iso(4),
      description: "Son 10 yılın çıkmış paragraf sorularından seçme set.",
      createdBy: "Merve Hoca",
      marks: {
        "og-1": "partial",
        "og-3": "missing",
      },
    },
    {
      id: "odev-4",
      title: "AYT Fizik — Düzgün Çembersel Hareket Soru Bankası",
      subject: "Fizik",
      classLevel: "12. Sınıf",
      dueDate: iso(6),
      description: null,
      createdBy: "Serkan Hoca",
      marks: {
        "og-4": "done",
      },
    },
  ];
}
