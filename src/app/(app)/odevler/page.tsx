import {
  OdevlerView,
  type HomeworkAssignmentVM,
  type HomeworkStudent,
  type HomeworkSubmissionVM,
} from "@/components/pages/odevler/odevler-view";
import { getLiveHomeworkData } from "@/lib/server/queries";
import { buildDemoHomework, demoHomeworkStudents } from "@/lib/mock/homework";
import type { HomeworkStatus } from "@/lib/types/db";

export const metadata = { title: "Ödev Takibi" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const live = await getLiveHomeworkData();

  // Öğrenci listesi: canlıda Supabase contacts, demo modda mock roster
  const students: HomeworkStudent[] = (live?.contacts ?? [])
    .filter((c) => !c.do_not_call)
    .map((c) => ({
      id: c.id,
      studentName: c.student_name ?? "Öğrenci",
      parentName: c.parent_name ?? "Veli",
      grade: [c.student_grade, c.exam_type].filter(Boolean).join(" · "),
      phone: c.phone ?? "",
    }));

  // Canlı veri yoksa demo ödevleri kullan
  const demoAssignments = live ? [] : buildDemoHomework();
  const demoStudentList = live ? [] : demoHomeworkStudents;

  // assignment_id → contact_id → status + teslim bilgileri
  const marksByAssignment: Record<string, Record<string, HomeworkStatus>> = {};
  for (const row of live?.submissions ?? []) {
    (marksByAssignment[row.assignment_id] ??= {})[row.contact_id] = row.status;
  }

  const assignments: HomeworkAssignmentVM[] = live
    ? (live.assignments ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        classLevel: a.class_level,
        dueDate: a.due_date,
        description: a.description,
        createdBy: a.created_by,
        marks: marksByAssignment[a.id] ?? {},
      }))
    : demoAssignments;

  // Fotoğraf/teslim bilgileri (yalnız canlıda dolu gelir)
  const submissions: HomeworkSubmissionVM[] = (live?.submissions ?? []).map((s) => ({
    assignmentId: s.assignment_id,
    contactId: s.contact_id,
    photoPath: s.photo_path,
    studentNote: s.student_note,
    submittedAt: s.submitted_at,
    checkedAt: s.checked_at,
  }));

  return (
    <OdevlerView
      assignments={assignments}
      students={live ? students : demoStudentList}
      submissions={submissions}
      live={Boolean(live)}
      sourceLabel={
        live
          ? `Supabase canlı veri (${assignments.length} ödev, ${students.length} öğrenci)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
    />
  );
}
