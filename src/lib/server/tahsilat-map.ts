/**
 * Supabase installment_tracker + contacts → Tahsilat ekranı görüntü modeli.
 * Mock tipleri (src/lib/mock/installments.ts) birebir üretilir; tüm sayı ve
 * etiketler canlı satırlardan türetilir (sabit metin yalnız şablonlar).
 */

import type {
  InstallmentStat,
  InstallmentRecord,
  PipelineStage,
  DebtorRow,
} from "@/lib/mock/installments";
import type { Contact, InstallmentTracker, InstallmentState } from "@/lib/types/db";

const TL = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const SHORT_DATE = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
});

export function tl(amount: string | number): string {
  return TL.format(Number(amount ?? 0));
}

function daysLate(state: InstallmentState): number {
  switch (state) {
    case "OVERDUE_3D": return 3;
    case "OVERDUE_7D": return 7;
    case "OVERDUE_14D": return 14;
    case "OVERDUE_21D": return 21;
    case "OVERDUE_30D": return 30;
    default: return 0;
  }
}

/** Tahsilat eskalasyon aşaması (1-5) — agent/agent/collections.py ile aynı mantık. */
export function stageOf(row: InstallmentTracker): number {
  switch (row.state) {
    case "DUE_TODAY": return 2;
    case "OVERDUE_3D":
    case "OVERDUE_7D": return 3;
    case "OVERDUE_14D": return 4;
    case "OVERDUE_21D":
    case "OVERDUE_30D":
    case "ESCALATED": return 5;
    default: return 1; // UPCOMING ve PAID → 1
  }
}

function reminderPill(row: InstallmentTracker): string {
  const wa = row.whatsapp_sent_count ?? 0;
  const sms = row.sms_sent_count ?? 0;
  const ai = row.ai_call_count ?? 0;
  const total = wa + sms + ai;
  if (total === 0) return "Hatırlatma yok";
  const parts: string[] = [];
  if (wa) parts.push(`${wa} WA`);
  if (sms) parts.push(`${sms} SMS`);
  if (ai) parts.push(`${ai} Ses`);
  return `${total} Hatırlatma (${parts.join(", ")})`;
}

function statusPill(row: InstallmentTracker): InstallmentRecord["statusPill"] {
  const late = daysLate(row.state);
  if (row.state === "PAID") {
    return { icon: "check_circle", text: "Ödendi", tone: "pre" };
  }
  if (row.state === "DUE_TODAY") {
    return { dot: true, text: "Vade Günü (Bugün Son Gün)", tone: "due" };
  }
  if (late > 0) {
    if (row.state === "OVERDUE_14D") {
      return { icon: "support_agent", text: "+14 Gün · AI Ses Araması", tone: "ai" };
    }
    if (row.state === "OVERDUE_21D" || row.state === "OVERDUE_30D" || row.state === "ESCALATED") {
      return { icon: "gavel", text: `${late}+ Gün · İdari Devir`, tone: "critical" };
    }
    return { dot: true, text: `${late} Gün Gecikti · Nazik Uyarı`, tone: "warn" };
  }
  return { dot: true, text: `Vade: ${SHORT_DATE.format(new Date(row.due_date))}`, tone: "pre" };
}

function contextBlock(row: InstallmentTracker): InstallmentRecord["context"] {
  const total = (row.whatsapp_sent_count ?? 0) + (row.sms_sent_count ?? 0) + (row.ai_call_count ?? 0);
  const when = row.last_action_at
    ? new Date(row.last_action_at).toLocaleString("tr-TR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  if (total === 0) {
    return {
      icon: "schedule",
      title: "Henüz aksiyon yok",
      meta: SHORT_DATE.format(new Date(row.due_date)),
      body: "Vade yaklaşınca otomatik WhatsApp/SMS bildirim akışı başlar.",
      tone: "primary",
    };
  }
  if ((row.ai_call_count ?? 0) > 0) {
    return {
      icon: "mic",
      title: "AI Sesli Arama Yapıldı",
      meta: when,
      body: `Toplam ${total} dokunuş: ${row.ai_call_count} sesli arama, ${row.whatsapp_sent_count ?? 0} WhatsApp, ${row.sms_sent_count ?? 0} SMS.`,
      clamp2: true,
      tone: "secondary",
    };
  }
  return {
    icon: "send",
    title: "Otomatik Bildirim Gönderildi",
    meta: when,
    body: `${row.whatsapp_sent_count ?? 0} WhatsApp ve ${row.sms_sent_count ?? 0} SMS hatırlatması iletildi.`,
    tone: "primary",
  };
}

function filtersOf(row: InstallmentTracker): InstallmentRecord["filters"] {
  const filters: InstallmentRecord["filters"] = [];
  const late = daysLate(row.state);
  if (late > 0 || row.state === "ESCALATED") filters.push("overdue");
  if (row.state === "DUE_TODAY") filters.push("due-today");
  if ((row.ai_call_count ?? 0) > 0) filters.push("ai-call");
  return filters;
}

export interface TahsilatView {
  stats: InstallmentStat[];
  stages: PipelineStage[];
  records: InstallmentRecord[];
  /** Öğrenci/veli bazlı toplam borç özeti — kalanı olanlar, gecikenler önce. */
  debtors: DebtorRow[];
  /** M7: vade bazlı nakit akışı (önümüzdeki 4 ay) + gecikme yaşlandırması */
  projection: {
    months: Array<{ label: string; amount: string; count: number; width: number }>;
    aging: Array<{ label: string; amount: string; count: number; tone: "tertiary" | "error" | "critical" }>;
    totalPending: string;
  };
}

const MONTH_LABEL = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });

/** Canlı taksit satırlarını ekran modeline çevirir. */
export function buildTahsilatView(
  rows: InstallmentTracker[],
  contacts: Contact[],
): TahsilatView {
  const byContact = new Map(contacts.map((c) => [c.id, c]));

  let pendingAmount = 0;
  let pendingCount = 0;
  let overdueAmount = 0;
  const overdueContacts = new Set<string>();
  let paidAmount = 0;
  let paidCount = 0;

  const bucket = () => ({ count: 0, amount: 0 });

  const stageBuckets: Record<number, { count: number; amount: number }> = {
    1: bucket(), 2: bucket(), 3: bucket(), 4: bucket(), 5: bucket(),
  };

  const records: InstallmentRecord[] = rows.map((row) => {
    const contact = byContact.get(row.contact_id);
    const isPaid = row.state === "PAID";
    const late = daysLate(row.state) > 0 || row.state === "ESCALATED";
    const amount = Number(row.installment_amount ?? 0);

    if (!isPaid) {
      pendingAmount += amount;
      pendingCount += 1;
      stageBuckets[stageOf(row)].count += 1;
      stageBuckets[stageOf(row)].amount += amount;
    } else {
      paidAmount += amount;
      paidCount += 1;
    }
    if (late) {
      overdueAmount += amount;
      overdueContacts.add(row.contact_id);
    }

    return {
      id: row.id,
      studentName: contact?.student_name ?? row.student_name ?? "Öğrenci",
      gradeTag: contact?.student_grade ?? "—",
      parentName: contact?.parent_name ?? "Veli",
      amount: tl(amount),
      amountTone: late ? "error" : row.state === "DUE_TODAY" ? "tertiary" : "neutral",
      installmentInfo: `Taksit ${row.installment_number}/${row.installment_count}`,
      infoTone: "neutral",
      statusPill: statusPill(row),
      reminderPill: reminderPill(row),
      context: contextBlock(row),
      action: { icon: "graphic_eq", label: "Hatırlat (AI Ses / WA)" },
      filters: filtersOf(row),
      phone: contact?.phone ?? undefined,
      amountValue: amount,
      dueDate: row.due_date,
      contactId: row.contact_id,
      installmentNumber: row.installment_number,
      installmentCount: row.installment_count,
      paidAt: row.paid_at ?? undefined,
    } satisfies InstallmentRecord;
  });

  const totalAll = pendingAmount + paidAmount;
  const rate = totalAll > 0 ? Math.round((paidAmount / totalAll) * 1000) / 10 : 0;

  const stats: InstallmentStat[] = [
    {
      id: "pending",
      label: "Toplam Bekleyen",
      value: tl(pendingAmount),
      icon: "schedule",
      tone: "neutral",
      sub: { kind: "plain", text: `${pendingCount} Taksit · Aktif` },
    },
    {
      id: "overdue",
      label: "Geciken Tutar",
      value: tl(overdueAmount),
      icon: "warning",
      tone: "error",
      sub: { kind: "dot", text: `${overdueContacts.size} Veli Riskte` },
    },
    {
      id: "rate",
      label: "Tahsil Oranı",
      value: `%${rate.toLocaleString("tr-TR")}`,
      icon: "auto_awesome",
      tone: "secondary",
      sub: { kind: "trend", text: `${paidCount} taksit kapandı` },
    },
    {
      id: "collected",
      label: "Tahsil Edilen",
      value: tl(paidAmount),
      icon: "check_circle",
      tone: "primary",
      sub: { kind: "plain", text: `${paidCount} Taksit kapandı` },
    },
  ];

  const stageDefs: Array<Pick<PipelineStage, "id" | "variant" | "badge" | "icon" | "title" | "subtitle">> = [
    { id: 1, variant: "primary", badge: "Aşama 1", icon: "chat", title: "Vade -3 Gün", subtitle: "WhatsApp Bilgilendirme" },
    { id: 2, variant: "secondary", badge: "Aşama 2", icon: "sms", title: "Vade Günü", subtitle: "SMS + WA Ödeme Linki" },
    { id: 3, variant: "tertiary", badge: "+3 / +7 Gün", icon: "notifications_active", title: "Nazik Uyarı", subtitle: "Gecikme Hatırlatması" },
    { id: 4, variant: "ai", badge: "+14 Gün", icon: "support_agent", title: "AI Sesli Arama", subtitle: "Ödeme Sözü / Taahhüt" },
    { id: 5, variant: "error", badge: "+30 Gün", icon: "gavel", title: "İdari Devir", subtitle: "Yönetici & Hukuk Öncesi" },
  ];

  const stages: PipelineStage[] = stageDefs.map((def) => ({
    ...def,
    count: `${stageBuckets[def.id].count} Veli`,
    amount: tl(stageBuckets[def.id].amount),
  }));

  /* ── M7: Ödeme projeksiyonu ─────────────────────────────── */
  const now = new Date();
  const monthBuckets = new Map<string, { amount: number; count: number; sort: number }>();
  const aging = { a30: 0, a60: 0, a60p: 0, a30c: 0, a60c: 0, a60pc: 0 };

  for (const row of rows) {
    if (row.state === "PAID") continue;
    const amount = Number(row.installment_amount ?? 0);
    const due = new Date(row.due_date + "T00:00:00");

    // Vade bazlı 4 aylık nakit akışı
    const key = `${due.getFullYear()}-${due.getMonth()}`;
    const bucketEntry = monthBuckets.get(key) ?? {
      amount: 0, count: 0,
      sort: due.getFullYear() * 12 + due.getMonth(),
    };
    bucketEntry.amount += amount;
    bucketEntry.count += 1;
    monthBuckets.set(key, bucketEntry);

    // Gecikme yaşlandırması (yalnız gecikenler)
    const lateDays = Math.floor((startOfDay(now) - startOfDay(due)) / (24 * 60 * 60 * 1000));
    if (lateDays > 60) { aging.a60p += amount; aging.a60pc += 1; }
    else if (lateDays > 30) { aging.a60 += amount; aging.a60c += 1; }
    else if (lateDays > 0) { aging.a30 += amount; aging.a30c += 1; }
  }

  const top4 = [...monthBuckets.values()]
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 4);
  const maxAmount = Math.max(1, ...top4.map((b) => b.amount));
  const months = top4.map((b) => {
    const sample = [...monthBuckets.entries()].find(
      ([, v]) => v.sort === b.sort
    )![0].split("-");
    const label = MONTH_LABEL.format(new Date(Number(sample[0]), Number(sample[1]), 1));
    return { label, amount: tl(b.amount), count: b.count, width: Math.round((b.amount / maxAmount) * 100) };
  });

  const projection = {
    months,
    aging: [
      { label: "1-30 gün", amount: tl(aging.a30), count: aging.a30c, tone: "tertiary" as const },
      { label: "31-60 gün", amount: tl(aging.a60), count: aging.a60c, tone: "error" as const },
      { label: "60+ gün", amount: tl(aging.a60p), count: aging.a60pc, tone: "critical" as const },
    ],
    totalPending: tl(pendingAmount),
  };

  /* ── Öğrenci/veli bazlı borç özeti ("kimin ne kadar borcu var") ── */
  const debtorMap = new Map<string, {
    total: number; paid: number; count: number; paidCount: number;
    overdueAmount: number; overdueCount: number; nextDueDate: string | null;
  }>();
  for (const row of rows) {
    const amount = Number(row.installment_amount ?? 0);
    const entry = debtorMap.get(row.contact_id) ?? {
      total: 0, paid: 0, count: 0, paidCount: 0,
      overdueAmount: 0, overdueCount: 0, nextDueDate: null,
    };
    entry.total += amount;
    entry.count += 1;
    if (row.state === "PAID") {
      entry.paid += amount;
      entry.paidCount += 1;
    } else {
      const isLate = daysLate(row.state) > 0 || row.state === "ESCALATED";
      if (isLate) {
        entry.overdueAmount += amount;
        entry.overdueCount += 1;
      }
      if (entry.nextDueDate === null || row.due_date < entry.nextDueDate) {
        entry.nextDueDate = row.due_date;
      }
    }
    debtorMap.set(row.contact_id, entry);
  }

  const debtors: DebtorRow[] = [...debtorMap.entries()]
    .map(([contactId, agg]) => {
      const contact = byContact.get(contactId);
      return {
        contactId,
        studentName: contact?.student_name ?? "Öğrenci",
        parentName: contact?.parent_name ?? "Veli",
        grade: contact?.student_grade ?? "—",
        total: agg.total,
        paid: agg.paid,
        remaining: agg.total - agg.paid,
        installmentCount: agg.count,
        paidCount: agg.paidCount,
        overdueAmount: agg.overdueAmount,
        overdueCount: agg.overdueCount,
        nextDueDate: agg.nextDueDate,
      } satisfies DebtorRow;
    })
    .filter((d) => d.remaining > 0)
    // Gecikenler önce, sonra kalan borca göre büyükten küçüğe
    .sort((a, b) => {
      if ((a.overdueAmount > 0) !== (b.overdueAmount > 0)) return a.overdueAmount > 0 ? -1 : 1;
      return b.remaining - a.remaining;
    });

  return { stats, stages, records, debtors, projection };
}

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
