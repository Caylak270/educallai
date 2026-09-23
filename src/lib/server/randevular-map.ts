/**
 * Supabase appointments + contacts → /randevular ekran modeli.
 * Mock tipleri (src/lib/mock/appointments.ts) birebir üretilir; satırlar
 * güne göre gruplanır (Bugün / Yarın / sonraki günler).
 */

import type {
  Appointment,
  AppointmentStatus,
  Contact,
} from "@/lib/types/db";
import type {
  AppointmentDay,
  AppointmentItem,
  AppointmentStatusMock,
} from "@/lib/mock/appointments";

const TIME = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});

const DAY_LABEL = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  weekday: "long",
});

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function statusToMock(status: AppointmentStatus): AppointmentStatusMock {
  if (status === "cancelled" || status === "no_show") return "iptal";
  if (status === "confirmed" || status === "completed") return "onayli";
  return "bekliyor"; // scheduled | rescheduled
}

const STATUS_TR: Record<AppointmentStatus, string> = {
  scheduled: "Planlandı",
  confirmed: "Onaylandı",
  completed: "Gerçekleşti",
  cancelled: "İptal edildi",
  no_show: "Veli gelmedi",
  rescheduled: "Ertelendi",
};

export interface RandevularView {
  days: AppointmentDay[];
  stats: { today: string; week: string; pending: string; noShowRate: string };
}

/** Canlı randevu satırlarını gün gruplu ekran modeline çevirir. */
export function buildRandevularView(
  rows: Appointment[],
  contacts: Contact[],
): RandevularView {
  const byContact = new Map(contacts.map((c) => [c.id, c]));
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const items: Array<AppointmentItem & { date: Date }> = rows.map((row) => {
    const contact = byContact.get(row.contact_id);
    const date = new Date(row.scheduled_at);
    return {
      id: row.id,
      date,
      time: TIME.format(date),
      durationMinutes: row.duration_minutes ?? 30,
      parentName: contact?.parent_name ?? "Veli",
      studentName: contact?.student_name ?? "Öğrenci",
      grade: [contact?.student_grade, contact?.exam_type]
        .filter(Boolean)
        .join(" · "),
      topic: row.notes?.trim() || "Veli görüşmesi",
      createdBy: row.created_by === "manual" ? "manuel" : row.created_by ?? "manuel",
      status: statusToMock(row.status),
      counselor: "Danışman",
      detail: {
        statusTr: STATUS_TR[row.status],
        phone: contact?.phone ?? "—",
        notes: row.notes ?? "",
        calendarSynced: row.calendar_synced,
      },
    };
  });

  // Gün grupları: Bugün / Yarın / sonrası (tarih etiketiyle)
  const groups = new Map<
    string,
    { label: string; dateLabel: string; items: Array<AppointmentItem & { date: Date }> }
  >();
  for (const item of items) {
    const d = item.date;
    let label: string;
    if (sameDay(d, now)) label = "Bugün";
    else if (sameDay(d, new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)))
      label = "Yarın";
    else label = DAY_LABEL.format(d);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups.has(key)) {
      groups.set(key, { label, dateLabel: DAY_LABEL.format(d), items: [] });
    }
    groups.get(key)!.items.push(item);
  }

  const sortedGroups = [...groups.values()].sort(
    (a, b) =>
      (a.items[0]?.date.getTime() ?? 0) - (b.items[0]?.date.getTime() ?? 0)
  );

  const days: AppointmentDay[] = sortedGroups.map((g) => ({
    label: g.label,
    dateLabel: g.dateLabel,
    items: g.items
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ date: _date, ...rest }) => rest),
  }));

  const todayCount = items.filter((i) => sameDay(i.date, now)).length;
  const weekCount = items.filter(
    (i) => i.date >= todayStart && i.date < weekEnd
  ).length;
  const pendingCount = items.filter((i) => i.status === "bekliyor").length;

  return {
    days,
    stats: {
      today: String(todayCount),
      week: String(weekCount),
      pending: String(pendingCount),
      noShowRate: "—",
    },
  };
}
