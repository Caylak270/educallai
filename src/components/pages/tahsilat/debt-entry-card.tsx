"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";
import type { DebtorContactOption } from "@/lib/mock/installments";

const TL = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

const SHORT_DATE = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(y, m - 1, d + days);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

/** Bugünden 5 gün sonrası — ilk vade alanının varsayılanı. */
function defaultFirstDue(): string {
  const t = new Date();
  t.setDate(t.getDate() + 5);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

/**
 * Yeni Borç Kaydı — modülün veri giriş kapısı.
 * Öğrenci/veli seç, toplam borç + taksit sayısı + ilk vade gir;
 * önizlemede taksit planını gör, onayla → POST /api/installments
 * installment_tracker'a taksit başına bir satır yazar.
 */
export function DebtEntryCard({ contacts }: { contacts: DebtorContactOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [selected, setSelected] = useState<DebtorContactOption | null>(null);
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState("4");
  const [firstDue, setFirstDue] = useState(defaultFirstDue);
  const [interval, setIntervalKind] = useState<"monthly" | "weekly">("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const blurTimer = useRef<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const base = q
      ? contacts.filter((c) =>
          `${c.studentName} ${c.parentName}`.toLocaleLowerCase("tr-TR").includes(q)
        )
      : contacts;
    return base.slice(0, 8);
  }, [contacts, query]);

  /* Canlı önizleme: eşit taksit, kuruş farkı son taksite */
  const preview = useMemo(() => {
    const total = Number(amount.replace(",", "."));
    const n = Math.floor(Number(count));
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(n) || n < 1 || n > 24) {
      return null;
    }
    const per = Math.floor((total / n) * 100) / 100;
    const last = Math.round((total - per * (n - 1)) * 100) / 100;
    const dates = Array.from({ length: n }, (_, i) =>
      interval === "weekly" ? addDaysIso(firstDue, i * 7) : addMonthsIso(firstDue, i)
    );
    return { total, n, per, last, dates };
  }, [amount, count, firstDue, interval]);

  const resetForm = () => {
    setSelected(null);
    setQuery("");
    setAmount("");
    setCount("4");
    setFirstDue(defaultFirstDue());
    setIntervalKind("monthly");
  };

  const submit = () => {
    if (busy) return;
    setError(null);
    if (!selected) {
      setError("Önce öğrenci/veli seçin");
      return;
    }
    if (!preview) {
      setError("Tutar ve taksit sayısını kontrol edin");
      return;
    }
    void (async () => {
      setBusy(true);
      try {
        const res = await fetch("/api/installments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId: selected.id,
            totalAmount: preview.total,
            installmentCount: preview.n,
            firstDueDate: firstDue,
            interval,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Kayıt oluşturulamadı");
          return;
        }
        setOpen(false);
        resetForm();
        if (data.persisted === false) {
          setNote("Demo mod: plan oluşturma simüle edildi, kalıcı kayıt yazılmadı.");
        } else {
          setNote(
            `${data.studentName} için ${data.created} taksitlik borç kaydı oluşturuldu.`
          );
          router.refresh();
        }
      } catch {
        setError("Sunucuya ulaşılamadı");
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Borç / Taksit Girişi
          </h2>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            {contacts.length > 0
              ? "Öğrenci seç, borç tutarını gir, taksit planı otomatik oluşturulsun."
              : "Borç girişi için önce Veliler (CRM) sayfasından veli kaydı gerekli."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
            setNote(null);
            setError(null);
          }}
          className={clsx(
            "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 font-label-sm text-label-sm font-semibold transition-colors",
            open
              ? "border border-outline-variant/60 text-on-surface hover:bg-surface-container-low"
              : "bg-primary-container text-on-primary hover:bg-primary"
          )}
        >
          <span className="material-symbols-outlined text-[16px]">
            {open ? "close" : "add"}
          </span>
          {open ? "Kapat" : "Yeni Borç Kaydı"}
        </button>
      </header>

      {open ? (
        <div className="flex flex-col gap-4 border-t border-outline-variant/50 p-5">
          {contacts.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Sistemde kayıtlı veli bulunamadı. /veliler sayfasından veli ekledikten
              sonra borç girişi yapabilirsiniz.
            </p>
          ) : (
            <>
              {/* Öğrenci/veli seçimi — aramalı combobox */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <label className="mb-1 block font-label-xs text-label-xs font-medium text-on-surface-variant">
                    Öğrenci / Veli
                  </label>
                  {selected ? (
                    <div className="flex h-11 items-center justify-between gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-low px-3">
                      <span className="min-w-0 truncate font-body-md text-body-md text-on-surface">
                        <span className="font-semibold">{selected.studentName}</span>
                        <span className="text-on-surface-variant">
                          {" "}
                          · {selected.parentName} · {selected.grade}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label="Seçimi temizle"
                        onClick={() => setSelected(null)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={query}
                        placeholder="Öğrenci veya veli adı yazın…"
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setListOpen(true);
                        }}
                        onFocus={() => {
                          if (blurTimer.current !== null) {
                            window.clearTimeout(blurTimer.current);
                            blurTimer.current = null;
                          }
                          setListOpen(true);
                        }}
                        onBlur={() => {
                          blurTimer.current = window.setTimeout(
                            () => setListOpen(false),
                            150
                          );
                        }}
                        className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none"
                      />
                      {listOpen && filtered.length > 0 ? (
                        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-1 shadow-lg">
                          {filtered.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSelected(c);
                                  setListOpen(false);
                                  setQuery("");
                                }}
                                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-surface-container-low"
                              >
                                <span className="font-label-md text-label-md font-semibold text-on-surface">
                                  {c.studentName}
                                  <span className="ml-1.5 font-normal text-on-surface-variant">
                                    {c.grade}
                                  </span>
                                </span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">
                                  Veli: {c.parentName}
                                  {c.phone ? ` · ${c.phone}` : ""}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  )}
                </div>

                {/* Toplam borç tutarı */}
                <div>
                  <label className="mb-1 block font-label-xs text-label-xs font-medium text-on-surface-variant">
                    Toplam Borç (₺)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Örn. 48000"
                    className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-label-xs text-label-xs font-medium text-on-surface-variant">
                    Taksit Sayısı
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-label-xs text-label-xs font-medium text-on-surface-variant">
                    İlk Vade Tarihi
                  </label>
                  <input
                    type="date"
                    value={firstDue}
                    onChange={(e) => setFirstDue(e.target.value)}
                    className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-label-xs text-label-xs font-medium text-on-surface-variant">
                    Ödeme Periyodu
                  </label>
                  <select
                    value={interval}
                    onChange={(e) => setIntervalKind(e.target.value as "monthly" | "weekly")}
                    className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-2.5 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none"
                  >
                    <option value="monthly">Aylık</option>
                    <option value="weekly">Haftalık</option>
                  </select>
                </div>
              </div>

              {/* Taksit planı önizleme */}
              {preview ? (
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="font-label-md text-label-md font-semibold text-on-surface">
                    Plan Önizleme ·{" "}
                    <span className="text-primary">
                      {preview.n} x {TL.format(preview.n > 1 ? preview.per : preview.last)}
                    </span>
                    {preview.n > 1 && preview.last !== preview.per ? (
                      <span className="ml-1.5 font-normal text-on-surface-variant">
                        (son taksit {TL.format(preview.last)})
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {preview.dates.slice(0, 6).map((d, i) => (
                      <span
                        key={d}
                        className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant"
                      >
                        {i + 1}. taksit · {SHORT_DATE.format(new Date(d + "T00:00:00"))}
                      </span>
                    ))}
                    {preview.dates.length > 6 ? (
                      <span className="flex items-center font-label-sm text-label-sm text-on-surface-variant">
                        +{preview.dates.length - 6} taksit daha
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary disabled:opacity-70"
                >
                  <span
                    className={clsx(
                      "material-symbols-outlined text-[16px]",
                      busy && "animate-spin"
                    )}
                  >
                    {busy ? "refresh" : "save"}
                  </span>
                  {busy ? "Kaydediliyor..." : "Borç Kaydını Oluştur"}
                </button>
                {error ? (
                  <p className="font-label-sm text-label-sm font-semibold text-error" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}

      {note ? (
        <p
          className="flex items-center gap-1.5 border-t border-outline-variant/50 px-5 py-3 font-label-sm text-label-sm font-semibold text-secondary"
          role="status"
        >
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          {note}
        </p>
      ) : null}
    </section>
  );
}
