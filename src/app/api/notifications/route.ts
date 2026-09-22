import { NextResponse } from "next/server";
import { sbSelect, supabaseLive } from "@/lib/server/supabase";
import type { HandoffLog, InstallmentTracker } from "@/lib/types/db";

export const dynamic = "force-dynamic";

export type NotificationItem = {
  id: string;
  icon: string;
  tone: "primary" | "secondary" | "tertiary" | "error";
  title: string;
  desc: string;
  /** Görsel zaman etiketi ("2 sa önce") */
  when: string;
  href: string;
};

function relative(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffMin < 24 * 60) return `${Math.round(diffMin / 60)} saat önce`;
  return `${Math.round(diffMin / (24 * 60))} gün önce`;
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

const TRIGGER_TR: Record<string, string> = {
  price_request: "fiyat talebi",
  human_request: "danışman talebi",
  complaint: "şikâyet",
  complex_question: "detaylı soru",
  kvkk_request: "KVKK talebi",
};

/**
 * GET /api/notifications — topbar bildirim akışı.
 * Canlı: bekleyen handoff kayıtları + yaklaşan taksit vadeleri.
 * Demo: örnek akış.
 */
export async function GET() {
  if (!supabaseLive) {
    return NextResponse.json({ mode: "demo", items: demoItems() });
  }

  const [handoffs, installments] = await Promise.all([
    sbSelect<HandoffLog>(
      "handoff_logs",
      "select=id,trigger_reason,status,created_at&status=eq.pending&order=created_at.desc&limit=5",
    ),
    sbSelect<InstallmentTracker>(
      "installment_tracker",
      "select=id,student_name,installment_number,installment_amount,due_date,state&state=neq.PAID&order=due_date.asc&limit=50",
    ),
  ]);

  const items: NotificationItem[] = [];

  for (const row of handoffs ?? []) {
    items.push({
      id: `handoff-${row.id}`,
      icon: "support_agent",
      tone: "primary",
      title: "Danışman dönüşü bekleniyor",
      desc: `Handoff: ${TRIGGER_TR[row.trigger_reason ?? ""] ?? row.trigger_reason ?? "genel"} — veliye geri dönüş yapın.`,
      when: relative(row.created_at),
      href: "/veliler",
    });
  }

  for (const row of installments ?? []) {
    const days = daysUntil(row.due_date);
    if (days > 7) continue;
    const overdue = days < 0;
    items.push({
      id: `taksit-${row.id}`,
      icon: overdue ? "warning" : "event",
      tone: overdue ? "error" : "tertiary",
      title: overdue
        ? `Geciken taksit: ${row.student_name ?? "Öğrenci"}`
        : `Yaklaşan taksit: ${row.student_name ?? "Öğrenci"}`,
      desc: `${row.installment_number}. taksit · ${row.installment_amount} TL · ${
        overdue ? `${Math.abs(days)} gün gecikti` : days === 0 ? "bugün vade" : `${days} gün kaldı`
      }`,
      when: new Date(row.due_date).toLocaleDateString("tr-TR"),
      href: "/tahsilat",
    });
    if (items.length >= 8) break;
  }

  return NextResponse.json({ mode: "live", items });
}

function demoItems(): NotificationItem[] {
  const now = Date.now();
  const soon = new Date(now + 2 * 24 * 60 * 60 * 1000);
  const overdue = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const recent = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: "demo-handoff",
      icon: "support_agent",
      tone: "primary",
      title: "Danışman dönüşü bekleniyor",
      desc: "Handoff: fiyat talebi — veliye geri dönüş yapın.",
      when: relative(recent),
      href: "/veliler",
    },
    {
      id: "demo-taksit-1",
      icon: "event",
      tone: "tertiary",
      title: "Yaklaşan taksit: Emre Kaya",
      desc: `2. taksit · 6.500 TL · ${soon.toLocaleDateString("tr-TR")} vade`,
      when: soon.toLocaleDateString("tr-TR"),
      href: "/tahsilat",
    },
    {
      id: "demo-taksit-2",
      icon: "warning",
      tone: "error",
      title: "Geciken taksit: Kerem Yılmaz",
      desc: "1. taksit · 7.250 TL · 3 gün gecikti",
      when: overdue.toLocaleDateString("tr-TR"),
      href: "/tahsilat",
    },
  ];
}
