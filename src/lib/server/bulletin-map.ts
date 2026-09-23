/**
 * M5 — Veli Bülteni: öğrenci başına haftalık gelişim özeti üretimi.
 * Deneme sonucu + yoklama + beceri karnesi mevcut tablolardan birleştirilir.
 */

import type { Contact, ExamResult } from "@/lib/types/db";
import type { AttendanceRow } from "@/lib/types/db";
import type { SkillObservation } from "@/lib/types/db";
import { SKILLS } from "@/lib/skills";
import { odevPerformansHaritasi, odevPerformansSatiri } from "./odev-performans";

export interface StudentBulletin {
  contactId: string;
  parentName: string;
  parentPhone: string;
  studentName: string;
  grade: string;
  examLine: string | null;
  attendanceLine: string | null;
  /** M9.2: "3/8 yapıldı, 2 eksik" biçiminde ödev özeti */
  homeworkLine: string | null;
  /** A3: etkinlik katılımı — event_invites'tan türetilir */
  eventLine: string | null;
  topSkill: string | null;
  weakSkill: string | null;
}

export interface BulletinBundle {
  students: StudentBulletin[];
  dershaneName: string;
}

export function buildBulletins(
  contacts: Contact[],
  exams: ExamResult[],
  attendance: AttendanceRow[],
  skillObservations: SkillObservation[],
  dershaneName: string,
  /** M9.2: ödev işaretleri (homework_submissions satırları) */
  homeworkSubmissions: Array<{ contact_id: string; status: string }> = [],
  /** A3: etkinlikler + davetler — katılım satırı için (event_invites/status=katildi) */
  events: Array<{ id: string; name: string; event_date: string }> = [],
  invites: Array<{ event_id: string; contact_id: string; status: string }> = []
): BulletinBundle {
  const odevHaritasi = odevPerformansHaritasi(homeworkSubmissions);

  // contact_id → katıldığı etkinlikler (ad + tarih)
  const katilimlar = new Map<string, { ad: string; tarih: string | null }[]>();
  for (const davet of invites) {
    if (davet.status !== "katildi") continue;
    const etkinlik = events.find((e) => e.id === davet.event_id);
    const liste = katilimlar.get(davet.contact_id) ?? [];
    liste.push({ ad: etkinlik?.name ?? "Etkinlik", tarih: etkinlik?.event_date ?? null });
    katilimlar.set(davet.contact_id, liste);
  }

  const students = contacts
    .filter((c) => !c.do_not_call)
    .map((contact) => {
      // Son deneme
      const studentExams = exams
        .filter((e) => e.contact_id === contact.id)
        .sort(
          (a, b) =>
            new Date(b.exam_date ?? 0).getTime() - new Date(a.exam_date ?? 0).getTime()
        );
      const last = studentExams[0];
      const prev = studentExams[1];
      let examLine: string | null = null;
      if (last) {
        const net = Number(last.total_net ?? 0).toLocaleString("tr-TR", {
          maximumFractionDigits: 2,
        });
        const delta =
          prev !== undefined
            ? Number(last.total_net ?? 0) - Number(prev.total_net ?? 0)
            : null;
        const deltaStr =
          delta === null
            ? ""
            : delta >= 0
              ? ` (+${delta.toLocaleString("tr-TR")})`
              : ` (${delta.toLocaleString("tr-TR")})`;
        examLine = `${last.exam_name ?? "Deneme"} — ${net} net${deltaStr}`;
      }

      // Yoklama özeti
      const studentAttendance = attendance.filter((a) => a.contact_id === contact.id);
      let attendanceLine: string | null = null;
      if (studentAttendance.length > 0) {
        const present = studentAttendance.filter((a) => a.status === "present").length;
        const late = studentAttendance.filter((a) => a.status === "late").length;
        const absent = studentAttendance.filter((a) => a.status === "absent").length;
        attendanceLine = `${present} derse katıldı${late ? `, ${late} geç kaldı` : ""}${absent ? `, ${absent} devamsız` : ""}`;
      }

      // Beceri ortalamaları
      const observations = skillObservations.filter(
        (o) => o.contact_id === contact.id
      );
      let topSkill: string | null = null;
      let weakSkill: string | null = null;
      if (observations.length > 0) {
        const scored = SKILLS.map((skill) => {
          const list = observations.filter((o) => o.skill === skill.id);
          return {
            label: skill.label,
            avg: list.length ? list.reduce((sum, o) => sum + o.score, 0) / list.length : 0,
          };
        }).filter((s) => s.avg > 0);
        scored.sort((a, b) => b.avg - a.avg);
        topSkill = scored[0] ? `${scored[0].label} (${scored[0].avg.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}/5)` : null;
        weakSkill = scored.length > 1 ? `${scored[scored.length - 1].label} (${scored[scored.length - 1].avg.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}/5)` : null;
      }

      // Etkinlik katılımı (A3) — tek katılım adıyla, çoklu katılım özetle
      const ogrenciEtkinlikleri = katilimlar.get(contact.id) ?? [];
      let eventLine: string | null = null;
      if (ogrenciEtkinlikleri.length === 1) {
        eventLine = ogrenciEtkinlikleri[0].ad;
      } else if (ogrenciEtkinlikleri.length > 1) {
        const son = [...ogrenciEtkinlikleri].sort(
          (a, b) => new Date(b.tarih ?? 0).getTime() - new Date(a.tarih ?? 0).getTime()
        )[0];
        eventLine = `${ogrenciEtkinlikleri.length} etkinliğe katıldı · son: ${son.ad}`;
      }

      return {
        contactId: contact.id,
        parentName: contact.parent_name ?? "Veli",
        parentPhone: contact.phone ?? "",
        studentName: contact.student_name ?? "Öğrenci",
        grade: [contact.student_grade, contact.exam_type].filter(Boolean).join(" · "),
        examLine,
        attendanceLine,
        homeworkLine: odevPerformansSatiri(odevHaritasi.get(contact.id) ?? null),
        eventLine,
        topSkill,
        weakSkill,
      };
    });

  return { students, dershaneName };
}

/** Bülten metnini üretir (veli mesajı olarak gönderilecek hâl). */
export function renderBulletin(
  student: StudentBulletin,
  customNote: string,
  dershaneName: string
): string {
  const lines: string[] = [`Sayın ${student.parentName},`, ""];
  lines.push(`${student.studentName} için gelişim özeti:`);
  lines.push("");
  if (student.examLine) lines.push(`📚 Son deneme: ${student.examLine}`);
  if (student.attendanceLine) lines.push(`📅 Devam durumu: ${student.attendanceLine}`);
  if (student.homeworkLine) lines.push(`📝 Ödev durumu: ${student.homeworkLine}`);
  if (student.eventLine) lines.push(`🎯 Katılım: ${student.eventLine}`);
  if (student.topSkill) lines.push(`🌟 Öne çıkan beceri: ${student.topSkill}`);
  if (student.weakSkill) lines.push(`📌 Gelişim alanı: ${student.weakSkill}`);
  if (!student.examLine && !student.attendanceLine && !student.topSkill) {
    lines.push("Bu hafta kayda değer bir gelişim verisi bulunmuyor.");
  }
  lines.push("");
  if (customNote.trim()) {
    lines.push(customNote.trim());
    lines.push("");
  }
  lines.push("İyi çalışmalar,");
  lines.push(dershaneName);
  return lines.join("\n");
}
