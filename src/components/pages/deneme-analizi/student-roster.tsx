"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";
import {
  examSegments,
  rosterHeader,
  rosterStudents,
  SEGMENT_LABELS,
  type ExamSegment,
  type RosterStudent,
} from "@/lib/mock/exams";
import { AiCallToastButton } from "./call-buttons";

type SortKey = "net" | "delta" | "name";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "net", label: "Net (Azalan)" },
  { key: "delta", label: "Değişim (Azalan)" },
  { key: "name", label: "İsim" },
];

/** Net metni sayıya çevirir (hem "88.25" hem "88,25" biçimlerini destekler). */
function netValue(student: RosterStudent): number {
  return Number.parseFloat(student.net.replace(",", ".")) || 0;
}

/** Trend etiketini sayıya çevirir ("+6.50" / "-9.00" / "±0.00"). */
function deltaValue(student: RosterStudent): number {
  const value = Number.parseFloat(student.trend.label.replace("±", "").replace(",", "."));
  return Number.isNaN(value) ? 0 : value;
}

function Sparkline({ student }: { student: RosterStudent }) {
  return (
    <svg className="h-4 w-16 overflow-visible" viewBox="0 0 60 16">
      <polyline
        fill="none"
        points={student.sparkline.points}
        stroke={student.sparkline.color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx={student.sparkline.endX} cy={student.sparkline.endY} fill={student.sparkline.color} r="2" />
    </svg>
  );
}

function StudentCard({ student }: { student: RosterStudent }) {
  const toast = student.action.toast;
  const button = (
    <>
      <span className={clsx("material-symbols-outlined text-[15px]", student.action.iconClass)}>
        {student.action.icon}
      </span>
      <span>{student.action.label}</span>
    </>
  );

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 transition-colors hover:border-outline-variant">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-label-md text-label-md font-bold",
              student.avatarClass
            )}
          >
            {student.initials}
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-headline-sm text-headline-sm font-bold text-on-surface">
                {student.name}
              </span>
              <span
                className={clsx(
                  "rounded-md px-1.5 py-0.5 font-label-xs text-label-xs font-bold",
                  student.badgeClass
                )}
              >
                {student.badge}
              </span>
            </div>
            <span className="truncate font-label-xs text-label-xs text-on-surface-variant">{student.meta}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-headline-md text-headline-md font-bold leading-tight text-on-surface">
            {student.net}
          </span>
          <span
            className={clsx(
              "flex items-center justify-end font-label-xs text-label-xs font-bold",
              student.trend.className
            )}
          >
            <span className="material-symbols-outlined text-[13px]">{student.trend.icon}</span>{" "}
            {student.trend.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/50 pt-2.5">
        {/* Son 5 sınav mini sparkline */}
        <div className="flex items-center gap-2">
          <span className="font-label-xs text-label-xs text-on-surface-variant">Son 5:</span>
          <Sparkline student={student} />
        </div>

        {/* Aksiyon: telefonu olan öğrencide gerçek AI araması, telefonu olmayanda
            veli CRM araması (/veliler?q=<ad>); ikisi de yoksa buton render edilmez. */}
        {toast || student.phone ? (
          <AiCallToastButton
            className={clsx(
              "flex items-center gap-1 rounded-lg px-2.5 py-1 font-label-xs text-label-xs font-semibold transition-colors",
              student.action.buttonClass
            )}
            fallbackHref={`/veliler?q=${encodeURIComponent(student.name)}`}
            message={{
              title: `${student.name} • Veli Aranıyor`,
              description: `${toast?.parent ?? "Veli"} aranarak deneme analizi aktarılıyor...`,
            }}
            name={toast?.parent ?? student.name}
            phone={student.phone}
          >
            {button}
          </AiCallToastButton>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Tüm öğrenci listesi: arama, segment filtresi ve sıralama çalışır;
 * segment filtresi SegmentStrip ile aynı state'i paylaşır (tek kaynak).
 */
export function StudentRoster({
  students,
  segments,
  activeSegment = null,
  onSegmentChange,
}: {
  students?: RosterStudent[];
  segments?: ExamSegment[];
  activeSegment?: string | null;
  onSegmentChange?: (segmentId: string | null) => void;
}) {
  const items = students ?? rosterStudents;
  const segmentList = segments ?? examSegments;

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey | null>(null);
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | null>(null);
  const menuRootRef = useRef<HTMLDivElement | null>(null);

  // Menü dışına tıklayınca açılır menüyü kapat
  useEffect(() => {
    if (!openMenu) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRootRef.current && !menuRootRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openMenu]);

  // Segment filtresi + arama + sıralama (tek geçişte birleşik)
  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  let visible = items;
  if (activeSegment) {
    visible = visible.filter((s) => s.segmentKey === activeSegment);
  }
  if (normalizedQuery) {
    // Ad, numara ve sınıf meta alanında birlikte aranır
    visible = visible.filter((s) =>
      `${s.name} ${s.meta}`.toLocaleLowerCase("tr").includes(normalizedQuery)
    );
  }
  if (sort === "net") {
    visible = [...visible].sort((a, b) => netValue(b) - netValue(a));
  } else if (sort === "delta") {
    visible = [...visible].sort((a, b) => deltaValue(b) - deltaValue(a));
  } else if (sort === "name") {
    visible = [...visible].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  return (
    <section className="flex flex-col gap-3">
      {/* Başlık ve arama / filtre şeridi */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
            {rosterHeader.title}
          </h2>
          {/* Filtre/arama sonrası gerçek öğrenci sayısı */}
          <span className="font-label-xs text-label-xs text-on-surface-variant">
            {visible.length} öğrenci
          </span>
        </div>
        <div className="relative flex items-center gap-1.5" ref={menuRootRef}>
          {/* Segment filtresi */}
          <button
            aria-expanded={openMenu === "filter"}
            aria-haspopup="listbox"
            aria-label="Filtrele"
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-xl border bg-surface-container-lowest transition-colors hover:bg-surface-container-low",
              activeSegment
                ? "border-primary text-primary"
                : "border-outline-variant/60 text-on-surface-variant"
            )}
            type="button"
            onClick={() => setOpenMenu((cur) => (cur === "filter" ? null : "filter"))}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
          </button>
          {/* Sıralama */}
          <button
            aria-expanded={openMenu === "sort"}
            aria-haspopup="listbox"
            aria-label="Sırala"
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-xl border bg-surface-container-lowest transition-colors hover:bg-surface-container-low",
              sort
                ? "border-primary text-primary"
                : "border-outline-variant/60 text-on-surface-variant"
            )}
            type="button"
            onClick={() => setOpenMenu((cur) => (cur === "sort" ? null : "sort"))}
          >
            <span className="material-symbols-outlined text-[18px]">swap_vert</span>
          </button>

          {openMenu === "filter" ? (
            <ul
              aria-label="Segment filtresi"
              className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-1 shadow-lg"
            >
              <li>
                <button
                  aria-pressed={!activeSegment}
                  className={clsx(
                    "flex w-full items-center justify-between px-4 py-2 text-left font-label-md text-label-md transition-colors hover:bg-surface-container-low",
                    !activeSegment ? "font-bold text-primary" : "text-on-surface"
                  )}
                  type="button"
                  onClick={() => {
                    onSegmentChange?.(null);
                    setOpenMenu(null);
                  }}
                >
                  Tümü
                  {!activeSegment ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : null}
                </button>
              </li>
              {segmentList.map((segment) => {
                const active = activeSegment === segment.id;
                return (
                  <li key={segment.id}>
                    <button
                      aria-pressed={active}
                      className={clsx(
                        "flex w-full items-center justify-between px-4 py-2 text-left font-label-md text-label-md transition-colors hover:bg-surface-container-low",
                        active ? "font-bold text-primary" : "text-on-surface"
                      )}
                      type="button"
                      onClick={() => {
                        onSegmentChange?.(active ? null : segment.id);
                        setOpenMenu(null);
                      }}
                    >
                      {SEGMENT_LABELS[segment.id] ?? segment.badge}
                      {active ? (
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {openMenu === "sort" ? (
            <ul
              aria-label="Sıralama"
              className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-1 shadow-lg"
            >
              {SORT_OPTIONS.map((option) => {
                const active = sort === option.key;
                return (
                  <li key={option.key}>
                    <button
                      aria-pressed={active}
                      className={clsx(
                        "flex w-full items-center justify-between px-4 py-2 text-left font-label-md text-label-md transition-colors hover:bg-surface-container-low",
                        active ? "font-bold text-primary" : "text-on-surface"
                      )}
                      type="button"
                      onClick={() => {
                        // Aynı seçenek tekrar seçilirse varsayılan sıraya dön
                        setSort((cur) => (cur === option.key ? null : option.key));
                        setOpenMenu(null);
                      }}
                    >
                      {option.label}
                      {active ? (
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Hızlı arama girişi */}
      <div className="relative w-full">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
          search
        </span>
        <input
          className="h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-10 pr-4 font-label-md text-label-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={rosterHeader.searchPlaceholder}
          type="text"
          value={query}
        />
      </div>

      {/* Öğrenci kartları */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-outline-variant/60 p-6 text-center font-label-md text-label-md text-on-surface-variant">
          Filtreye uyan öğrenci yok.
        </p>
      )}
    </section>
  );
}
