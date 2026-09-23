"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "@/lib/clsx";
import {
  appointmentStats,
  type AppointmentDay,
  type AppointmentItem,
} from "@/lib/mock/appointments";
import { PageHeader, PageShell, SectionCard, Stat } from "@/components/ui/page-shell";

type Status = AppointmentItem["status"];

/** DB durumundan UI durumuna geçiş (randevular-map eşlemesiyle aynı kural). */
const NEXT_STATUS: Record<"confirmed" | "cancelled", Status> = {
  confirmed: "onayli",
  cancelled: "iptal",
};

function StatusBadge({ status }: { status: Status }) {
  if (status === "onayli") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-secondary-container px-2.5 py-1 font-label-xs text-label-xs font-semibold text-on-secondary-container">
        Onaylandı
      </span>
    );
  }
  if (status === "bekliyor") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-tertiary-fixed px-2.5 py-1 font-label-xs text-label-xs font-semibold text-tertiary-container">
        Veli onayı bekliyor
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs font-semibold text-on-surface-variant">
      İptal edildi
    </span>
  );
}

const CREATED_BY_LABELS = {
  ai_voice: "AI sesli arama ile oluşturuldu",
  ai_whatsapp: "AI WhatsApp ile oluşturuldu",
  manuel: "Danışman tarafından oluşturuldu",
} as const;

function AppointmentRow({ item, live }: { item: AppointmentItem; live: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Durum yerelde tutulur: PATCH başarıdan önce optimistik uygulanır, hatada geri alınır.
  const [status, setStatus] = useState<Status>(item.status);
  const [busy, setBusy] = useState<"confirmed" | "cancelled" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const cancelled = status === "iptal";

  /* Onayla / İptal — PATCH /api/appointments; canlı modda listeyi tazeler. */
  const applyStatus = async (next: "confirmed" | "cancelled") => {
    if (busy) return;
    setBusy(next);
    setMsg(null);
    const previous = status;
    setStatus(NEXT_STATUS[next]); // optimistik
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Durum güncellenemedi");
      }
      if (data.persisted) {
        setMsg({ ok: true, text: next === "confirmed" ? "Randevu onaylandı." : "Randevu iptal edildi." });
        if (live) router.refresh(); // sunucudan taze liste
      } else {
        setMsg({ ok: true, text: "Demo mod — durum kalıcı olarak kaydedilmedi." });
      }
    } catch (err) {
      setStatus(previous); // optimistik değişikliği geri al
      setMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Durum güncellenemedi",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={
        "flex flex-col gap-3 border-b border-outline-variant/40 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center " +
        (cancelled ? "opacity-60" : "")
      }
    >
      <div className="flex w-20 shrink-0 items-center gap-1.5 sm:flex-col sm:items-start sm:gap-0">
        <span className="font-mono-data text-mono-data font-semibold text-on-surface">
          {item.time}
        </span>
        <span className="font-body-sm text-body-sm text-outline">{item.durationMinutes} dk</span>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={
            "font-label-md text-label-md font-semibold text-on-surface " + (cancelled ? "line-through" : "")
          }
        >
          {item.topic}
        </p>
        <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
          {item.parentName} · {item.studentName} ({item.grade})
        </p>
        <p className="mt-1 flex items-center gap-1.5 font-body-sm text-body-sm text-outline">
          <span className="material-symbols-outlined text-[14px]">
            {item.createdBy === "manuel" ? "person" : "smart_toy"}
          </span>
          {CREATED_BY_LABELS[item.createdBy]} · {item.counselor}
        </p>
        {open ? (
          <div className="mt-3 flex flex-col gap-3">
            {item.detail ? (
              <div className="grid grid-cols-1 gap-2 rounded-lg bg-surface-container-low p-3 sm:grid-cols-2">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Durum: <span className="font-semibold text-on-surface">{item.detail.statusTr}</span>
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Telefon: <span className="font-mono-data text-mono-data text-on-surface">{item.detail.phone}</span>
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Takvim:{" "}
                  <span className="font-semibold text-on-surface">
                    {item.detail.calendarSynced ? "Senkronize" : "Senkronize edilmedi"}
                  </span>
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant sm:col-span-2">
                  Not: <span className="text-on-surface">{item.detail.notes || "—"}</span>
                </p>
              </div>
            ) : null}

            {/* Onayla / İptal — PATCH /api/appointments (optimistik + hata geri alması) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={clsx(
                  "flex h-9 items-center gap-1.5 rounded-lg bg-secondary-container px-3 font-label-sm text-label-sm font-semibold text-on-secondary-container transition-colors hover:bg-secondary disabled:opacity-60",
                  status === "onayli" && "opacity-60"
                )}
                disabled={busy !== null || status === "onayli"}
                type="button"
                onClick={() => applyStatus("confirmed")}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {busy === "confirmed" ? "progress_activity" : "check"}
                </span>
                {busy === "confirmed" ? "Onaylanıyor..." : status === "onayli" ? "Onaylandı" : "Onayla"}
              </button>
              <button
                className={clsx(
                  "flex h-9 items-center gap-1.5 rounded-lg bg-error-container px-3 font-label-sm text-label-sm font-semibold text-on-error-container transition-colors hover:bg-error disabled:opacity-60",
                  cancelled && "opacity-60"
                )}
                disabled={busy !== null || cancelled}
                type="button"
                onClick={() => applyStatus("cancelled")}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {busy === "cancelled" ? "progress_activity" : "cancel"}
                </span>
                {busy === "cancelled" ? "İptal ediliyor..." : cancelled ? "İptal Edildi" : "İptal"}
              </button>
              {!live ? (
                <span className="font-label-xs text-label-xs text-outline">
                  Demo mod — Supabase bağlandığında kalıcı olacak.
                </span>
              ) : null}
            </div>

            {msg ? (
              <p
                aria-live="polite"
                className={
                  "font-label-sm text-label-sm font-semibold " +
                  (msg.ok ? "text-secondary" : "text-error")
                }
                role={msg.ok ? "status" : "alert"}
              >
                {msg.text}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={status} />
        <button
          aria-expanded={open}
          className="rounded-lg border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Kapat" : "Detay"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none";

/** Yeni randevu formu — canlı modda kontak listesinden seçim ister. */
function NewAppointmentDialog({
  contacts,
  live,
  onClose,
}: {
  contacts: Array<{ id: string; label: string }>;
  live: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (busy) return;
    setError(null);
    if (!contactId || !date || !time) {
      setError("Veli, tarih ve saat alanları zorunlu.");
      return;
    }
    setBusy(true);
    fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        date,
        time,
        durationMinutes: Number(duration) || 30,
        topic,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.error ?? "Randevu oluşturulamadı");
          setBusy(false);
          return;
        }
        if (data.persisted) {
          router.refresh(); // sunucudan taze liste
        }
        onClose();
      })
      .catch(() => {
        setError("Sunucuya ulaşılamadı");
        setBusy(false);
      });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Yeni Randevu
          </h2>
          <button
            aria-label="Kapat"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface"
            type="button"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Veli</span>
            <select
              className={inputClass}
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
            >
              {contacts.length === 0 ? <option value="">Kayıt yok</option> : null}
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Tarih</span>
              <input
                className={inputClass}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                value={date}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Saat</span>
              <input
                className={inputClass}
                onChange={(e) => setTime(e.target.value)}
                type="time"
                value={time}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Süre</span>
            <select
              className={inputClass}
              onChange={(e) => setDuration(e.target.value)}
              value={duration}
            >
              <option value="15">15 dakika</option>
              <option value="30">30 dakika</option>
              <option value="45">45 dakika</option>
              <option value="60">60 dakika</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Konu</span>
            <input
              className={inputClass}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="örn. Kayıt görüşmesi, deneme sonucu değerlendirme"
              type="text"
              value={topic}
            />
          </label>

          {error ? (
            <p className="font-label-sm text-label-sm font-semibold text-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className={clsx(
              "mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-container font-title-sm text-title-sm font-semibold text-on-primary transition-all hover:bg-primary",
              busy && "opacity-60"
            )}
            disabled={busy}
            type="button"
            onClick={submit}
          >
            <span className={clsx("material-symbols-outlined text-[18px]", busy && "animate-spin")}>
              {busy ? "refresh" : "event_available"}
            </span>
            {busy ? "Oluşturuluyor..." : "Randevuyu Oluştur"}
          </button>
          {!live ? (
            <p className="text-center font-label-xs text-label-xs text-outline">
              Demo mod — Supabase bağlandığında kalıcı olacak.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function RandevularView({
  days,
  stats,
  contacts,
  live,
  sourceLabel,
  autoOpen = false,
}: {
  days: AppointmentDay[];
  stats: { today: string; week: string; pending: string; noShowRate: string };
  contacts: Array<{ id: string; label: string }>;
  live: boolean;
  sourceLabel?: string;
  autoOpen?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(autoOpen);
  const [today, ...rest] = days;
  const s = live ? stats : appointmentStats;

  return (
    <PageShell>
      <PageHeader
        title="Randevular"
        description="AI tarafından oluşturulan ve danışman takvimine düşen tüm veli randevuları."
        actions={
          <button
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]"
            type="button"
            onClick={() => setDialogOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Yeni Randevu</span>
          </button>
        }
      />

      <div className="flex flex-col gap-6">
        {sourceLabel ? (
          <p className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
            {sourceLabel}
          </p>
        ) : null}

        {/* Özet şeridi */}
        <section className="grid grid-cols-2 divide-outline-variant/50 rounded-xl border border-outline-variant/60 bg-surface-container-lowest sm:grid-cols-4 sm:divide-x sm:divide-y-0 divide-y">
          <div className="p-5">
            <Stat label="Bugün" value={s.today} valueTone="primary" hint="Planlı randevu" />
          </div>
          <div className="p-5">
            <Stat label="Bu hafta" value={s.week} hint="Toplam randevu" />
          </div>
          <div className="p-5">
            <Stat label="Onay bekleyen" value={s.pending} valueTone="error" hint="Veli dönüşü bekleniyor" />
          </div>
          <div className="p-5">
            <Stat label="Gelmedi oranı" value={s.noShowRate} hint="Son 30 gün" />
          </div>
        </section>

        {days.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-lowest p-8 text-center font-body-md text-body-md text-on-surface-variant">
            Planlı randevu yok — &quot;Yeni Randevu&quot; ile ilk randevuyu oluşturun.
          </div>
        ) : (
          <>
            {/* Bugün — tam genişlik */}
            {today ? (
              <SectionCard
                title={`${today.label} · ${today.dateLabel}`}
                subtitle={`${today.items.length} randevu`}
                bodyClassName="p-0"
              >
                {today.items.map((item) => (
                  <AppointmentRow key={item.id} item={item} live={live} />
                ))}
              </SectionCard>
            ) : null}

            {/* Sonraki günler — PC'de 2 kolon */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {rest.map((day) => (
                <SectionCard
                  key={`${day.label}-${day.dateLabel}`}
                  title={`${day.label} · ${day.dateLabel}`}
                  subtitle={`${day.items.length} randevu`}
                  bodyClassName="p-0"
                >
                  {day.items.map((item) => (
                    <AppointmentRow key={item.id} item={item} live={live} />
                  ))}
                </SectionCard>
              ))}
            </div>
          </>
        )}
      </div>

      {dialogOpen ? (
        <NewAppointmentDialog contacts={contacts} live={live} onClose={() => setDialogOpen(false)} />
      ) : null}
    </PageShell>
  );
}
