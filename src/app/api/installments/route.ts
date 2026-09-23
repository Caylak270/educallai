import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ay eklerken ay sonunu taşırır: 31 Ocak + 1 ay → 28/29 Şubat. */
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/**
 * POST /api/installments — yeni borç kaydı (taksit planı) oluştur.
 * Gövde: { contactId, totalAmount, installmentCount, firstDueDate, interval? }
 * Toplam tutar eşit taksitlere bölünür; kuruş farkı son taksite eklenir.
 * Tüm satırlar tek INSERT ile yazıldığı için created_at değerleri aynıdır —
 * "planı sil" bu anahtarla çalışır.
 */
export async function POST(request: Request) {
  let body: {
    contactId?: string;
    totalAmount?: number | string;
    installmentCount?: number | string;
    firstDueDate?: string;
    interval?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const totalAmount = Number(body.totalAmount);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0 || totalAmount > 99_999_999) {
    return NextResponse.json(
      { error: "Toplam tutar 0'dan büyük olmalı" },
      { status: 422 }
    );
  }

  const installmentCount = Math.floor(Number(body.installmentCount));
  if (
    !Number.isFinite(installmentCount) ||
    installmentCount < 1 ||
    installmentCount > 24
  ) {
    return NextResponse.json(
      { error: "Taksit sayısı 1-24 arasında olmalı" },
      { status: 422 }
    );
  }

  const firstDueDate = body.firstDueDate?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDueDate) || Number.isNaN(new Date(firstDueDate + "T00:00:00Z").getTime())) {
    return NextResponse.json(
      { error: "İlk vade tarihi geçerli olmalı" },
      { status: 422 }
    );
  }

  const interval = body.interval === "weekly" ? "weekly" : "monthly";

  const contactId = body.contactId?.trim() ?? "";

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    // Demo modda kontak UUID zorlaması yok — arayüz akışı denenebilir
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  if (!UUID_RE.test(contactId)) {
    return NextResponse.json(
      { error: "Geçerli bir öğrenci/veli seçilmeli" },
      { status: 422 }
    );
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Kontak doğrulama + isim/zincir için okuma
  const { data: contact } = await db
    .from("contacts")
    .select("id,dershane_id,student_name,parent_name")
    .eq("id", contactId)
    .maybeSingle();
  if (!contact) {
    return NextResponse.json(
      { ok: false, error: "Seçilen veli/kontak bulunamadı" },
      { status: 404 }
    );
  }

  // Eşit bölüşüm; kuruş farkı son taksitte (toplam birebir korunur)
  const total = Math.round(totalAmount * 100) / 100;
  const base = Math.floor((total / installmentCount) * 100) / 100;
  const rows = Array.from({ length: installmentCount }, (_, i) => {
    const isLast = i === installmentCount - 1;
    const amount = isLast
      ? Math.round((total - base * (installmentCount - 1)) * 100) / 100
      : base;
    const dueDate =
      interval === "weekly"
        ? addDays(firstDueDate, i * 7)
        : addMonths(firstDueDate, i);
    return {
      contact_id: contact.id,
      dershane_id: contact.dershane_id,
      student_name: contact.student_name,
      total_amount: total,
      installment_count: installmentCount,
      installment_amount: amount,
      installment_number: i + 1,
      due_date: dueDate,
      state: "UPCOMING" as const,
    };
  });

  const { error } = await db.from("installment_tracker").insert(rows);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    persisted: true,
    mode: "live",
    created: rows.length,
    studentName: contact.student_name ?? contact.parent_name ?? "Öğrenci",
  });
}
