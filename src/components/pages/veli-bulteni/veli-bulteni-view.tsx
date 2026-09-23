"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintSectionButton } from "@/components/ui/print-section-button";
import type { BulletinBundle, StudentBulletin } from "@/lib/server/bulletin-map";
import { renderBulletin } from "@/lib/server/bulletin-map";

function BulletinEditor({
  student,
  dershaneName,
}: {
  student: StudentBulletin;
  dershaneName: string;
}) {
  const [text, setText] = useState(() => renderBulletin(student, "", dershaneName));
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const waDigits = (student.parentPhone.match(/\d/g) ?? []).join("");
  const waFull = waDigits.startsWith("90") ? waDigits : `90${waDigits.replace(/^0/, "")}`;
  const waLink = waDigits.length >= 10 ? `https://wa.me/${waFull}?text=${encodeURIComponent(text)}` : null;

  const copy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        setCopied(false);
        setCopyFailed(true);
        setTimeout(() => setCopyFailed(false), 2500);
      });
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        className="min-h-64 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 font-body-md text-body-md leading-relaxed text-on-surface focus:border-primary focus:outline-none"
        onChange={(e) => setText(e.target.value)}
        value={text}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 px-4 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          type="button"
          onClick={copy}
        >
          <span className="material-symbols-outlined text-[18px]">
            {copied ? "check" : copyFailed ? "error" : "content_copy"}
          </span>
          {copied ? "Kopyalandı" : copyFailed ? "Kopyalanamadı" : "Kopyala"}
        </button>
        {waLink ? (
          <a
            className="flex h-10 items-center gap-1.5 rounded-xl bg-secondary-container px-4 font-label-md text-label-md font-semibold text-on-secondary-container transition-colors hover:bg-secondary"
            href={waLink}
            rel="noreferrer"
            target="_blank"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            WhatsApp ile Gönder
          </a>
        ) : (
          <span className="font-label-xs text-label-xs text-outline">Veli telefonu kayıtsız</span>
        )}
        <PrintSectionButton
          ariaLabel="Yalnızca bülten kartını yazdır"
          className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 px-4 font-label-md text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          targetId="bulten-karti"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          Yazdır
        </PrintSectionButton>
      </div>
      <p className="font-label-xs text-label-xs text-outline">
        Metni düzenleyebilirsiniz — kopyala/WhatsApp gönder her zaman son hali kullanır.
      </p>
    </div>
  );
}

export function VeliBulteniView({
  bundle,
  live,
  sourceLabel,
}: {
  bundle: BulletinBundle;
  live: boolean;
  sourceLabel?: string;
}) {
  const [selectedId, setSelectedId] = useState(bundle.students[0]?.contactId ?? null);
  const selected = bundle.students.find((s) => s.contactId === selectedId) ?? bundle.students[0] ?? null;

  return (
    <PageShell>
      <PageHeader
        title="Veli Bülteni"
        description="Deneme sonucu, devam durumu ve beceri karnesini birleştiren haftalık veli mesajı üreticisi."
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {bundle.students.length === 0 ? (
        <EmptyState
          description="Bülten için öğrenci verisi bekleniyor."
          icon="mail"
          title="Öğrenci kaydı yok"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
            {bundle.students.map((student) => (
              <button
                key={student.contactId}
                className={clsx(
                  "shrink-0 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  student.contactId === selected?.contactId
                    ? "border-primary bg-primary-fixed/40"
                    : "border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low"
                )}
                type="button"
                onClick={() => setSelectedId(student.contactId)}
              >
                <span className="block font-label-sm text-label-sm font-semibold text-on-surface">
                  {student.studentName}
                </span>
                <span className="block font-label-xs text-label-xs text-on-surface-variant">
                  {student.parentName}
                </span>
              </button>
            ))}
          </div>

          {selected ? (
            <div
              className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5"
              id="bulten-karti"
            >
              <BulletinEditor key={selected.contactId} dershaneName={bundle.dershaneName} student={selected} />
            </div>
          ) : null}
          {!live ? (
            <p className="font-label-xs text-label-xs text-outline">Demo mod</p>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
