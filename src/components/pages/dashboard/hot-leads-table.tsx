"use client";

import Link from "next/link";
import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { CallButton } from "@/components/ui/call-button";
import { type HotLead,  hotLeadClassFilters, hotLeads } from "@/lib/mock/kpis";

/**
 * "18 dk önce" / "2.5 saat önce" biçimli bekleme metnini dakikaya çevirir.
 * Ayrıştırılamazsa Infinity döner (filtre dışına düşmez).
 */
function waitToMinutes(wait: string): number {
  const match = wait.match(/(\d+(?:[.,]\d+)?)\s*(dk|saat|gün)/);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number.parseFloat(match[1].replace(",", "."));
  const unitMinutes = match[2] === "dk" ? 1 : match[2] === "saat" ? 60 : 1440;
  return value * unitMinutes;
}

/** Lead detayından WhatsApp için numara çıkarır; maskeliyse null döner. */
function extractPhone(detail: string): string | null {
  const digits = (detail.match(/\d/g) ?? []).join("");
  return digits.length >= 10 ? `${digits.slice(-12)}` : null;
}

/**
 * Sıcak lead tablosu (v2) — sessiz başlıklar, havadar satırlar,
 * tek tonal aksiyon + hayalet ikon butonlar. Satır boyama/rozet kalabalığı yok.
 */
export function HotLeadsTable({ leads }: { leads?: HotLead[] }) {
  const items = leads ?? hotLeads;
  const [classFilter, setClassFilter] = useState<string>("Tüm Sınıflar");
  const [hotOnly, setHotOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);

  const rows = items.filter(
    (lead) =>
      (classFilter === "Tüm Sınıflar" || lead.classFilterKey === classFilter) &&
      (!hotOnly || lead.heat === "hot") &&
      (!recentOnly || waitToMinutes(lead.wait) <= 24 * 60)
  );
  const phoneByLead = new Map(items.map((lead) => [lead.id, extractPhone(lead.detail)]));

  return (
    <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
      {/* Başlık & kontroller */}
      <header className="flex flex-col gap-3 border-b border-outline-variant/50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Aranmayı bekleyen sıcak leadler
          </h2>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            5 veli müdahale bekliyor · AI randevu niyeti beyan etti
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              className="h-9 cursor-pointer appearance-none rounded-lg border border-outline-variant/60 bg-surface-container-lowest pl-3 pr-8 font-label-sm text-label-sm text-on-surface focus:outline-none"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              {hotLeadClassFilters.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2 text-[16px] text-on-surface-variant">
              expand_more
            </span>
          </div>
          <button
            className={clsx(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3 font-label-sm text-label-sm transition-colors",
              hotOnly
                ? "border-error/40 bg-error-container/50 font-medium text-on-error-container"
                : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
            )}
            onClick={() => setHotOnly((value) => !value)}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-error">
              local_fire_department
            </span>
            <span>Sadece çok sıcak</span>
          </button>
          <button
            className={clsx(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3 font-label-sm text-label-sm transition-colors",
              recentOnly
                ? "border-outline-variant bg-surface-container font-medium text-on-surface"
                : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
            )}
            onClick={() => setRecentOnly((value) => !value)}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Son 24 saat</span>
          </button>
        </div>
      </header>

      {/* Tablo */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/50 font-label-sm text-label-sm text-on-surface-variant">
              <th className="px-5 py-3 font-medium">Veli / öğrenci</th>
              <th className="px-3 py-3 font-medium">Sınıf &amp; hedef</th>
              <th className="px-3 py-3 font-medium">Sıcaklık</th>
              <th className="px-3 py-3 font-medium">AI görüşme özeti</th>
              <th className="px-3 py-3 font-medium">Bekleme</th>
              <th className="px-5 py-3 text-right font-medium">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {rows.length === 0 && (
              <tr>
                <td
                  className="py-8 text-center font-body-md text-body-md text-on-surface-variant"
                  colSpan={6}
                >
                  Filtreyle eşleşen lead bulunamadı.
                </td>
              </tr>
            )}
            {rows.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-surface-container-low/60">
                <td className="py-3.5 pl-5 pr-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm font-semibold",
                        lead.avatarClass
                      )}
                    >
                      {lead.initials}
                    </span>
                    <div className="min-w-0">
                      <div className="font-label-md text-label-md font-semibold text-on-surface">
                        {lead.parent}
                      </div>
                      <div className="truncate font-body-sm text-body-sm text-on-surface-variant">
                        {lead.detail}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 font-body-sm text-body-sm text-on-surface-variant">
                  {lead.classTag}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5">
                  <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm font-medium text-on-surface">
                    <span
                      className={clsx(
                        "h-1.5 w-1.5 rounded-full",
                        lead.heat === "hot" ? "bg-error" : "bg-tertiary-fixed-dim"
                      )}
                    />
                    {lead.heat === "hot" ? "Sıcak" : "Ilık"}
                  </span>
                </td>
                <td className="max-w-sm px-3 py-3.5">
                  <p className="line-clamp-2 font-body-sm text-body-sm leading-snug text-on-surface-variant">
                    {lead.summary}
                  </p>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5">
                  <span
                    className={clsx(
                      "font-label-sm text-label-sm font-medium",
                      lead.urgentRow ? "text-error" : "text-on-surface-variant"
                    )}
                  >
                    {lead.wait}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <CallButton
                      name={lead.parent}
                      phone={(() => {
                        // Mock veride maskeli numaralar var (412 ** **) — geçerli E.164 üret
                        const digits = (lead.detail.match(/\d/g) ?? []).join("");
                        return digits.length >= 10 ? `+${digits.slice(-12)}` : "+905321234567";
                      })()}
                      leadId={lead.id}
                      context={lead.classTag}
                    />
                    <a
                      aria-label={`${lead.parent} için WhatsApp mesajı aç`}
                      className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        phoneByLead.get(lead.id)
                          ? "text-on-surface-variant hover:bg-surface-container"
                          : "cursor-not-allowed text-outline/50"
                      )}
                      href={
                        phoneByLead.get(lead.id)
                          ? `https://wa.me/${phoneByLead.get(lead.id)}`
                          : undefined
                      }
                      target="_blank"
                      rel="noreferrer"
                      title={
                        phoneByLead.get(lead.id)
                          ? "WhatsApp mesajı aç"
                          : "Numara maskeli — canlı veride etkinleşir"
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </a>
                    <Link
                      aria-label={`${lead.parent} için veli CRM kaydını aç`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
                      href={`/veliler?q=${encodeURIComponent(lead.parent)}`}
                      title="Veli CRM kaydını aç"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/50 px-5 py-3">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Toplam 14 öncelikli arama talebi
        </span>
        <Link
          className="font-label-sm text-label-sm font-medium text-primary transition-colors hover:text-primary-container"
          href="/veliler"
        >
          Tümünü görüntüle
        </Link>
      </div>
    </section>
  );
}
