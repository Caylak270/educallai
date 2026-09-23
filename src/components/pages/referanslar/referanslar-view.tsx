"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell, SectionCard } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { Referral, ReferralStatus } from "@/lib/types/db";

const STATUS_ORDER: ReferralStatus[] = ["yeni", "iletisim", "kayit", "iptal"];
const STATUS_LABEL: Record<ReferralStatus, string> = {
  yeni: "Yeni",
  iletisim: "İletişimde",
  kayit: "Kayıt Oldu",
  iptal: "İptal",
};
const STATUS_STYLE: Record<ReferralStatus, string> = {
  yeni: "bg-tertiary-container text-on-tertiary-container",
  iletisim: "bg-primary-fixed text-primary",
  kayit: "bg-secondary-container text-on-secondary-container",
  iptal: "bg-surface-container text-on-surface-variant",
};

export function ReferanslarView({
  referrals,
  contacts,
  live,
  sourceLabel,
}: {
  referrals: Array<Referral & { referrerName: string }>;
  contacts: Array<{ id: string; label: string }>;
  live: boolean;
  sourceLabel?: string;
}) {
  const router = useRouter();
  const [referrerContactId, setReferrerContactId] = useState(contacts[0]?.id ?? "");
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [rewardNote, setRewardNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Demo modda sunucuya kalıcı yazılamaz: durum değişimlerini yerel tut
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ReferralStatus>>({});
  const allReferrals = referrals.map((r) =>
    statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] } : r
  );
  const converted = allReferrals.filter((r) => r.status === "kayit").length;

  const create = () => {
    if (busy) return;
    setError(null);
    if (!referrerContactId || !newLeadName.trim()) {
      setError("Getiren veli ve yeni aday adı zorunlu.");
      return;
    }
    setBusy(true);
    fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrerContactId, newLeadName, newLeadPhone, rewardNote }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setError(d.error ?? "Kaydedilemedi");
          setBusy(false);
          return;
        }
        if (d.persisted) {
          router.refresh();
        } else {
          setNewLeadName("");
          setNewLeadPhone("");
          setRewardNote("");
          setBusy(false);
          setNotice("Demo modda kaydedildi — Supabase bağlandığında kalıcı olacak.");
        }
      })
      .catch(() => {
        setError("Sunucuya ulaşılamadı");
        setBusy(false);
      });
  };

  const setStatus = (id: string, status: ReferralStatus) => {
    fetch(`/api/referrals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.persisted) {
          router.refresh();
        } else {
          setStatusOverrides((prev) => ({ ...prev, [id]: status }));
          setNotice("Demo modda güncellendi — kalıcı değildir.");
        }
      })
      .catch(() => {
        setNotice(null);
        setError("Durum güncellenemedi — sunucuya ulaşılamadı.");
      });
  };

  return (
    <PageShell>
      <PageHeader
        title="Arkadaşını Getir"
        description="Mevcut veli ağlığından yeni öğrenci — referans takibi ve ödül yönetimi."
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      <SectionCard title="Yeni Referans Ekle" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-label-xs text-label-xs text-on-surface-variant">Getiren veli</span>
            <select
              className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
              onChange={(e) => setReferrerContactId(e.target.value)}
              value={referrerContactId}
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-xs text-label-xs text-on-surface-variant">Yeni aday adı</span>
            <input
              className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
              onChange={(e) => setNewLeadName(e.target.value)}
              placeholder="örn. Deniz Aksoy"
              type="text"
              value={newLeadName}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-xs text-label-xs text-on-surface-variant">Telefon</span>
            <input
              className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
              onChange={(e) => setNewLeadPhone(e.target.value)}
              placeholder="+90 5XX XXX XX XX"
              type="text"
              value={newLeadPhone}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-xs text-label-xs text-on-surface-variant">Ödül notu</span>
            <input
              className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
              onChange={(e) => setRewardNote(e.target.value)}
              placeholder="örn. Kayıt halinde 1 ay indirim"
              type="text"
              value={rewardNote}
            />
          </label>
        </div>
        {error ? (
          <p className="mt-2 font-label-sm text-label-sm font-semibold text-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className={clsx(
            "mt-3 flex h-10 items-center gap-2 rounded-xl bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary",
            busy && "opacity-60"
          )}
          disabled={busy}
          type="button"
          onClick={create}
        >
          <span className={clsx("material-symbols-outlined text-[16px]", busy && "animate-spin")}>
            {busy ? "refresh" : "group_add"}
          </span>
          Kaydet
        </button>
      </SectionCard>

      {!live ? (
        <p className="font-label-xs text-label-xs text-outline">Demo mod — kayıtlar kalıcı olmayabilir.</p>
      ) : null}

      {notice ? (
        <p
          className="flex items-center gap-2 rounded-lg bg-secondary-container/50 px-3 py-2 font-label-sm text-label-sm text-on-secondary-container"
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

      <div className="flex items-center gap-3 font-label-sm text-label-sm text-on-surface-variant">
        <span>{allReferrals.length} referans</span>
        <span>·</span>
        <span className="font-semibold text-secondary">{converted} kayda dönüştü</span>
      </div>

      {allReferrals.length === 0 ? (
        <EmptyState
          description="Mevcut velilerinizden getirecekleri adayları buradan takip edin."
          icon="card_giftcard"
          title="Henüz referans yok"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {allReferrals.map((referral) => (
            <div
              key={referral.id}
              className="flex flex-col gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                    {referral.new_lead_name}
                  </p>
                  <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                    Getiren: {referral.referrerName} · {referral.new_lead_phone ?? "—"}
                  </p>
                </div>
                <span className={clsx("shrink-0 rounded-full px-2.5 py-1 font-label-xs text-label-xs font-semibold", STATUS_STYLE[referral.status])}>
                  {STATUS_LABEL[referral.status]}
                </span>
              </div>
              {referral.reward_note ? (
                <p className="font-label-xs text-label-xs text-on-surface-variant">
                  Ödül: {referral.reward_note}
                </p>
              ) : null}
              <div className="flex gap-1.5 pt-1">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    className={clsx(
                      "h-8 flex-1 rounded-lg border font-label-xs text-label-xs transition-colors",
                      referral.status === status
                        ? STATUS_STYLE[status]
                        : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                    )}
                    type="button"
                    onClick={() => setStatus(referral.id, status)}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
