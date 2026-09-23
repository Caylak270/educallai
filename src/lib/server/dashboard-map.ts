/**
 * Supabase → Genel Bakış (dashboard) ekran modeli.
 * Mock tipleri (src/lib/mock/kpis.ts) birebir üretilir; tüm sayılar canlı
 * tablolardan (leads, signals, installments, appointments, handoff_logs) gelir.
 */

import type {
  Appointment as AppointmentItem,
  FeedItem,
  FunnelStep,
  HotLead,
  Kpi,
  TahsilatSegment,
} from "@/lib/mock/kpis";
import type {
  Appointment,
  Contact,
  ConversationSignal,
  HandoffLog,
  InstallmentTracker,
  Lead,
} from "@/lib/types/db";

const TL = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

function tl(amount: string | number): string {
  return TL.format(Number(amount ?? 0));
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

function pctStr(v: number): string {
  return `%${v.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

function relative(iso: string | null): string {
  if (!iso) return "—";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffMin < 24 * 60) return `${Math.round(diffMin / 60)} saat önce`;
  return `${Math.round(diffMin / (24 * 60))} gün önce`;
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toLocaleUpperCase("tr") ?? "")
      .join("") || "V"
  );
}

/** Gizlilik: telefon numarasını panelden maskeler (+90 (532) 412 ** **). */
function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = (phone.match(/\d/g) ?? []).join("");
  if (digits.length < 8) return phone;
  return `+90 (${digits.slice(-11, -8)}) ${digits.slice(-8, -5)} ** **`;
}

const SENTIMENT_PILL: Record<string, { text: string; className: string }> = {
  positive: { text: "😊 Memnun", className: "bg-secondary-container text-on-secondary-container" },
  neutral: { text: "🙂 Nötr", className: "bg-surface-container text-on-surface-variant" },
  negative: { text: "🙁 Olumsuz", className: "bg-error-container text-on-error-container" },
};

export interface DashboardView {
  kpis: Kpi[];
  funnel: FunnelStep[];
  tahsilat: TahsilatSegment[];
  hotLeads: HotLead[];
  appointments: AppointmentItem[];
  feed: FeedItem[];
}

export function buildDashboardView(
  leads: Lead[],
  contacts: Contact[],
  signals: ConversationSignal[],
  installments: InstallmentTracker[],
  appointments: Appointment[],
  handoffs: HandoffLog[],
  /** Topbar tarih aralığı (gün) — canlı görüşme akışı bu pencereye göre süzülür. */
  rangeDays = 30
): DashboardView {
  const byContact = new Map(contacts.map((c) => [c.id, c]));
  const signalsByContact = new Map<string, ConversationSignal[]>();
  for (const s of signals) {
    const list = signalsByContact.get(s.contact_id) ?? [];
    list.push(s);
    signalsByContact.set(s.contact_id, list);
  }
  const now = new Date();
  // Topbar tarih aralığı: sinyal ve handoff KPI'ları bu pencereye göre hesaplanır
  const rangeCutoffMs = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
  const inRangeSignals = signals.filter(
    (s) => new Date(s.created_at).getTime() >= rangeCutoffMs
  );
  const inRangeHandoffs = handoffs.filter(
    (h) => new Date(h.created_at).getTime() >= rangeCutoffMs
  );

  /* ── Leads tabanlı hesaplar ─────────────────────────────── */
  const active = leads.filter((l) => l.stage !== "lost");
  const contacted = leads.filter((l) =>
    ["contacted", "interested", "appointment_set", "visited", "enrolled"].includes(l.stage)
  );
  const interested = leads.filter((l) =>
    ["interested", "appointment_set", "visited", "enrolled"].includes(l.stage)
  );
  const withAppointment = leads.filter((l) =>
    ["appointment_set", "visited", "enrolled"].includes(l.stage)
  );
  const visited = leads.filter((l) => ["visited", "enrolled"].includes(l.stage));
  const enrolled = leads.filter((l) => l.stage === "enrolled");
  const delayed = active.filter(
    (l) => l.next_follow_up && new Date(l.next_follow_up) < now
  );
  const hotWarm = leads
    .filter((l) => l.temperature === "hot" || l.temperature === "warm")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  /* ── Sinyal tabanlı hesaplar (seçili tarih aralığı) ─────── */
  const positive = inRangeSignals.filter((s) => s.sentiment === "positive").length;
  const durations = inRangeSignals
    .map((s) => s.duration_seconds ?? 0)
    .filter((d) => d > 0);
  const avgSec = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  /* ── Taksit tabanlı hesaplar ────────────────────────────── */
  let paidAmt = 0;
  let soonAmt = 0;
  let lateAmt = 0;
  for (const row of installments) {
    const amt = Number(row.installment_amount ?? 0);
    if (row.state === "PAID") paidAmt += amt;
    else if (
      row.state === "OVERDUE_3D" || row.state === "OVERDUE_7D" ||
      row.state === "OVERDUE_14D" || row.state === "OVERDUE_21D" ||
      row.state === "OVERDUE_30D" || row.state === "ESCALATED"
    ) lateAmt += amt;
    else soonAmt += amt;
  }
  const totalInst = paidAmt + soonAmt + lateAmt;

  /* ── KPI şeridi ─────────────────────────────────────────── */
  const kpis: Kpi[] = [
    {
      id: "handoff",
      label: "AI Handoff Sayısı",
      badge: `${inRangeHandoffs.length} kayıt · ${rangeDays <= 1 ? "bugün" : `son ${rangeDays} gün`}`,
      badgeTone: "neutral",
      value: String(inRangeHandoffs.length),
      valueClass: "text-on-surface",
      barPct: Math.min(100, inRangeHandoffs.length * 5),
      barTrackClass: "bg-surface-container",
      barFillClass: "bg-primary-container",
      note: "İnsan danışmana yönlendirilen",
    },
    {
      id: "authority-follow",
      label: "Yetkili Takip Oranı",
      badge: `${contacted.length}/${leads.length} veli`,
      badgeTone: "positive",
      value: pctStr(pct(contacted.length, leads.length)),
      valueClass: "text-on-surface",
      barPct: pct(contacted.length, leads.length),
      barTrackClass: "bg-surface-container",
      barFillClass: "bg-secondary",
      note: "İletişime geçilmiş veli",
    },
    {
      id: "unattended",
      label: "Takip Edilmeyen",
      badge: "Acil müdahale",
      badgeTone: "urgent",
      value: String(delayed.length),
      suffix: `(%${pct(delayed.length, active.length).toLocaleString("tr-TR")})`,
      valueClass: "text-on-surface",
      urgent: delayed.length > 0,
      barPct: pct(delayed.length, active.length),
      barTrackClass: "bg-surface-container",
      barFillClass: "bg-error",
      note: "Takip tarihi geçen veli",
    },
    {
      id: "conversion",
      label: "Kayıt Dönüşüm",
      badge: `${enrolled.length} kayıt`,
      badgeTone: "positive",
      value: pctStr(pct(enrolled.length, leads.length)),
      valueClass: "text-on-surface",
      barPct: pct(enrolled.length, leads.length),
      barTrackClass: "bg-surface-container",
      barFillClass: "bg-primary-container",
      note: "AI randevusundan kayıt",
    },
    {
      id: "ai-sentiment",
      label: "AI Memnuniyet",
      badge: `${signals.length} görüşme`,
      badgeTone: "positive",
      value: pctStr(pct(positive, signals.length)),
      valueClass: "text-on-surface",
      barPct: pct(positive, signals.length),
      barTrackClass: "bg-surface-container",
      barFillClass: "bg-secondary",
      note: "Pozitif sonuçlanan görüşme",
    },
    {
      id: "avg-duration",
      label: "Ortalama Süre",
      badge: `${signals.length} görüşme`,
      badgeTone: "neutral",
      value: avgSec > 0 ? (avgSec / 60).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "0",
      suffix: "dk",
      valueClass: "text-on-surface",
      barPct: Math.min(100, Math.round((avgSec / 600) * 100)),
      barTrackClass: "bg-surface-container",
      barFillClass: "bg-primary-container",
      note: "Ortalama görüşme süresi",
    },
  ];

  /* ── Dönüşüm hunisi ────────────────────────────────────── */
  const steps: Array<{ id: string; name: string; n: number }> = [
    { id: "pool", name: "1. Aranan Veli Havuzu", n: leads.length },
    { id: "reached", name: "2. Ulaşılan & Yanıt Veren", n: contacted.length },
    { id: "interested", name: "3. İlgilenen & Bilgi Alan", n: interested.length },
    { id: "appointment", name: "4. Kurum Randevusu Oluşturulan", n: withAppointment.length },
    { id: "visited", name: "5. Kurum Ziyareti Gerçekleşen", n: visited.length },
    { id: "enrolled", name: "6. Kesin Kayıt Tamamlanan", n: enrolled.length },
  ];
  const funnel: FunnelStep[] = steps.map((s) => ({
    id: s.id,
    name: s.name,
    dotClass: "bg-primary-container",
    nameClass: "text-on-surface",
    count: `${s.n} Veli`,
    countClass: "text-on-surface",
    pct: pctStr(pct(s.n, leads.length)),
    pctClass: "text-primary",
    barPct: pct(s.n, leads.length),
    barFillClass: "bg-primary-container",
    barLabel: `${pctStr(pct(s.n, leads.length))} dönüşüm`,
  }));

  /* ── Tahsilat segmentleri ───────────────────────────────── */
  const tahsilat: TahsilatSegment[] = [
    {
      id: "paid",
      label: `Ödenen (%${pct(paidAmt, totalInst).toLocaleString("tr-TR")})`,
      dotClass: "bg-secondary",
      amount: tl(paidAmt),
      amountClass: "text-on-surface",
    },
    {
      id: "due-soon",
      label: `Vadesi Yaklaşan (%${pct(soonAmt, totalInst).toLocaleString("tr-TR")})`,
      dotClass: "bg-tertiary-fixed-dim",
      amount: tl(soonAmt),
      amountClass: "text-tertiary",
    },
    {
      id: "late",
      label: `Gecikmiş (%${pct(lateAmt, totalInst).toLocaleString("tr-TR")})`,
      dotClass: "bg-error",
      amount: tl(lateAmt),
      amountClass: "text-error",
    },
  ];

  /* ── Sıcak leadler ──────────────────────────────────────── */
  const hotLeads: HotLead[] = hotWarm.slice(0, 6).map((lead) => {
    const contact = byContact.get(lead.contact_id);
    const parent = contact?.parent_name ?? "İsimsiz Veli";
    const last = signalsByContact.get(lead.contact_id)?.[0];
    const isHot = lead.temperature === "hot";
    return {
      id: lead.id,
      initials: initialsOf(parent),
      avatarClass: isHot
        ? "bg-primary-container text-on-primary"
        : "bg-surface-container-high text-on-surface-variant",
      parent,
      detail: `Öğr: ${contact?.student_name ?? "—"} • ${maskPhone(contact?.phone)}`,
      classTag: [contact?.exam_type, contact?.student_grade].filter(Boolean).join(" "),
      classTagClass: "bg-surface-container-lowest text-on-surface",
      heat: isHot ? "hot" : "warm",
      summary:
        contact?.contact_summary?.trim() ||
        (last?.transcript
          ? last.transcript.replace(/^(Veli|Asistan):\s*/gm, "").slice(0, 140)
          : "Henüz görüşme kaydı yok."),
      summaryClass: "text-on-surface",
      wait: relative(lead.last_contact_at ?? lead.updated_at),
      waitClass: isHot ? "font-bold text-error" : "text-on-surface-variant",
      urgentRow: isHot && (lead.score ?? 0) >= 80,
      cta: isHot ? "hot" : "warm",
      classFilterKey: contact?.exam_type ?? null,
    } satisfies HotLead;
  });

  /* ── Bugünün randevuları ────────────────────────────────── */
  const todayAppointments: AppointmentItem[] = appointmentsOfToday(
    appointmentsByRow(appointments, byContact)
  );

  /* ── Canlı görüşme akışı ────────────────────────────────── */
  // Seçili tarih aralığı dışındaki görüşmeler akışa düşmez
  const feed: FeedItem[] = inRangeSignals.slice(0, 5).map((s) => {
    const contact = byContact.get(s.contact_id);
    const pill = SENTIMENT_PILL[s.sentiment ?? "neutral"] ?? SENTIMENT_PILL.neutral;
    return {
      id: s.id,
      icon: "phone_in_talk",
      iconWrapClass: "bg-primary-container/10 text-primary-container",
      parent: contact?.parent_name ?? "Bilinmeyen Veli",
      context: `(Öğrenci: ${contact?.student_name ?? "—"})`,
      pill,
      meta: s.duration_seconds
        ? `${Math.floor(s.duration_seconds / 60)}dk ${s.duration_seconds % 60}sn`
        : relative(s.created_at),
      summary: s.transcript
        ? s.transcript.replace(/^(Veli|Asistan):\s*/gm, "").slice(0, 140)
        : "Transkript kaydı yok.",
      links: [
        { icon: "headset_mic", label: "Görüşmeyi Aç" },
        { icon: "phone", label: "Tekrar Ara" },
      ],
      handoff: Boolean(s.recommend_handoff),
    } satisfies FeedItem;
  });

  return { kpis, funnel, tahsilat, hotLeads, appointments: todayAppointments, feed };
}

function appointmentsByRow(
  rows: Appointment[],
  byContact: Map<string, Contact>
): Array<AppointmentItem & { at: Date }> {
  return rows.map((row) => {
    const contact = byContact.get(row.contact_id);
    const at = new Date(row.scheduled_at);
    return {
      id: row.id,
      at,
      time: new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(at),
      duration: `${row.duration_minutes ?? 30} dk`,
      timeClass: "font-bold text-on-surface",
      parent: contact?.parent_name ?? "Veli",
      typeIcon: row.created_by === "manual" ? "person" : "smart_toy",
      typeLabel: row.created_by === "manual" ? "Danışman" : "AI",
      typePillClass:
        row.created_by === "manual"
          ? "bg-surface-container text-on-surface-variant"
          : "bg-primary-fixed text-primary",
      topic: row.notes?.trim() || "Veli görüşmesi",
      meta: [
        { icon: "person", text: contact?.student_name ?? "Öğrenci" },
        { icon: "schedule", text: `${row.duration_minutes ?? 30} dakika` },
      ],
    } satisfies AppointmentItem & { at: Date };
  });
}

function appointmentsOfToday(
  items: Array<AppointmentItem & { at: Date }>
): AppointmentItem[] {
  const now = new Date();
  return items
    .filter((i) => sameDay(i.at, now))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map(({ at: _at, ...rest }) => rest);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
