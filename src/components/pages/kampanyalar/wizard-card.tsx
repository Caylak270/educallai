"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "@/lib/clsx";

const STEPS = [
  { number: 1, label: "Kampanya Bilgisi" },
  { number: 2, label: "Hedef Liste (CSV)" },
  { number: 3, label: "Önizleme & Oluştur" },
];

const DAYS = [
  { id: "pte", label: "Pzt" },
  { id: "sal", label: "Sal" },
  { id: "car", label: "Çar" },
  { id: "per", label: "Per" },
  { id: "cum", label: "Cum" },
  { id: "cmt", label: "Cmt" },
];

const CHANNELS = [
  { id: "voice", label: "Sesli Arama" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "sms", label: "SMS" },
];

interface CsvEntry {
  name: string;
  phone: string;
}

/** CSV metnini ayrıştırır: isim,telefon / isim;telefon (başlık satırını atlar). */
function parseCsv(text: string): CsvEntry[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const entries: CsvEntry[] = [];
  for (const line of lines) {
    const parts = line.split(/[;,\t]/).map((p) => p.trim());
    if (parts.length < 2) continue;
    const [a, b] = parts;
    if (/isim|ad soyad|name|telefon|phone/i.test(a) && !/\d{5,}/.test(b)) continue;
    if (a && /\d{5,}/.test(b)) entries.push({ name: a, phone: b });
  }
  return entries;
}

/** Yeni Kampanya Sihirbazı — 3 adım: bilgi → CSV hedef listesi → önizleme. */
export function WizardCard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("voice");
  const [checkedDays, setCheckedDays] = useState<Record<string, boolean>>(
    Object.fromEntries(DAYS.map((d) => [d.id, d.id !== "cmt"]))
  );
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [csvName, setCsvName] = useState<string | null>(null);
  const [entries, setEntries] = useState<CsvEntry[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ persisted: boolean; targets: number } | null>(null);

  const toggleDay = (id: string) =>
    setCheckedDays((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeDays = DAYS.filter((d) => checkedDays[d.id]).map((d) => d.label);

  const onFile = async (file: File | null) => {
    setCsvError(null);
    if (!file) return;
    setCsvName(file.name);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      setEntries([]);
      setCsvError("Geçerli satır bulunamadı — biçim: isim,telefon (her satıra bir aday)");
      return;
    }
    setEntries(parsed);
  };

  /** Ayrıştırılan ilk 5 kaydın ad+telefon önizlemesi (adım 2 ve 3'te gösterilir). */
  const previewList = (compact: boolean) => {
    if (entries.length === 0) return null;
    const shown = entries.slice(0, 5);
    return (
      <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
        <p className="mb-1.5 font-label-xs text-label-xs font-semibold text-on-surface-variant">
          Ayrıştırılan kayıtlar (ilk 5)
        </p>
        <ul className="flex flex-col gap-1">
          {shown.map((entry, index) => (
            <li
              key={`${entry.phone}-${index}`}
              className="flex items-center justify-between gap-3 font-label-sm text-label-sm"
            >
              <span className="truncate font-medium text-on-surface">{entry.name}</span>
              <span className="shrink-0 font-mono-data text-[11px] text-on-surface-variant">
                {entry.phone}
              </span>
            </li>
          ))}
        </ul>
        {entries.length > 5 && !compact ? (
          <p className="mt-1.5 font-label-xs text-label-xs text-on-surface-variant">
            +{entries.length - 5} kişi daha
          </p>
        ) : null}
      </div>
    );
  };

  const create = () => {
    if (busy) return;
    setBusy(true);
    fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || "Yeni Kampanya",
        channel,
        totalTargets: entries.length,
        script: `${activeDays.join(", ") || "Hafta içi"} ${startTime}-${endTime} arası ${CHANNELS.find((c) => c.id === channel)?.label} kampanyası`,
        // Ayrıştırılan hedef listesi; route kanal hedef tablosuna yazamıyorsa yok sayar.
        targets: entries,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        setBusy(false);
        if (!d.ok) {
          setCsvError(d.error ?? "Kampanya oluşturulamadı");
          return;
        }
        setDone({ persisted: Boolean(d.persisted), targets: entries.length });
        if (d.persisted) {
          setTimeout(() => router.refresh(), 800);
        }
      })
      .catch(() => {
        setBusy(false);
        setCsvError("Sunucuya ulaşılamadı");
      });
  };

  const stepHeader = (
    <div className="flex items-center gap-3 border-b border-outline-variant/50 px-5 py-4">
      {STEPS.map((s, index) => {
        const active = s.number === step;
        const complete = s.number < step;
        return (
          <div key={s.number} className="flex flex-1 items-center gap-3 last:flex-none">
            <div
              className={clsx(
                "flex items-center gap-2 font-label-sm text-label-sm",
                active ? "font-semibold text-primary" : complete ? "text-secondary" : "text-outline"
              )}
            >
              <span
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-label-xs text-label-xs",
                  active ? "bg-primary-container text-on-primary" : complete ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container"
                )}
              >
                {complete ? "✓" : s.number}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {index < STEPS.length - 1 ? (
              <div className={clsx("h-px flex-1", active ? "bg-primary-fixed-dim" : "bg-surface-container")} />
            ) : null}
          </div>
        );
      })}
    </div>
  );

  const inputCls =
    "h-10 w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none";

  return (
    <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
      {stepHeader}
      <div className="space-y-5 p-5">
        {done ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="material-symbols-outlined text-[40px] text-secondary">check_circle</span>
            <p className="font-headline-sm text-headline-sm text-on-surface">Kampanya oluşturuldu</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {done.targets} hedef veli ·{" "}
              {done.persisted
                ? "Supabase'e kaydedildi — arama planlaması dialer tarafındadır."
                : "Demo modda kaydedildi."}
            </p>
            <p className="rounded-lg bg-surface-container-low px-4 py-2 font-label-sm text-label-sm text-on-surface-variant">
              Kampanya <span className="font-semibold text-on-surface">taslak olarak kaydedildi</span> —
              Kampanyalar listesinde <span className="font-semibold text-on-surface">“Duraklatıldı / Taslak”</span>{" "}
              sekmesinde görünür.
            </p>
          </div>
        ) : step === 1 ? (
          <>
            <div>
              <label className="mb-1.5 block font-label-sm text-label-sm font-semibold text-on-surface" htmlFor="campaign-name">
                Kampanya Adı
              </label>
              <input
                className={inputCls}
                id="campaign-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="örn. Kasım Veli Arama Kampanyası"
                type="text"
                value={name}
              />
            </div>
            <div>
              <p className="mb-1.5 font-label-sm text-label-sm font-semibold text-on-surface">Kanal</p>
              <div className="flex gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    className={clsx(
                      "h-9 flex-1 rounded-lg border font-label-xs text-label-xs transition-colors",
                      channel === c.id
                        ? "border-primary bg-primary-fixed/40 font-semibold text-primary"
                        : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                    )}
                    type="button"
                    onClick={() => setChannel(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 font-label-sm text-label-sm font-semibold text-on-surface">Çalışma günleri</p>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => (
                  <button
                    key={day.id}
                    className={clsx(
                      "h-9 w-11 rounded-lg border font-label-xs text-label-xs transition-colors",
                      checkedDays[day.id]
                        ? "border-primary bg-primary-container font-semibold text-on-primary"
                        : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant"
                    )}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Başlangıç saati</span>
                <input className={inputCls} onChange={(e) => setStartTime(e.target.value)} type="time" value={startTime} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Bitiş saati</span>
                <input className={inputCls} onChange={(e) => setEndTime(e.target.value)} type="time" value={endTime} />
              </label>
            </div>
            <div className="flex justify-end">
              <button
                className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary"
                type="button"
                onClick={() => setStep(2)}
              >
                İleri
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </>
        ) : step === 2 ? (
          <>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/60 p-8 text-center transition-colors hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                {csvName ? "description" : "upload_file"}
              </span>
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                {csvName ?? "CSV dosyası seç (isim,telefon)"}
              </span>
              <span className="font-label-xs text-label-xs text-outline">
                Her satıra bir aday · isim,telefon
              </span>
              <input accept=".csv,.txt" className="hidden" type="file" onChange={(e) => void onFile(e.target.files?.[0] ?? null)} />
            </label>
            {csvError ? <p className="font-label-sm text-label-sm font-semibold text-error" role="alert">{csvError}</p> : null}
            {entries.length > 0 ? (
              <>
                <p className="font-label-sm text-label-sm font-semibold text-secondary">
                  {entries.length} aday ayrıştırıldı ✓
                </p>
                {previewList(false)}
              </>
            ) : null}
            <div className="flex justify-between">
              <button
                className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 px-4 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low"
                type="button"
                onClick={() => setStep(1)}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Geri
              </button>
              <button
                className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary disabled:opacity-50"
                disabled={entries.length === 0}
                type="button"
                onClick={() => setStep(3)}
              >
                İleri
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                ["Kampanya", name || "—"],
                ["Kanal", CHANNELS.find((c) => c.id === channel)?.label ?? "—"],
                ["Günler", activeDays.join(", ") || "—"],
                ["Saatler", `${startTime} - ${endTime}`],
                ["Hedef veli", `${entries.length} kişi`],
                ["CSV dosyası", csvName ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-surface-container-low p-3">
                  <dt className="font-label-xs text-label-xs text-on-surface-variant">{label}</dt>
                  <dd className="truncate font-label-sm text-label-sm font-semibold text-on-surface">{value}</dd>
                </div>
              ))}
            </dl>
            {previewList(true)}
            {csvError ? <p className="font-label-sm text-label-sm font-semibold text-error" role="alert">{csvError}</p> : null}
            <div className="flex justify-between">
              <button
                className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 px-4 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low"
                type="button"
                onClick={() => setStep(2)}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Geri
              </button>
              <button
                className={clsx(
                  "flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary",
                  busy && "opacity-60"
                )}
                disabled={busy}
                type="button"
                onClick={create}
              >
                <span className={clsx("material-symbols-outlined text-[16px]", busy && "animate-spin")}>
                  {busy ? "refresh" : "rocket_launch"}
                </span>
                {busy ? "Oluşturuluyor..." : "Kampanyayı Oluştur"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
