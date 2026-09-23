"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell, SectionCard } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";

export interface ScheduleSlotVM {
  id: string;
  name: string;
  subject: string | null;
  classLevel: string | null;
  teacher: string | null;
  room: string | null;
  /** 1=Pazartesi … 7=Pazar */
  dayOfWeek: number;
  /** "HH:MM" */
  startTime: string;
  durationMinutes: number;
}

const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const SURELER = [30, 40, 45, 60, 90, 120];

const INPUT_CLS =
  "h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none";

function bitisSaati(start: string, dk: number): string {
  const [s, d] = start.split(":").map(Number);
  const toplam = s * 60 + d + dk;
  return `${String(Math.floor(toplam / 60) % 24).padStart(2, "0")}:${String(toplam % 60).padStart(2, "0")}`;
}

export function DersProgramiView({
  slots,
  live,
  sourceLabel,
}: {
  slots: ScheduleSlotVM[];
  live: boolean;
  sourceLabel?: string;
}) {
  const router = useRouter();
  // Demo modda sunucuya kalıcı yazılamaz: yerel kopyalarla optimistik davran
  const [localSlots, setLocalSlots] = useState<ScheduleSlotVM[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sinifFiltre, setSinifFiltre] = useState("tumu");
  const [ogretmenFiltre, setOgretmenFiltre] = useState("tumu");

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");
  const [gun, setGun] = useState(1);
  const [startTime, setStartTime] = useState("15:00");
  const [duration, setDuration] = useState(60);
  const [creating, setCreating] = useState(false);
  const [uretiliyor, setUretiliyor] = useState<"bu" | "gelecek" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // id başına tek slot; localSlots demo düzenlemede sunucu verisini ekranda ezer
  const slotHaritasi = new Map<string, ScheduleSlotVM>();
  for (const s of slots) slotHaritasi.set(s.id, s);
  for (const s of localSlots) slotHaritasi.set(s.id, s);
  const tumSlotlar = [...slotHaritasi.values()].filter(
    (s) => !deletedIds.includes(s.id)
  );

  // Öneri listeleri + filtre seçenekleri — mevcut slotlardan
  const ogretmenler = Array.from(
    new Set(tumSlotlar.map((s) => s.teacher).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, "tr"));
  const derslikler = Array.from(
    new Set(tumSlotlar.map((s) => s.room).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, "tr"));
  const siniflar = Array.from(
    new Set(tumSlotlar.map((s) => s.classLevel).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, "tr"));

  // Sınıf/öğretmen filtresi
  const seciliSlotlar = tumSlotlar
    .filter((s) => sinifFiltre === "tumu" || (s.classLevel ?? "") === sinifFiltre)
    .filter((s) => ogretmenFiltre === "tumu" || (s.teacher ?? "") === ogretmenFiltre);

  // Haftalık özet (filtrelenmiş üzerinden)
  const haftalikDk = seciliSlotlar.reduce((t, s) => t + s.durationMinutes, 0);
  const haftalikSaat = (haftalikDk / 60).toLocaleString("tr-TR", {
    maximumFractionDigits: 1,
  });

  // Gün bazlı gruplama + bugünün günü (client tarafı — SSR determinizmi gerekmez)
  const gunler: ScheduleSlotVM[][] = GUNLER.map((_, i) =>
    seciliSlotlar
      .filter((s) => s.dayOfWeek === i + 1)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );
  const bugun = ((d) => (d === 0 ? 7 : d))(new Date().getDay());

  const formuKapat = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const slotDuzenle = (slot: ScheduleSlotVM) => {
    setEditingId(slot.id);
    setName(slot.name);
    setSubject(slot.subject ?? "");
    setTeacher(slot.teacher ?? "");
    setClassLevel(slot.classLevel ?? "");
    setRoom(slot.room ?? "");
    setGun(slot.dayOfWeek);
    setStartTime(slot.startTime);
    setDuration(slot.durationMinutes);
    setFormError(null);
    setNote(null);
    setFormOpen(true);
  };

  const slotKaydet = () => {
    if (creating) return;
    if (!name.trim()) {
      setFormError("Ders adı zorunlu.");
      return;
    }
    setCreating(true);
    setFormError(null);
    const url = editingId
      ? `/api/schedule?id=${encodeURIComponent(editingId)}`
      : "/api/schedule";
    fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        subject,
        classLevel,
        teacher,
        room,
        dayOfWeek: gun,
        startTime,
        durationMinutes: duration,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setFormError(d.error ?? "İşlem başarısız");
          setCreating(false);
          return;
        }
        if (d.persisted) {
          router.refresh();
        } else {
          // Demo mod: kalıcı değil, ızgarayı yerel olarak güncelle
          const yerel: ScheduleSlotVM = {
            id: editingId ?? `demo-${Date.now()}`,
            name: name.trim(),
            subject: subject.trim() || null,
            classLevel: classLevel.trim() || null,
            teacher: teacher.trim() || null,
            room: room.trim() || null,
            dayOfWeek: gun,
            startTime,
            durationMinutes: duration,
          };
          setLocalSlots((prev) => [yerel, ...prev.filter((s) => s.id !== yerel.id)]);
          setNote("Demo modda uygulandı — Supabase bağlandığında kalıcı olacak.");
        }
        setCreating(false);
        formuKapat();
        setName("");
        setSubject("");
        setTeacher("");
        setClassLevel("");
        setRoom("");
        setGun(1);
        setStartTime("15:00");
        setDuration(60);
      })
      .catch(() => {
        setFormError("Sunucuya ulaşılamadı");
        setCreating(false);
      });
  };

  const slotSil = (id: string, dersAdi: string) => {
    if (!window.confirm(`'${dersAdi}' dersi programdan kaldırılsın mı?`)) return;
    fetch(`/api/schedule?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setNote(d.error ?? "Ders silinemedi");
        } else if (d.persisted) {
          if (editingId === id) formuKapat();
          router.refresh();
        } else {
          setDeletedIds((prev) => [...prev, id]);
          if (editingId === id) formuKapat();
          setNote("Demo modda silindi — kalıcı değildir.");
        }
      })
      .catch(() => setNote("Sunucuya ulaşılamadı"));
  };

  // Program → Yoklama köprüsü: haftanın Pazartesi'si (offset: 0=bu hafta, 1=gelecek)
  const haftaBaslangici = (offsetHafta: number): string => {
    const d = new Date();
    const g = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - g + offsetHafta * 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const oturumUret = (offsetHafta: number) => {
    if (uretiliyor) return;
    const weekStart = haftaBaslangici(offsetHafta);
    setUretiliyor(offsetHafta === 0 ? "bu" : "gelecek");
    setNote(null);
    fetch("/api/schedule/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setNote(d.error ?? "Oturumlar üretilemedi");
        } else if (d.persisted) {
          setNote(
            `${weekStart} haftası: ${d.created} ders oturumu oluşturuldu` +
              (d.skipped > 0 ? `, ${d.skipped} oturum zaten mevcuttu (yoklama ekranında)` : "") +
              "."
          );
        } else {
          setNote("Demo modda üretim kalıcı değildir.");
        }
      })
      .catch(() => setNote("Sunucuya ulaşılamadı"))
      .finally(() => setUretiliyor(null));
  };

  // Haftalık doluluk — öğretmen/derslik bazında saat yükü (filtreli üzerinden)
  const doluluk = (anahtar: "teacher" | "room") => {
    const harita = new Map<string, number>();
    for (const s of seciliSlotlar) {
      const k = s[anahtar];
      if (!k) continue;
      harita.set(k, (harita.get(k) ?? 0) + s.durationMinutes);
    }
    return [...harita.entries()]
      .map(([ad, dk]) => ({ ad, saat: dk / 60 }))
      .sort((a, b) => b.saat - a.saat);
  };
  const ogretmenYuku = doluluk("teacher");
  const derslikYuku = doluluk("room");
  const yukMax = Math.max(1, ...ogretmenYuku.map((y) => y.saat), ...derslikYuku.map((y) => y.saat));

  return (
    <PageShell>
      <PageHeader
        title="Ders Programı"
        description="Sabit haftalık ders programı — bir kez tanımla, her hafta otomatik uygulansın. Öğretmen, sınıf ve derslik çakışmaları denetlenir."
        actions={
          <div className="flex items-center gap-2">
            {!live ? (
              <span className="font-label-xs text-label-xs text-outline">Demo mod</span>
            ) : null}
            <button
              className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]"
              type="button"
              onClick={() => {
                if (formOpen && !editingId) {
                  formuKapat();
                  return;
                }
                setEditingId(null);
                setName("");
                setSubject("");
                setTeacher("");
                setClassLevel("");
                setRoom("");
                setGun(1);
                setStartTime("15:00");
                setDuration(60);
                setFormError(null);
                setFormOpen(true);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Yeni Ders
            </button>
          </div>
        }
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {note ? (
        <p
          className="-mt-2 flex items-center gap-2 rounded-lg bg-secondary-container/50 px-3 py-2 font-label-sm text-label-sm text-on-secondary-container"
          role="status"
        >
          <span className="material-symbols-outlined text-[16px]">info</span>
          {note}
          <button
            className="ml-auto rounded p-0.5 hover:bg-surface-container"
            type="button"
            onClick={() => setNote(null)}
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </p>
      ) : null}

      {formOpen ? (
        <SectionCard
          title={editingId ? "Dersi Düzenle" : "Yeni Ders (her hafta tekrarlanır)"}
          bodyClassName="p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Ders Adı</span>
              <input
                className={INPUT_CLS}
                onChange={(e) => setName(e.target.value)}
                placeholder="örn. TYT Matematik"
                type="text"
                value={name}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Konu</span>
              <input
                className={INPUT_CLS}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="örn. Deneme analizi"
                type="text"
                value={subject}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Öğretmen</span>
              <input
                className={INPUT_CLS}
                list="program-ogretmenler"
                onChange={(e) => setTeacher(e.target.value)}
                placeholder="örn. Merve Hoca"
                type="text"
                value={teacher}
              />
              <datalist id="program-ogretmenler">
                {ogretmenler.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Sınıf</span>
              <input
                className={INPUT_CLS}
                list="program-siniflar"
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="örn. 12. Sınıf"
                type="text"
                value={classLevel}
              />
              <datalist id="program-siniflar">
                {siniflar.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Derslik</span>
              <input
                className={INPUT_CLS}
                list="program-derslikler"
                onChange={(e) => setRoom(e.target.value)}
                placeholder="örn. Derslik 1"
                type="text"
                value={room}
              />
              <datalist id="program-derslikler">
                {derslikler.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Gün</span>
                <select
                  className={INPUT_CLS}
                  onChange={(e) => setGun(Number(e.target.value))}
                  value={gun}
                >
                  {GUNLER.map((g, i) => (
                    <option key={g} value={i + 1}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Saat</span>
                <input
                  className={INPUT_CLS}
                  onChange={(e) => setStartTime(e.target.value)}
                  type="time"
                  value={startTime}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Süre</span>
                <select
                  className={INPUT_CLS}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  value={duration}
                >
                  {SURELER.map((s) => (
                    <option key={s} value={s}>
                      {s} dk
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {formError ? (
            <p className="mt-2 font-label-sm text-label-sm font-semibold text-error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            <button
              className={clsx(
                "flex h-10 items-center gap-2 rounded-xl bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary",
                creating && "opacity-60"
              )}
              disabled={creating}
              type="button"
              onClick={slotKaydet}
            >
              <span className={clsx("material-symbols-outlined text-[16px]", creating && "animate-spin")}>
                {creating ? "refresh" : editingId ? "save" : "calendar_add_on"}
              </span>
              {creating
                ? "Kaydediliyor..."
                : editingId
                  ? "Değişiklikleri Kaydet"
                  : "Programa Ekle"}
            </button>
            {editingId ? (
              <button
                className="font-label-md text-label-md font-semibold text-on-surface-variant hover:text-on-surface"
                type="button"
                onClick={formuKapat}
              >
                Vazgeç
              </button>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {tumSlotlar.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {/* Haftalık özet */}
          <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-primary">event_note</span>
            {seciliSlotlar.length} ders/hafta
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
            {haftalikSaat} saat/hafta
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-primary">person</span>
            {ogretmenler.length} öğretmen
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-primary">meeting_room</span>
            {derslikler.length} derslik
          </span>

          {/* Sınıf/öğretmen filtresi */}
          {siniflar.length > 0 ? (
            <select
              aria-label="Sınıf filtresi"
              className={clsx(INPUT_CLS, "h-9 w-auto")}
              onChange={(e) => setSinifFiltre(e.target.value)}
              value={sinifFiltre}
            >
              <option value="tumu">Tüm Sınıflar</option>
              {siniflar.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : null}
          {ogretmenler.length > 0 ? (
            <select
              aria-label="Öğretmen filtresi"
              className={clsx(INPUT_CLS, "h-9 w-auto")}
              onChange={(e) => setOgretmenFiltre(e.target.value)}
              value={ogretmenFiltre}
            >
              <option value="tumu">Tüm Öğretmenler</option>
              {ogretmenler.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : null}

          {/* Program → Yoklama köprüsü: haftalık oturum üretimi */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="font-label-xs text-label-xs text-on-surface-variant">
              Oturum üret:
            </span>
            <button
              className={clsx(
                "flex h-9 items-center gap-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2.5 font-label-xs text-label-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low",
                uretiliyor && "opacity-60"
              )}
              disabled={uretiliyor !== null}
              type="button"
              onClick={() => oturumUret(0)}
            >
              <span className={clsx("material-symbols-outlined text-[14px]", uretiliyor === "bu" && "animate-spin")}>
                {uretiliyor === "bu" ? "refresh" : "bolt"}
              </span>
              Bu Hafta
            </button>
            <button
              className={clsx(
                "flex h-9 items-center gap-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2.5 font-label-xs text-label-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low",
                uretiliyor && "opacity-60"
              )}
              disabled={uretiliyor !== null}
              type="button"
              onClick={() => oturumUret(1)}
            >
              <span className={clsx("material-symbols-outlined text-[14px]", uretiliyor === "gelecek" && "animate-spin")}>
                {uretiliyor === "gelecek" ? "refresh" : "bolt"}
              </span>
              Gelecek Hafta
            </button>
          </div>
        </div>
      ) : null}

      {tumSlotlar.length === 0 ? (
        <EmptyState
          description="Programda henüz ders yok. 'Yeni Ders' ile sabit haftalık programını oluşturun — her hafta otomatik tekrarlanır."
          icon="calendar_view_week"
          title="Program boş"
        />
      ) : seciliSlotlar.length === 0 ? (
        <p className="rounded-xl bg-surface-container-low p-4 font-label-sm text-label-sm text-on-surface-variant">
          Seçilen sınıf/öğretmen filtresine uyan ders yok — filtreleri &quot;Tümü&quot;ne çevirin.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {GUNLER.map((gunAdi, i) => {
            const gunSlotlari = gunler[i];
            const bugunMu = i + 1 === bugun;
            return (
              <div
                key={gunAdi}
                className={clsx(
                  "flex min-h-24 flex-col gap-2 rounded-xl border bg-surface-container-lowest p-3",
                  bugunMu ? "border-primary/60" : "border-outline-variant/60"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    {gunAdi}
                  </span>
                  {bugunMu ? (
                    <span className="rounded-full bg-primary-container px-2 py-0.5 font-label-xs text-label-xs font-bold text-on-primary-container">
                      Bugün
                    </span>
                  ) : (
                    <span className="font-label-xs text-label-xs text-on-surface-variant">
                      {gunSlotlari.length > 0 ? `${gunSlotlari.length} ders` : "—"}
                    </span>
                  )}
                </div>
                {gunSlotlari.length === 0 ? (
                  <span className="font-label-xs text-label-xs text-outline">—</span>
                ) : (
                  gunSlotlari.map((slot) => (
                    <div
                      key={slot.id}
                      className={clsx(
                        "group flex flex-col gap-1 rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-2.5",
                        editingId === slot.id && "border-primary bg-primary-fixed/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="min-w-0 font-label-sm text-label-sm font-semibold text-on-surface">
                          {slot.name}
                        </span>
                        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            aria-label={`${slot.name} (${slot.startTime}) dersini düzenle`}
                            className="rounded p-0.5 text-on-surface-variant hover:text-primary"
                            type="button"
                            onClick={() => slotDuzenle(slot)}
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button
                            aria-label={`${slot.name} (${slot.startTime}) dersini sil`}
                            className="rounded p-0.5 text-on-surface-variant hover:text-error"
                            type="button"
                            onClick={() => slotSil(slot.id, slot.name)}
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </div>
                      <span className="font-label-xs text-label-xs text-on-surface-variant">
                        {slot.startTime}–{bitisSaati(slot.startTime, slot.durationMinutes)} ·{" "}
                        {slot.durationMinutes} dk
                      </span>
                      <span className="truncate font-label-xs text-label-xs text-on-surface-variant">
                        {slot.teacher ? `${slot.teacher} · ` : ""}
                        {slot.classLevel ?? "—"}
                        {slot.room ? ` · ${slot.room}` : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Haftalık doluluk — öğretmen ve derslik bazında saat yükü (filtreli) */}
      {tumSlotlar.length > 0 && (ogretmenYuku.length > 0 || derslikYuku.length > 0) ? (
        <SectionCard
          title="Haftalık Doluluk"
          subtitle="Öğretmen ve derslik bazında haftalık saat yükü"
          bodyClassName="p-4"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 font-label-md text-label-md font-semibold text-on-surface">
                Öğretmenler
              </p>
              <ul className="flex flex-col gap-2">
                {ogretmenYuku.map((y) => (
                  <li key={y.ad} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate font-label-sm text-label-sm text-on-surface">
                      {y.ad}
                    </span>
                    <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((y.saat / yukMax) * 100)}%` }}
                      />
                    </span>
                    <span className="w-14 shrink-0 text-right font-label-xs text-label-xs text-on-surface-variant">
                      {y.saat.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sa
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-label-md text-label-md font-semibold text-on-surface">
                Derslikler
              </p>
              <ul className="flex flex-col gap-2">
                {derslikYuku.map((y) => (
                  <li key={y.ad} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate font-label-sm text-label-sm text-on-surface">
                      {y.ad}
                    </span>
                    <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <span
                        className="block h-full rounded-full bg-tertiary"
                        style={{ width: `${Math.round((y.saat / yukMax) * 100)}%` }}
                      />
                    </span>
                    <span className="w-14 shrink-0 text-right font-label-xs text-label-xs text-on-surface-variant">
                      {y.saat.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sa
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </PageShell>
  );
}
