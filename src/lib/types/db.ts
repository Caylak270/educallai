/**
 * VeliPilot AI (educallai) — Veritabanı satır tipleri
 * Kaynak: supabase/migrations/0001_core.sql (birebir eşleşir)
 *
 * Not: Tüm zaman alanları ISO 8601 string olarak taşınır (Supabase JS uyumu).
 * numeric → string, date → string (YYYY-MM-DD), timestamptz → string.
 */

// ── Enum union'ları ──────────────────────────────────────────

export type DershanePlan = "temel" | "profesyonel" | "kurumsal";
export type StaffRole = "mudur" | "danisman" | "resepsiyon";

export type LeadStage =
  | "new"
  | "contacted"
  | "interested"
  | "appointment_set"
  | "visited"
  | "enrolled"
  | "lost";

export type LeadTemperature = "hot" | "warm" | "cold" | "lost";

export type ContactSource =
  | "outbound_call"
  | "inbound_call"
  | "whatsapp"
  | "instagram"
  | "referral";

export type Channel = "voice" | "whatsapp" | "instagram" | "sms";
export type Direction = "inbound" | "outbound";

export type HandoffStatus = "pending" | "handed_off" | "completed" | "expired";
export type HandoffOutcome =
  | "enrolled"
  | "appointment_set"
  | "declined"
  | "no_answer"
  | "false_positive";

export type InstallmentState =
  | "UPCOMING"
  | "DUE_TODAY"
  | "OVERDUE_3D"
  | "OVERDUE_7D"
  | "OVERDUE_14D"
  | "OVERDUE_21D"
  | "OVERDUE_30D"
  | "ESCALATED"
  | "PAID";

export type ExamCategory =
  | "PLATEAU"
  | "RISING"
  | "DECLINING"
  | "TOP_PERFORMER"
  | "FIRST_TIMER";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "no_show"
  | "cancelled"
  | "rescheduled";

export type CreatedBy = "ai_voice" | "ai_whatsapp" | "manual";

export type CampaignChannel = "voice" | "whatsapp" | "sms";
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed";

export type CampaignTargetStatus =
  | "queued"
  | "calling"
  | "answered"
  | "no_answer"
  | "busy"
  | "done"
  | "failed";

// ── Satır tipleri ────────────────────────────────────────────

export interface Dershane {
  id: string;
  name: string;
  branch_name: string | null;
  city: string | null;
  district: string | null;
  plan: DershanePlan;
  phone: string | null;
  /** Pattern 2 Capability Matrix (bkz. agent/agent/capabilities.py) */
  capabilities: Record<string, unknown>;
  /** Working Hours Guard (bkz. agent/agent/working_hours.py) */
  working_hours: Record<string, unknown>;
  /** Cartesia ses kimliği, hız, gecikme tercihleri */
  voice_config: Record<string, unknown>;
  iys_registered: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  dershane_id: string;
  full_name: string;
  role: StaffRole;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  dershane_id: string;
  phone: string | null;
  whatsapp_id: string | null;
  instagram_id: string | null;
  parent_name: string | null;
  parent_gender: string | null;
  student_name: string | null;
  student_grade: string | null;
  exam_type: string | null;
  /** AI güncellemeli özet — Pattern 4 İç Sezgi'nin kaynağı */
  contact_summary: string | null;
  source: ContactSource | null;
  iys_sms_consent: boolean;
  iys_call_consent: boolean;
  kvkk_consent_at: string | null;
  open_consent_source: string | null;
  /** "Bir daha aramayın" kalıcı bayrağı — 0002 migration ile korunur */
  do_not_call: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  contact_id: string;
  dershane_id: string;
  score: number;
  temperature: LeadTemperature | null;
  enrollment_readiness: string | null;
  stage: LeadStage;
  missing_must_fields: string[] | null;
  next_follow_up: string | null;
  follow_up_reason: string | null;
  total_calls: number;
  total_messages: number;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Pattern 1 record_signals çıktısının kalıcı hâli */
export interface ConversationSignal {
  id: string;
  contact_id: string;
  lead_id: string | null;
  dershane_id: string;
  channel: Channel | null;
  direction: Direction | null;
  sentiment: string | null;
  intent: string | null;
  lead_temperature: LeadTemperature | null;
  enrollment_readiness: string | null;
  price_sensitivity: string | null;
  student_grade: string | null;
  exam_type: string | null;
  sibling_mentioned: boolean | null;
  competitor_mentioned: string | null;
  capability_limit_reached: boolean | null;
  recommend_handoff: boolean | null;
  handoff_reason: string | null;
  payment_objection: string | null;
  payment_promise: string | null;
  risk_signal: string | null;
  do_not_call: boolean;
  transcript: string | null;
  /** KVKK: azami 6 ay saklanır */
  audio_url: string | null;
  duration_seconds: number | null;
  /** pgvector: 1536 boyut (text-embedding-3-small) */
  embedding?: unknown;
  created_at: string;
}

export interface HandoffLog {
  id: string;
  lead_id: string;
  dershane_id: string;
  trigger_reason: string | null;
  assigned_to: string | null;
  status: HandoffStatus;
  staff_action_taken: boolean | null;
  outcome: HandoffOutcome | null;
  /** Outcome Telemetry: handoff +24s doğrulama zamanı */
  outcome_checked_at: string | null;
  sla_4h_notified: boolean;
  sla_24h_notified: boolean;
  created_at: string;
}

export interface InstallmentTracker {
  id: string;
  contact_id: string;
  dershane_id: string;
  student_name: string | null;
  total_amount: string;
  installment_count: number;
  installment_amount: string;
  installment_number: number;
  due_date: string;
  state: InstallmentState;
  paid_at: string | null;
  paid_amount: string | null;
  whatsapp_sent_count: number;
  sms_sent_count: number;
  ai_call_count: number;
  last_action_at: string | null;
  created_at: string;
}

export interface ExamResult {
  id: string;
  contact_id: string;
  dershane_id: string;
  student_name: string | null;
  exam_date: string | null;
  exam_name: string | null;
  total_net: string | null;
  math_net: string | null;
  science_net: string | null;
  turkish_net: string | null;
  social_net: string | null;
  percentile: string | null;
  ranking: number | null;
  category: ExamCategory | null;
  trend: string | null;
  ai_analysis_summary: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  contact_id: string;
  lead_id: string | null;
  dershane_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  created_by: CreatedBy | null;
  /** Pattern 3 Silent Lag Recovery: confirmed_by_ai && !calendar_synced kontrolü */
  calendar_synced: boolean;
  staff_notified: boolean;
  parent_reminder_sent: boolean;
  notes: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  dershane_id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  total_targets: number;
  contacted: number;
  answered: number;
  appointments: number;
  /** Cartesia klonlanmış ses kimliği */
  voice_id: string | null;
  script: string | null;
  working_hours_snapshot: Record<string, unknown> | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CampaignTarget {
  id: string;
  campaign_id: string;
  contact_id: string;
  dershane_id: string;
  /** Dialer öncelik skoru (0-100, bkz. agent/agent/dialer.py) */
  priority_score: string | null;
  status: CampaignTargetStatus;
  /** max 3 deneme; cevapsız → 3 saat, meşgul → 30 dk retry */
  attempts: number;
  next_retry_at: string | null;
  last_outcome: string | null;
  created_at: string;
}

export interface CollectionAction {
  id: string;
  installment_id: string;
  dershane_id: string;
  /** Tahsilat eskalasyon aşaması 1-5 (bkz. agent/agent/collections.py) */
  stage: number;
  channel: Extract<Channel, "whatsapp" | "sms" | "voice">;
  tone: string | null;
  result: string | null;
  occurred_at: string;
}

// ── 0003_product_modules.sql ─────────────────────────────────

/** M1: Rehberlik görüşme notu */
export interface CounselorNote {
  id: string;
  contact_id: string;
  dershane_id: string;
  author: string | null;
  note: string;
  follow_up_at: string | null;
  outcome: string | null;
  created_at: string;
}

/** M4: Sınav takvimi — dershane_id NULL → merkezî sınav */
export interface ExamScheduleRow {
  id: string;
  dershane_id: string | null;
  name: string;
  exam_type: "TYT" | "AYT" | "LGS" | "OKUL" | "DENEME";
  exam_date: string;
  is_estimated: boolean;
  notes: string | null;
  created_at: string;
}

// ── 0004_attendance.sql ──────────────────────────────────────

export interface Lesson {
  id: string;
  dershane_id: string;
  name: string;
  subject: string | null;
  class_level: string | null;
  scheduled_at: string;
  duration_minutes: number;
  /** M10 Ders Programı: ders öğretmeni (serbest metin; devirde staff'a bağlanır) */
  teacher: string | null;
  /** M10 Ders Programı: derslik */
  room: string | null;
  created_at: string;
}

// ── 0010_schedule_slots.sql ──────────────────────────────────

/** M10.1: Sabit haftalık program şablonu — her hafta tekrarlanan ders slotu. */
export interface ScheduleSlot {
  id: string;
  dershane_id: string;
  name: string;
  subject: string | null;
  class_level: string | null;
  teacher: string | null;
  room: string | null;
  /** 1=Pazartesi … 7=Pazar */
  day_of_week: number;
  /** "HH:MM" yerel saat */
  start_time: string;
  duration_minutes: number;
  created_at: string;
}

/** M11: Öğretmen saat ücreti — schedule_slots.teacher ile eşleşir. */
export interface TeacherRate {
  id: string;
  dershane_id: string;
  teacher: string;
  /** numeric → string olarak taşınır */
  hourly_rate: string;
  updated_at: string;
}

export type AttendanceStatus = "present" | "late" | "absent";

export interface AttendanceRow {
  id: string;
  lesson_id: string;
  contact_id: string;
  dershane_id: string;
  status: AttendanceStatus;
  marked_by: string | null;
  created_at: string;
}

// ── 0005_skill_observations.sql ──────────────────────────────

export type SkillId =
  | "critical_thinking"
  | "communication"
  | "collaboration"
  | "self_management"
  | "digital_literacy";

export interface SkillObservation {
  id: string;
  contact_id: string;
  dershane_id: string;
  skill: SkillId;
  score: number;
  note: string | null;
  period: string | null;
  observed_by: string | null;
  created_at: string;
}

// ── 0006_events_referrals.sql ────────────────────────────────

export type EventType = "seminer" | "deneme_gunu" | "workshop" | "diger";

export interface EventRow {
  id: string;
  dershane_id: string;
  name: string;
  event_type: EventType;
  event_date: string;
  capacity: number | null;
  notes: string | null;
  created_at: string;
}

export type InviteStatus = "davetli" | "katildi" | "iptal";

export interface EventInvite {
  id: string;
  event_id: string;
  contact_id: string;
  dershane_id: string;
  status: InviteStatus;
  created_at: string;
}

export type ReferralStatus = "yeni" | "iletisim" | "kayit" | "iptal";

export interface Referral {
  id: string;
  dershane_id: string;
  referrer_contact_id: string;
  new_lead_name: string;
  new_lead_phone: string | null;
  status: ReferralStatus;
  reward_note: string | null;
  created_at: string;
}

// ── 0007_homework.sql ────────────────────────────────────────

/** M9: Ödev — teslim tarihi timestamptz (ISO string). */
export interface AssignmentRow {
  id: string;
  dershane_id: string;
  title: string;
  subject: string | null;
  class_level: string | null;
  due_date: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export type HomeworkStatus = "done" | "partial" | "missing";

export interface HomeworkSubmission {
  id: string;
  assignment_id: string;
  contact_id: string;
  dershane_id: string;
  status: HomeworkStatus;
  marked_by: string | null;
  /** Storage 'odev-fotograflari' bucket yolu — öğrenci teslim fotoğrafı */
  photo_path: string | null;
  student_note: string | null;
  /** Öğrencinin fotoğrafı yüklediği an */
  submitted_at: string | null;
  /** Öğretmenin son işaretleme (kontrol) anı */
  checked_at: string | null;
  created_at: string;
}
