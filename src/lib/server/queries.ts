/**
 * Supabase → Dashboard veri eşlemeleri (sunucu tarafı).
 * Canlı veri yoksa (anahtar yok / tablo boş / hata) null döner; sayfalar
 * mock veriye düşer. Şekiller mock tipleriyle birebir uyumludur.
 */

import { sbSelect, supabaseLive } from "./supabase";
import { odevPerformansHaritasi } from "./odev-performans";
import type { OdevPerformans } from "./odev-performans";
import type { CallListItem, CallSentiment } from "@/lib/mock/call-list";
import type {
  AiSignals,
  AudioPlayerData,
  AutomationItem,
  AutomationPanel,
  NoteBox,
  TranscriptSegment,
} from "@/lib/mock/calls";
import type {
  Appointment,
  Contact,
  ConversationSignal,
  AttendanceRow,
  CounselorNote,
  EventInvite,
  EventRow,
  ExamScheduleRow,
  Referral,
  Lesson,
  Campaign,
  ExamResult,
  HandoffLog,
  InstallmentTracker,
  SkillObservation,
  Lead,
  AssignmentRow,
  HomeworkSubmission,
  ScheduleSlot,
  TeacherRate,
} from "@/lib/types/db";

/* ── Yardımcılar ─────────────────────────────────────────────── */

function whenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay(d, now)) return `Bugün ${time}`;
  if (sameDay(d, yesterday)) return `Dün ${time}`;
  return `${d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ${time}`;
}

const SENTIMENT_TR: Record<string, string> = {
  positive: "Pozitif",
  neutral: "Nötr",
  negative: "Olumsuz",
};

const INTENT_TR: Record<string, string> = {
  kayit_talebi: "Kayıt Talebi",
  fiyat_sorusu: "Fiyat Sorusu",
  deneme_istegi: "Deneme Sınavı İsteği",
  randevu_talebi: "Randevu Talebi",
  test_gorusmesi: "Test Görüşmesi",
  diger: "Diğer",
};

function toCallSentiment(
  sentiment: string | null,
  recommendHandoff: boolean | null,
): CallSentiment {
  if (recommendHandoff) return "handoff";
  if (sentiment === "positive" || sentiment === "negative") return sentiment;
  return "neutral";
}

/** "Veli: …\nAsistan: …" transkriptini segmentlere böler (zaman oransal). */
function parseTranscript(
  transcript: string | null,
  totalSeconds: number | null,
): TranscriptSegment[] {
  if (!transcript) return [];
  const lines = transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const segments = lines.map((line) => {
    const speaker = line.startsWith("Asistan:")
      ? ("ai" as const)
      : ("parent" as const);
    const text = line.replace(/^(Veli|Asistan):\s*/, "");
    return { speaker, text };
  });
  const total = Math.max(totalSeconds ?? segments.length * 12, segments.length * 4);
  return segments.map((s, i) => {
    const sec = Math.round((total / segments.length) * i);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return { id: i + 1, speaker: s.speaker, time: `${mm}:${ss}`, text: s.text };
  });
}

function contactKey(contactId: string): string {
  return contactId;
}

/* ── Görüşmeler listesi ─────────────────────────────────────── */

export async function getLiveCalls(): Promise<CallListItem[] | null> {
  if (!supabaseLive) return null;
  const [signals, contacts] = await Promise.all([
    sbSelect<ConversationSignal>(
      "conversation_signals",
      "select=id,contact_id,channel,direction,sentiment,intent,lead_temperature,recommend_handoff,transcript,duration_seconds,created_at&order=created_at.desc&limit=50",
    ),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone&limit=200",
    ),
  ]);
  if (!signals) return null;
  if (signals.length === 0) return [];

  const byContact = new Map(contacts?.map((c) => [c.id, c]) ?? []);
  return signals.map((s) => {
    const c = byContact.get(contactKey(s.contact_id));
    const firstLines = (s.transcript ?? "")
      .split("\n")
      .slice(0, 2)
      .join(" — ")
      .replace(/^(Veli|Asistan):\s*/gm, "");
    return {
      id: s.id,
      parentName: c?.parent_name ?? "Bilinmeyen Veli",
      studentName: c?.student_name ?? "—",
      grade: [c?.student_grade, c?.exam_type].filter(Boolean).join(" · ") || "—",
      channel: (s.channel ?? "voice") as CallListItem["channel"],
      direction: s.direction ?? ("inbound" as const),
      sentiment: toCallSentiment(s.sentiment, s.recommend_handoff),
      durationSeconds: s.duration_seconds ?? null,
      summary: firstLines.slice(0, 140) || "Transkript kaydı yok.",
      when: whenLabel(s.created_at),
      sortKey: Math.floor((Date.now() - new Date(s.created_at).getTime()) / 60000),
    };
  });
}

/* ── Görüşme detayı ─────────────────────────────────────────── */

export interface LiveCallDetail {
  id: string;
  /** Görüşmenin bağlı olduğu kontak (not/devir API'leri için) */
  contactId: string | null;
  summary: {
    directionPill: string;
    outcomePill: string;
    initials: string;
    parentName: string;
    callTime: string;
    studentLabel: string;
    studentName: string;
    classTag: string;
    programTag: string;
    phoneLabel: string;
    phone: string;
    durationLabel: string;
    duration: string;
  };
  audio: AudioPlayerData;
  transcriptMeta: {
    syncLabel: string;
    copyLabel: string;
    copiedLabel: string;
    aiSpeaker: string;
    parentSpeaker: string;
  };
  transcript: TranscriptSegment[];
  signals: AiSignals;
  automation: AutomationPanel;
  noteBox: NoteBox;
}

function durationLabel(sec: number | null): string {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)} dk ${sec % 60} sn`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase("tr") ?? "")
    .join("");
}

export async function getLiveCallDetail(
  id: string,
): Promise<LiveCallDetail | null> {
  if (!supabaseLive || !id) return null;
  // conversation_signals.id uuid olduğu için uuid olmayan id'ler (demo mock
  // id'leri) sorgulanmaz — PostgREST 400 yerine doğrudan mock'a düşülür.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) return null;
  const [signals, contacts] = await Promise.all([
    sbSelect<ConversationSignal>(
      "conversation_signals",
      `select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    ),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone&limit=200",
    ),
  ]);
  const signal = signals?.[0];
  if (!signal) return null;
  const contact = contacts?.find((c) => c.id === signal.contact_id);

  const parentName = contact?.parent_name ?? "Bilinmeyen Veli";
  const readiness = Math.round(
    parseFloat(signal.enrollment_readiness ?? "0.5") * 100,
  );
  const readinessBadge =
    readiness >= 70 ? "Yüksek Potansiyel" : readiness >= 40 ? "Orta Potansiyel" : "Düşük Potansiyel";
  const sentimentTr = SENTIMENT_TR[signal.sentiment ?? "neutral"] ?? "Nötr";
  const transcript = parseTranscript(signal.transcript, signal.duration_seconds);

  const automationItems: AutomationItem[] = [
    {
      id: 1,
      title: "Görüşme kaydı Supabase'e yazıldı",
      time: whenLabel(signal.created_at),
      desc: [
        { text: "Transkript, duygu ve niyet sinyalleri " },
        { text: "conversation_signals", strong: true },
        { text: " tablosuna kaydedildi." },
      ],
      footer: { variant: "success", icon: "check_circle", text: "Tamamlandı" },
    },
    ...(signal.recommend_handoff
      ? ([
          {
            id: 2,
            title: "Danışmana aktarım önerildi",
            time: whenLabel(signal.created_at),
            desc: [
              { text: "AI görüşmenin insana aktarımını önerdi (" },
              { text: signal.handoff_reason ?? "yetki sınırı", strong: true },
              { text: ")." },
            ],
            footer: { variant: "chip", icon: "pending", text: "Beklemede" },
          },
        ] satisfies AutomationItem[])
      : []),
  ];

  return {
    id: signal.id,
    contactId: signal.contact_id ?? null,
    summary: {
      directionPill:
        (signal.direction ?? "inbound") === "inbound"
          ? "Gelen Çağrı (Inbound)"
          : "Giden Çağrı (Outbound)",
      outcomePill: sentimentTr === "Olumsuz" ? "İnceleme Gerekli" : "Tamamlandı",
      initials: initialsOf(parentName) || "VP",
      parentName,
      callTime: whenLabel(signal.created_at),
      studentLabel: "Öğrenci:",
      studentName: contact?.student_name ?? "—",
      classTag: contact?.student_grade ?? "—",
      programTag: contact?.exam_type ?? "—",
      phoneLabel: "İletişim Numarası",
      phone: contact?.phone ?? "—",
      durationLabel: "Toplam Süre",
      duration: durationLabel(signal.duration_seconds),
    },
    audio: {
      channelTitle: "Ses Kaydı",
      channelSubtitle: "KVKK: kayıtlar azami 6 ay saklanır",
      playedBars: [],
      markerBar: 0,
      upcomingBars: [],
      elapsed: "00:00",
      total: signal.duration_seconds
        ? `${String(Math.floor(signal.duration_seconds / 60)).padStart(2, "0")}:${String(signal.duration_seconds % 60).padStart(2, "0")}`
        : "00:00",
      speeds: ["1.0x", "1.25x", "1.5x"],
      defaultSpeed: "1.0x",
    },
    transcriptMeta: {
      syncLabel: "Canlı Ses Senkronizasyonu Aktif",
      copyLabel: "Metin Olarak Kopyala",
      copiedLabel: "Kopyalandı",
      aiSpeaker: "VeliPilot (AI)",
      parentSpeaker: `${parentName} (Veli)`,
    },
    transcript,
    signals: {
      score: {
        title: "Kayıt Olma İhtimali Skoru",
        badge: readinessBadge,
        value: `%${readiness}`,
        regionAverage: "Bölge Ortalaması: %64",
        percent: readiness,
        note:
          signal.intent === "fiyat_sorusu"
            ? "Veli fiyata odaklandı; taksit bilgisi ile kayda yönlendirme önerilir."
            : "Sinyaller velinin konuşmasından AI tarafından çıkarılmıştır.",
      },
      sentiment: {
        title: "Duygu & Yaklaşım",
        detail: `${sentimentTr} · Sinyal: ${signal.sentiment ?? "neutral"}`,
        badge: sentimentTr,
      },
      intent: {
        label: "Temel Çağrı Niyeti",
        title: INTENT_TR[signal.intent ?? "diger"] ?? (signal.intent ?? "Diğer"),
        tag: contact?.exam_type ? `${contact.exam_type} Odağı` : "Program Belirsiz",
      },
      priceSensitivity: {
        label: "Fiyat Hassasiyeti",
        value: signal.price_sensitivity ?? "—",
        detail: signal.price_sensitivity
          ? "Görüşmede fiyata ilişkin sinyal tespit edildi."
          : "Bu görüşmede fiyat hassasiyeti sinyali kaydedilmedi.",
      },
      objection: {
        label: "Ödeme İtirazı",
        value: signal.payment_objection ? "Tespit Edildi" : "Tespit Edilmedi",
        detail: signal.payment_objection ?? "Veli ödeme itirazı bildirmedi.",
      },
      targetProgram: {
        label: "Hedef Program",
        value: contact?.exam_type ?? "—",
      },
      handoff: {
        button: signal.recommend_handoff ? "Aktarımı Görüntüle" : "Danışmana Aktar",
        captionPrefix: "Atanan danışman:",
        counselor: "Zeynep (Danışman)",
      },
    },
    automation: {
      title: "Otomasyon Günlüğü",
      subtitle: "Bu görüşmede tetiklenen aksiyonlar",
      badge: `${automationItems.length} Kayıt`,
      items: automationItems,
    },
    noteBox: {
      title: "Danışman Notu",
      hint: "Bu görüşmeye özel not yalnızca ekibiniz tarafından görülür.",
      placeholder: "Not ekleyin…",
      saveLabel: "Kaydet",
      savedLabel: "Kaydedildi",
    },
  };
}

/* ── Veliler (CRM kanban) ───────────────────────────────────── */

export interface LiveLeadRow extends Lead {
  contact: Contact | null;
  /** Contact'ın son görüşme sinyalleri (drawer zaman çizelgesi için). */
  signals: ConversationSignal[];
}

export async function getLiveLeads(): Promise<LiveLeadRow[] | null> {
  if (!supabaseLive) return null;
  const [leads, contacts, signals] = await Promise.all([
    sbSelect<Lead>("leads", "select=*&order=score.desc&limit=200"),
    sbSelect<Contact>(
      "contacts",
      "select=*&do_not_call=eq.false&limit=200",
    ),
    sbSelect<ConversationSignal>(
      "conversation_signals",
      "select=id,contact_id,sentiment,intent,recommend_handoff,transcript,duration_seconds,created_at&order=created_at.desc&limit=300",
    ),
  ]);
  if (!leads) return null;
  if (leads.length === 0) return [];
  const byContact = new Map(contacts?.map((c) => [c.id, c]) ?? []);
  const signalsByContact = new Map<string, ConversationSignal[]>();
  for (const s of signals ?? []) {
    const list = signalsByContact.get(s.contact_id) ?? [];
    list.push(s);
    signalsByContact.set(s.contact_id, list);
  }
  return leads.map((l) => ({
    ...l,
    contact: byContact.get(l.contact_id) ?? null,
    signals: signalsByContact.get(l.contact_id) ?? [],
  }));
}

export interface LiveInstallments {
  installments: InstallmentTracker[];
  contacts: Contact[];
}

/** Tahsilat ekranı: tüm taksitler (vade sırası) + isim/telefon için kontaklar. */
export async function getLiveInstallments(): Promise<LiveInstallments | null> {
  if (!supabaseLive) return null;
  const [installments, contacts] = await Promise.all([
    sbSelect<InstallmentTracker>(
      "installment_tracker",
      "select=*&order=due_date.asc&limit=300",
    ),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone&limit=200",
    ),
  ]);
  if (!installments) return null;
  return { installments, contacts: contacts ?? [] };
}

/** Randevular ekranı: tüm randevular (zaman sırası) + kontak isimleri. */
export async function getLiveAppointments(): Promise<
  { appointments: Appointment[]; contacts: Contact[] } | null
> {
  if (!supabaseLive) return null;
  const [appointments, contacts] = await Promise.all([
    sbSelect<Appointment>(
      "appointments",
      "select=*&order=scheduled_at.asc&limit=300",
    ),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone&limit=200",
    ),
  ]);
  if (!appointments) return null;
  return { appointments, contacts: contacts ?? [] };
}

export interface LiveDashboard {
  leads: Lead[];
  contacts: Contact[];
  signals: ConversationSignal[];
  installments: InstallmentTracker[];
  appointments: Appointment[];
  handoffs: HandoffLog[];
}

/** Genel Bakış: tüm canlı tabloların tek seferde okunması. */
export async function getLiveDashboard(): Promise<LiveDashboard | null> {
  if (!supabaseLive) return null;
  const [leads, contacts, signals, installments, appointments, handoffs] =
    await Promise.all([
      sbSelect<Lead>("leads", "select=*&order=score.desc&limit=200"),
      sbSelect<Contact>("contacts", "select=*&do_not_call=eq.false&limit=200"),
      sbSelect<ConversationSignal>(
        "conversation_signals",
        // embedding (vector 1536) hariç — dashboard için gereken kolonlar
        "select=id,contact_id,sentiment,intent,recommend_handoff,transcript,duration_seconds,created_at&order=created_at.desc&limit=300",
      ),
      sbSelect<InstallmentTracker>(
        "installment_tracker",
        "select=*&order=due_date.asc&limit=300",
      ),
      sbSelect<Appointment>(
        "appointments",
        "select=*&order=scheduled_at.asc&limit=300",
      ),
      sbSelect<HandoffLog>(
        "handoff_logs",
        "select=*&order=created_at.desc&limit=100",
      ),
    ]);
  if (!leads || !signals) return null;
  return {
    leads,
    contacts: contacts ?? [],
    signals,
    installments: installments ?? [],
    appointments: appointments ?? [],
    handoffs: handoffs ?? [],
  };
}

/** Deneme analizi: tüm sınav sonuçları + kontak isimleri. */
export async function getLiveExamResults(): Promise<
  { results: ExamResult[]; contacts: Contact[] } | null
> {
  if (!supabaseLive) return null;
  const [results, contacts] = await Promise.all([
    sbSelect<ExamResult>(
      "exam_results",
      "select=*&order=exam_date.desc&limit=300",
    ),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone&limit=200",
    ),
  ]);
  if (!results) return null;
  return { results, contacts: contacts ?? [] };
}

/** Kampanyalar: tüm kampanya satırları. */
export async function getLiveCampaigns(): Promise<Campaign[] | null> {
  if (!supabaseLive) return null;
  return sbSelect<Campaign>("campaigns", "select=*&order=created_at.desc&limit=50");
}

/** M4: Sınav takvimi — tarih sırasıyla tüm kayıtlar. */
export async function getLiveExamSchedule(): Promise<ExamScheduleRow[] | null> {
  if (!supabaseLive) return null;
  return sbSelect<ExamScheduleRow>(
    "exam_schedule",
    "select=*&order=exam_date.asc&limit=100",
  );
}

export interface RiskStudentRow {
  contact: Contact;
  exams: ExamResult[];
  sentiment: string | null;
  noteCount: number;
  /** Öğrencinin ödev performansı — hiç işaretli ödevi yoksa null */
  homework: OdevPerformans | null;
}

/**
 * M1: Risk Paneli verisi — öğrenci başına sınav geçmişi + son duygu durumu
 * + ödev performansı. Risk skorlaması risk-map.ts'te yapılır.
 */
export async function getLiveRiskStudents(): Promise<RiskStudentRow[] | null> {
  if (!supabaseLive) return null;
  const [results, contacts, signals, notes, homeworkSubmissions] = await Promise.all([
    sbSelect<ExamResult>("exam_results", "select=*&order=exam_date.asc&limit=300"),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone,do_not_call&limit=200",
    ),
    sbSelect<ConversationSignal>(
      "conversation_signals",
      "select=contact_id,sentiment&order=created_at.desc&limit=300",
    ),
    sbSelect<{ contact_id: string }>(
      "counselor_notes",
      "select=contact_id&limit=300",
    ),
    sbSelect<HomeworkSubmission>(
      "homework_submissions",
      "select=contact_id,status&limit=500",
    ),
  ]);
  if (!results || !contacts) return null;
  const signalList = signals ?? [];
  const odevHaritasi = odevPerformansHaritasi(homeworkSubmissions ?? []);

  const byContact = new Map(contacts.map((c) => [c.id, c]));
  const sentimentBy = new Map<string, string>();
  for (const s of signalList) {
    if (!sentimentBy.has(s.contact_id)) sentimentBy.set(s.contact_id, s.sentiment ?? "neutral");
  }
  const noteCount = new Map<string, number>();
  for (const n of notes ?? []) {
    noteCount.set(n.contact_id, (noteCount.get(n.contact_id) ?? 0) + 1);
  }

  const grouped = new Map<string, ExamResult[]>();
  for (const row of results) {
    const arr = grouped.get(row.contact_id) ?? [];
    arr.push(row);
    grouped.set(row.contact_id, arr);
  }

  const rows: RiskStudentRow[] = [];
  for (const [contactId, exams] of grouped) {
    const contact = byContact.get(contactId);
    if (!contact) continue;
    rows.push({
      contact,
      exams: exams.sort(
        (a, b) =>
          new Date(a.exam_date ?? 0).getTime() - new Date(b.exam_date ?? 0).getTime()
      ),
      sentiment: sentimentBy.get(contactId) ?? null,
      noteCount: noteCount.get(contactId) ?? 0,
      homework: odevHaritasi.get(contactId) ?? null,
    });
  }
  return rows;
}

/** M1: Bir öğrencinin rehberlik notları. */
export async function getNotesForContact(
  contactId: string
): Promise<CounselorNote[] | null> {
  if (!supabaseLive) return null;
  return sbSelect<CounselorNote>(
    "counselor_notes",
    `select=*&contact_id=eq.${encodeURIComponent(contactId)}&order=created_at.desc&limit=50`,
  );
}

export interface LiveAttendanceData {
  lessons: Lesson[];
  contacts: Contact[];
  attendance: AttendanceRow[];
}

/** M2: Yoklama — bu haftaki dersler + öğrenciler + mevcut işaretler. */
export async function getLiveAttendanceData(): Promise<LiveAttendanceData | null> {
  if (!supabaseLive) return null;
  const [lessons, contacts, attendance] = await Promise.all([
    sbSelect<Lesson>("lessons", "select=*&order=scheduled_at.asc&limit=100"),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone,do_not_call&limit=200",
    ),
    sbSelect<AttendanceRow>("attendance", "select=*&limit=500"),
  ]);
  if (!lessons) return null;
  // "Bugüne en yakın ders önce" sıralaması (render'da Date.now yasak → burada)
  const now = Date.now();
  const sortedLessons = [...lessons].sort(
    (a, b) =>
      Math.abs(new Date(a.scheduled_at).getTime() - now) -
      Math.abs(new Date(b.scheduled_at).getTime() - now)
  );
  return { lessons: sortedLessons, contacts: contacts ?? [], attendance: attendance ?? [] };
}

export interface LiveSkillData {
  contacts: Contact[];
  observations: SkillObservation[];
}

/** M3: Beceri Karnesi — gözlemler + öğrenciler. */
export async function getLiveSkillObservations(): Promise<LiveSkillData | null> {
  if (!supabaseLive) return null;
  const [contacts, observations] = await Promise.all([
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone,do_not_call&limit=200",
    ),
    sbSelect<SkillObservation>(
      "skill_observations",
      "select=*&order=created_at.desc&limit=500",
    ),
  ]);
  if (!contacts) return null;
  return { contacts, observations: observations ?? [] };
}

export interface LiveEventsData {
  events: EventRow[];
  invites: EventInvite[];
  contacts: Contact[];
}

/** M6: Etkinlikler + davetliler. */
export async function getLiveEvents(): Promise<LiveEventsData | null> {
  if (!supabaseLive) return null;
  const [events, invites, contacts] = await Promise.all([
    sbSelect<EventRow>("events", "select=*&order=event_date.asc&limit=50"),
    sbSelect<EventInvite>("event_invites", "select=*&limit=300"),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone,do_not_call&limit=200",
    ),
  ]);
  if (!events) return null;
  return { events, invites: invites ?? [], contacts: contacts ?? [] };
}

export interface LiveReferralsData {
  referrals: Referral[];
  contacts: Contact[];
}

/** M8: Arkadaşını getir. */
export async function getLiveReferrals(): Promise<LiveReferralsData | null> {
  if (!supabaseLive) return null;
  const [referrals, contacts] = await Promise.all([
    sbSelect<Referral>("referrals", "select=*&order=created_at.desc&limit=100"),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone,do_not_call&limit=200",
    ),
  ]);
  if (!referrals) return null;
  return { referrals, contacts: contacts ?? [] };
}

export interface LiveBulletinData {
  contacts: Contact[];
  exams: ExamResult[];
  attendance: AttendanceRow[];
  skills: SkillObservation[];
}

/** M5: Veli Bülteni — tüm kaynak tablolar tek seferde. */
export async function getLiveBulletinData(): Promise<LiveBulletinData | null> {
  if (!supabaseLive) return null;
  const [contacts, exams, attendance, skills] = await Promise.all([
    sbSelect<Contact>("contacts", "select=*&do_not_call=eq.false&limit=200"),
    sbSelect<ExamResult>("exam_results", "select=*&order=exam_date.desc&limit=300"),
    sbSelect<AttendanceRow>("attendance", "select=*&limit=500"),
    sbSelect<SkillObservation>("skill_observations", "select=*&limit=500"),
  ]);
  if (!contacts) return null;
  return { contacts, exams: exams ?? [], attendance: attendance ?? [], skills: skills ?? [] };
}

export interface LiveHomeworkData {
  assignments: AssignmentRow[];
  contacts: Contact[];
  submissions: HomeworkSubmission[];
}

/** M9: Ödev Takibi — ödevler + öğrenciler + mevcut işaretler. */
export async function getLiveHomeworkData(): Promise<LiveHomeworkData | null> {
  if (!supabaseLive) return null;
  const [assignments, contacts, submissions] = await Promise.all([
    sbSelect<AssignmentRow>("assignments", "select=*&order=due_date.asc&limit=100"),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone,do_not_call&limit=200",
    ),
    sbSelect<HomeworkSubmission>("homework_submissions", "select=*&limit=500"),
  ]);
  if (!assignments) return null;
  // "Bugüne en yakın teslim önce" sıralaması (render'da Date.now yasak → burada)
  const now = Date.now();
  const sorted = [...assignments].sort(
    (a, b) =>
      Math.abs(new Date(a.due_date).getTime() - now) -
      Math.abs(new Date(b.due_date).getTime() - now)
  );
  return { assignments: sorted, contacts: contacts ?? [], submissions: submissions ?? [] };
}

export interface LiveSchedule {
  /** Canlı veri yoksa null (sayfa demo programa düşer) */
  slots: ScheduleSlot[] | null;
}

/** M10.1: Sabit haftalık ders programı şablonu (gün sıralı). */
export async function getLiveScheduleSlots(): Promise<LiveSchedule | null> {
  if (!supabaseLive) return null;
  const slots = await sbSelect<ScheduleSlot>(
    "schedule_slots",
    "select=*&order=day_of_week.asc,start_time.asc&limit=300"
  );
  if (!slots) return null;
  return { slots };
}

/** M11: Öğretmen saat ücretleri. */
export async function getLiveTeacherRates(): Promise<TeacherRate[] | null> {
  if (!supabaseLive) return null;
  return sbSelect<TeacherRate>(
    "teacher_rates",
    "select=*&order=teacher.asc&limit=200"
  );
}
