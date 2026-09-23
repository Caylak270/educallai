/**
 * Öğrenci Ekosistemi — tek noktadan okuma yardımcısı.
 *
 * Öğrenci 360 kartı yerleştiren her modül bunu çağırır; 8 kaynağın birleşik
 * durumu src/lib/server/ogrenci-durumu.ts tek hesap katmanında türetilir.
 * Herhangi bir kaynak canlı okunamazsa null döner — çağıran sayfa paneli
 * "demo mod" bilgilendirmesiyle gösterir (projenin dürüst fallback deseni).
 */

import {
  getLiveSkillObservations,
  getLiveHomeworkData,
  getLiveAttendanceData,
  getLiveExamResults,
  getLiveEvents,
  getLiveDashboard,
  getLiveScheduleSlots,
} from "./queries";
import { ogrenciDurumHaritasi } from "./ogrenci-durumu";
import type { OgrenciDurumu } from "@/lib/types/ogrenci";
import type { Contact, ScheduleSlot } from "@/lib/types/db";

export interface OgrenciEkosistemGorunumu {
  /** do_not_call filtreli öğrenci listesi (panel seçici bunu kullanır) */
  contacts: Contact[];
  /** contact_id → tüm modüllerden birleşik öğrenci durumu */
  durumlar: Record<string, OgrenciDurumu>;
  /** Sabit haftalık program (schedule_slots) — öğrencinin sınıf programı için */
  program: ScheduleSlot[];
}

export async function getOgrenciEkosistemi(): Promise<OgrenciEkosistemGorunumu | null> {
  const [skills, homework, attendance, exams, events, dash, schedule] = await Promise.all([
    getLiveSkillObservations(),
    getLiveHomeworkData(),
    getLiveAttendanceData(),
    getLiveExamResults(),
    getLiveEvents(),
    getLiveDashboard(),
    getLiveScheduleSlots(),
  ]);
  if (!skills || !homework || !attendance || !exams || !events || !dash) return null;

  const harita = ogrenciDurumHaritasi({
    odevler: homework.assignments,
    submissions: homework.submissions,
    lessons: attendance.lessons,
    attendance: attendance.attendance,
    exams: exams.results,
    skillGozlemleri: skills.observations,
    taksitler: dash.installments,
    gorusmeler: dash.signals,
    randevular: dash.appointments,
    etkinlikler: events.events,
    davetler: events.invites,
  });

  const durumlar: Record<string, OgrenciDurumu> = {};
  for (const [contactId, d] of harita) durumlar[contactId] = d;

  return {
    contacts: skills.contacts.filter((c) => !c.do_not_call),
    durumlar,
    // Program modülü canlı değilse ekosistemi düşürmesin — yalnız boş liste
    program: schedule?.slots ?? [],
  };
}
