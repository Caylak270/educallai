/** /randevular ekranı için örnek randevu verisi. */

export type AppointmentStatusMock = "onayli" | "bekliyor" | "iptal";

export interface AppointmentItem {
  id: string;
  time: string;
  durationMinutes: number;
  parentName: string;
  studentName: string;
  grade: string;
  topic: string;
  createdBy: "ai_voice" | "ai_whatsapp" | "manuel";
  status: AppointmentStatusMock;
  counselor: string;
}

export interface AppointmentDay {
  label: string;
  dateLabel: string;
  items: AppointmentItem[];
}

export const appointmentDays: AppointmentDay[] = [
  {
    label: "Bugün",
    dateLabel: "14 Ekim Pazartesi",
    items: [
      {
        id: "r1",
        time: "11:30",
        durationMinutes: 45,
        parentName: "Selim Öztürk",
        studentName: "Pelin Öztürk",
        grade: "12. Sınıf · YKS",
        topic: "YKS_veli bilgilendirme ve bursluluk sınavı kaydı",
        createdBy: "ai_voice",
        status: "onayli",
        counselor: "Merve Hoca",
      },
      {
        id: "r2",
        time: "14:00",
        durationMinutes: 60,
        parentName: "Fatma Demir",
        studentName: "Miraç Demir",
        grade: "8. Sınıf · LGS",
        topic: "VIP sınıf tanıtımı + kampüs turu",
        createdBy: "ai_whatsapp",
        status: "bekliyor",
        counselor: "Ahmet Bey (Müdür)",
      },
      {
        id: "r3",
        time: "16:15",
        durationMinutes: 30,
        parentName: "Burak Yılmaz",
        studentName: "Efe Yılmaz",
        grade: "11. Sınıf · Sayısal",
        topic: "Seviye tespit sonucu + ders programı",
        createdBy: "ai_voice",
        status: "onayli",
        counselor: "Ceren Hoca",
      },
      {
        id: "r4",
        time: "17:45",
        durationMinutes: 45,
        parentName: "Emel Çetin",
        studentName: "Arda Çetin",
        grade: "9. Sınıf · LGS",
        topic: "Kayıt yenileme ve ödeme planı",
        createdBy: "manuel",
        status: "iptal",
        counselor: "Danışman — Müge Hoca",
      },
    ],
  },
  {
    label: "Yarın",
    dateLabel: "15 Ekim Salı",
    items: [
      {
        id: "r5",
        time: "10:00",
        durationMinutes: 30,
        parentName: "Zeynep Kaya",
        studentName: "Emre Kaya",
        grade: "11. Sınıf · Sayısal (YKS)",
        topic: "Birebir koçluk programı tanıtımı",
        createdBy: "ai_voice",
        status: "onayli",
        counselor: "Merve Hoca",
      },
      {
        id: "r6",
        time: "13:30",
        durationMinutes: 45,
        parentName: "Murat Demirtaş",
        studentName: "Elif Demirtaş",
        grade: "8. Sınıf · LGS",
        topic: "Bursluluk sınavı kaydı",
        createdBy: "ai_whatsapp",
        status: "bekliyor",
        counselor: "Ahmet Bey (Müdür)",
      },
      {
        id: "r7",
        time: "16:00",
        durationMinutes: 30,
        parentName: "Selda Aydın",
        studentName: "Defne Aydın",
        grade: "12. Sınıf · Eşit Ağırlık",
        topic: "Taksit planı yeniden yapılandırma",
        createdBy: "manuel",
        status: "onayli",
        counselor: "Selin Yılmaz",
      },
    ],
  },
  {
    label: "Perşembe",
    dateLabel: "17 Ekim Perşembe",
    items: [
      {
        id: "r8",
        time: "15:00",
        durationMinutes: 60,
        parentName: "Hasan Koç",
        studentName: "Barış Koç",
        grade: "12. Sınıf · Eşit Ağırlık",
        topic: "Deneme analizi değerlendirmesi",
        createdBy: "ai_voice",
        status: "onayli",
        counselor: "Ceren Hoca",
      },
    ],
  },
];

export const appointmentStats = {
  today: 4,
  week: 12,
  pending: 2,
  noShowRate: "%8",
};
