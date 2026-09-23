"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell, SectionCard } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { EventInvite, EventRow, InviteStatus } from "@/lib/types/db";

const TYPE_LABEL: Record<string, string> = {
  seminer: "Seminer",
  deneme_gunu: "Deneme Günü",
  workshop: "Workshop",
  diger: "Diğer",
};

const STATUS_STYLE: Record<InviteStatus, string> = {
  davetli: "bg-tertiary-container text-on-tertiary-container",
  katildi: "bg-secondary-container text-on-secondary-container",
  iptal: "bg-surface-container text-on-surface-variant",
};

const DT_FMT = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric", month: "long", weekday: "short", hour: "2-digit", minute: "2-digit",
});

export function EtkinliklerView({
  events,
  invitesByEvent,
  contacts,
  live,
  sourceLabel,
}: {
  events: EventRow[];
  invitesByEvent: Record<string, Array<{ invite: EventInvite; label: string }>>;
  contacts: Array<{ id: string; label: string }>;
  live: boolean;
  sourceLabel?: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("seminer");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [capacity, setCapacity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteContact, setInviteContact] = useState<Record<string, string>>({});
  // Demo modda sunucuya kalıcı yazılamaz: yerel kopyalarla optimistik davran
  const [localEvents, setLocalEvents] = useState<EventRow[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, InviteStatus>>({});

  const allEvents = [...localEvents, ...events];

  const createEvent = () => {
    if (busy) return;
    if (!name.trim() || !date) {
      setError("Etkinlik adı ve tarih zorunlu.");
      return;
    }
    setBusy(true);
    setError(null);
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, eventType, date, time, capacity: Number(capacity) || undefined }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setError(d.error ?? "Etkinlik oluşturulamadı");
          setBusy(false);
          return;
        }
        if (d.persisted) {
          router.refresh();
        } else {
          // Demo mod: kalıcı değil ama listeye yerel olarak ekle, kullanıcıyı bilgilendir
          setLocalEvents((prev) => [
            {
              id: `demo-${Date.now()}`,
              dershane_id: "demo",
              name: name.trim(),
              event_type: eventType as EventRow["event_type"],
              event_date: time ? `${date}T${time}:00` : date,
              capacity: Number(capacity) || null,
              notes: null,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
          setNotice("Demo modda oluşturuldu — Supabase bağlandığında kalıcı olacak.");
          setFormOpen(false);
          setBusy(false);
          setName("");
          setDate("");
          setCapacity("");
        }
      })
      .catch(() => {
        setError("Sunucuya ulaşılamadı");
        setBusy(false);
      });
  };

  const toggleInvite = (inviteId: string, status: InviteStatus, current: InviteStatus) => {
    const next = current === status ? "davetli" : status;
    fetch(`/api/event-invites/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.persisted) {
          router.refresh();
        } else {
          setStatusOverrides((prev) => ({ ...prev, [inviteId]: next }));
          setNotice("Demo modda güncellendi — kalıcı değildir.");
        }
      })
      .catch(() => {
        setNotice(null);
        setError("Katılım durumu güncellenemedi — sunucuya ulaşılamadı.");
      });
  };

  const addInvitee = (eventId: string) => {
    const contactId = inviteContact[eventId];
    if (!contactId || !live) return;
    fetch("/api/event-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, contactId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.persisted) router.refresh();
      })
      .catch(() => {
        setNotice(null);
        setError("Davetli eklenemedi — sunucuya ulaşılamadı.");
      });
  };

  // Date.now render'da çağrılamaz: minik istemci state'i (mount sonrası güncellenir)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => {
      if (alive) setNow(Date.now());
    });
    return () => {
      alive = false;
    };
  }, []);
  const upcoming = allEvents.filter(
    (e) => now === null || new Date(e.event_date).getTime() >= now
  );
  const past = now === null ? 0 : allEvents.length - upcoming.length;

  return (
    <PageShell>
      <PageHeader
        title="Etkinlik Yönetimi"
        description="Veli seminerleri, deneme günleri ve workshop'lar — davet ve katılım takibi."
        actions={
          <button
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]"
            type="button"
            onClick={() => setFormOpen((v) => !v)}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Yeni Etkinlik
          </button>
        }
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {notice ? (
        <p
          className="-mt-2 flex items-center gap-2 rounded-lg bg-secondary-container/50 px-3 py-2 font-label-sm text-label-sm text-on-secondary-container"
          role="status"
        >
          <span className="material-symbols-outlined text-[16px]">info</span>
          {notice}
          <button
            className="ml-auto rounded p-0.5 hover:bg-surface-container"
            type="button"
            onClick={() => setNotice(null)}
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </p>
      ) : null}

      {formOpen ? (
        <SectionCard title="Yeni Etkinlik" bodyClassName="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Etkinlik adı</span>
              <input className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" onChange={(e) => setName(e.target.value)} type="text" value={name} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Tür</span>
              <select className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" onChange={(e) => setEventType(e.target.value)} value={eventType}>
                <option value="seminer">Seminer</option>
                <option value="deneme_gunu">Deneme Günü</option>
                <option value="workshop">Workshop</option>
                <option value="diger">Diğer</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Tarih</span>
                <input className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" onChange={(e) => setDate(e.target.value)} type="date" value={date} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Saat</span>
                <input className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" onChange={(e) => setTime(e.target.value)} type="time" value={time} />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Kontenjan</span>
              <input className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none" onChange={(e) => setCapacity(e.target.value)} placeholder="örn. 50" type="number" value={capacity} />
            </label>
          </div>
          {error ? <p className="mt-2 font-label-sm text-label-sm font-semibold text-error" role="alert">{error}</p> : null}
          <button
            className={clsx("mt-3 flex h-10 items-center gap-2 rounded-xl bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary", busy && "opacity-60")}
            disabled={busy}
            type="button"
            onClick={createEvent}
          >
            <span className={clsx("material-symbols-outlined text-[16px]", busy && "animate-spin")}>{busy ? "refresh" : "event_available"}</span>
            Oluştur
          </button>
        </SectionCard>
      ) : null}

      {allEvents.length === 0 ? (
        <EmptyState description="İlk etkinliği oluşturun — veli semineri, deneme günü veya workshop." icon="local_activity" title="Etkinlik yok" />
      ) : (
        <div className="flex flex-col gap-4">
          {allEvents.map((event) => {
            const invites = invitesByEvent[event.id] ?? [];
            const attended = invites.filter(
              (i) => (statusOverrides[i.invite.id] ?? i.invite.status) === "katildi"
            ).length;
            return (
              <SectionCard
                key={event.id}
                title={event.name}
                subtitle={`${TYPE_LABEL[event.event_type] ?? event.event_type} · ${DT_FMT.format(new Date(event.event_date))}${event.capacity ? ` · Kontenjan ${event.capacity}` : ""}`}
                bodyClassName="p-4"
              >
                {event.notes ? (
                  <p className="mb-3 font-body-sm text-body-sm text-on-surface-variant">{event.notes}</p>
                ) : null}
                <p className="mb-2 font-label-sm text-label-sm text-on-surface-variant">
                  Davetli: {invites.length} · Katıldı: {attended}
                </p>
                <div className="flex flex-col gap-2">
                  {invites.map(({ invite, label }) => {
                    const status = statusOverrides[invite.id] ?? invite.status;
                    return (
                      <div key={invite.id} className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2.5">
                        <span className="min-w-0 flex-1 truncate font-label-sm text-label-sm text-on-surface">
                          {label}
                        </span>
                        <span className={clsx("shrink-0 rounded-full px-2 py-0.5 font-label-xs text-label-xs font-semibold", STATUS_STYLE[status])}>
                          {status === "katildi" ? "Katıldı" : status === "iptal" ? "İptal" : "Davetli"}
                        </span>
                        <button
                          className={clsx(
                            "shrink-0 rounded-lg border px-2.5 py-1.5 font-label-xs text-label-xs transition-colors",
                            status === "katildi"
                              ? "border-secondary bg-secondary-container text-on-secondary-container"
                              : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container"
                          )}
                          type="button"
                          onClick={() => toggleInvite(invite.id, "katildi", status)}
                        >
                          {status === "katildi" ? "Geri Al" : "Katıldı"}
                        </button>
                      </div>
                    );
                  })}
                  {live ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="h-9 flex-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 font-label-sm text-label-sm text-on-surface focus:outline-none"
                        onChange={(e) => setInviteContact((prev) => ({ ...prev, [event.id]: e.target.value }))}
                        value={inviteContact[event.id] ?? ""}
                      >
                        <option value="">Davetli ekle — veli seçin...</option>
                        {contacts
                          .filter((c) => !invites.some((i) => i.invite.contact_id === c.id))
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                      </select>
                      <button
                        className="h-9 shrink-0 rounded-lg bg-surface-container px-3 font-label-sm text-label-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                        disabled={!inviteContact[event.id]}
                        type="button"
                        onClick={() => addInvitee(event.id)}
                      >
                        Ekle
                      </button>
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            );
          })}
          {past > 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Geçmiş {past} etkinlik kaydı arşivde.
            </p>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
