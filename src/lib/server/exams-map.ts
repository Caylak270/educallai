/**
 * Supabase exam_results → Deneme Analizi ekran modeli.
 * Öğrenci başına sınav geçmişi gruplanır; net trendi, kategori etiketi ve
 * sparkline koordinatları türetilir (viewBox 60x16).
 */

import type {
  ExamSegment,
  ExamsView,
  HighlightView,
  RosterStudent,
  SubjectNet,
} from "@/lib/mock/exams";
import type { Contact, ExamCategory, ExamResult } from "@/lib/types/db";

/** Sınav kategorisi → segment kartı kimliği (mock examSegments ile aynı). */
const SEGMENT_BY_CATEGORY: Record<ExamCategory, string> = {
  DECLINING: "dusus-alarmi",
  RISING: "yukselenler",
  TOP_PERFORMER: "zirve-ogrenciler",
  PLATEAU: "plato-sikisanlar",
  FIRST_TIMER: "ilk-deneme",
};

const CATEGORY: Record<
  ExamCategory,
  { badge: string; badgeClass: string; actionLabel: string; actionIcon: string; actionIconClass: string; buttonClass: string }
> = {
  RISING: {
    badge: "Yükselen",
    badgeClass: "bg-secondary-container text-secondary",
    actionLabel: "Tebrik Araması",
    actionIcon: "phone",
    actionIconClass: "text-secondary",
    buttonClass: "bg-surface-container hover:bg-secondary-container hover:text-on-secondary-container text-on-surface",
  },
  DECLINING: {
    badge: "Düşüşte",
    badgeClass: "bg-error-container text-error",
    actionLabel: "Müdahale Araması",
    actionIcon: "support_agent",
    actionIconClass: "text-on-primary",
    buttonClass: "bg-primary-container text-on-primary hover:bg-primary",
  },
  PLATEAU: {
    badge: "Plato",
    badgeClass: "bg-tertiary-container text-tertiary-container",
    actionLabel: "Motivasyon Araması",
    actionIcon: "record_voice_over",
    actionIconClass: "text-tertiary",
    buttonClass: "bg-surface-container hover:bg-tertiary-container hover:text-on-tertiary-container text-on-surface",
  },
  TOP_PERFORMER: {
    badge: "Zirve",
    badgeClass: "bg-secondary-container text-secondary",
    actionLabel: "Tebrik Araması",
    actionIcon: "phone",
    actionIconClass: "text-secondary",
    buttonClass: "bg-surface-container hover:bg-secondary-container hover:text-on-secondary-container text-on-surface",
  },
  FIRST_TIMER: {
    badge: "İlk Sınav",
    badgeClass: "bg-surface-container-high text-on-surface-variant",
    actionLabel: "Karşılama Araması",
    actionIcon: "waving_hand",
    actionIconClass: "text-primary",
    buttonClass: "bg-surface-container hover:bg-primary-container hover:text-on-primary text-on-surface",
  },
};

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toLocaleUpperCase("tr") ?? "")
      .join("") || "Ö"
  );
}

function sparkline(nets: number[]): RosterStudent["sparkline"] {
  if (nets.length < 2) {
    return { points: "2,8 58,8", color: "#006b5f", endX: 58, endY: 8 };
  }
  const min = Math.min(...nets);
  const max = Math.max(...nets);
  const span = max - min || 1;
  const pts = nets.map((n, i) => {
    const x = 2 + (56 * i) / (nets.length - 1);
    const y = 14 - ((n - min) / span) * 12;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1].split(",");
  return {
    points: pts.join(" "),
    color: "#006b5f",
    endX: Number(last[0]),
    endY: Number(last[1]),
  };
}

export type { ExamsView };

/** Canlı exam_results satırlarını segment şeridi + öğrenci listesine çevirir. */
export function buildExamsView(rows: ExamResult[], contacts: Contact[]): ExamsView {
  const byContact = new Map(contacts.map((c) => [c.id, c]));

  // Öğrenci başına sınav geçmişi
  const grouped = new Map<string, ExamResult[]>();
  for (const row of rows) {
    const list = grouped.get(row.contact_id) ?? [];
    list.push(row);
    grouped.set(row.contact_id, list);
  }

  const segmentCounts: Record<string, number> = {
    DECLINING: 0, RISING: 0, TOP_PERFORMER: 0, PLATEAU: 0, FIRST_TIMER: 0,
  };

  const roster: RosterStudent[] = [...grouped.entries()]
    .map(([contactId, exams]) => {
      const sorted = [...exams].sort(
        (a, b) =>
          new Date(a.exam_date ?? 0).getTime() - new Date(b.exam_date ?? 0).getTime()
      );
      const nets = sorted.map((e) => Number(e.total_net ?? 0));
      const last = sorted[sorted.length - 1];
      const prev = nets.length > 1 ? nets[nets.length - 2] : null;
      const delta = prev !== null ? nets[nets.length - 1] - prev : 0;
      // Kategorisi boş satırlar plato bandında değerlendirilir (arayüzdeki
      // "Plato" rozetiyle tutarlı olması için).
      const category = (last.category ?? "PLATEAU") as ExamCategory;
      const cat = CATEGORY[category] ?? CATEGORY.PLATEAU;
      segmentCounts[category] = (segmentCounts[category] ?? 0) + 1;
      const contact = byContact.get(contactId);
      const name = contact?.student_name ?? last.student_name ?? "Öğrenci";
      const rising = delta > 0;

      return {
        id: last.id,
        initials: initialsOf(name),
        avatarClass: "bg-secondary-container text-on-secondary-container",
        name,
        badge: cat.badge,
        badgeClass: cat.badgeClass,
        meta: [contact?.student_grade, contact?.exam_type].filter(Boolean).join(" • ") || "—",
        segmentKey: SEGMENT_BY_CATEGORY[category],
        phone: contact?.phone ?? undefined,
        net: (nets[nets.length - 1] ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 }),
        trend: {
          icon: rising ? "trending_up" : delta < 0 ? "trending_down" : "trending_flat",
          label: `${delta >= 0 ? "+" : ""}${delta.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`,
          className: delta > 0 ? "text-secondary" : delta < 0 ? "text-error" : "text-on-surface-variant",
        },
        sparkline: sparkline(nets),
        action: {
          icon: cat.actionIcon,
          iconClass: cat.actionIconClass,
          label: cat.actionLabel,
          buttonClass: cat.buttonClass,
          toast: {
            student: name,
            parent: contact?.parent_name ?? "Veli",
          },
        },
      } satisfies RosterStudent;
    })
    // En çok konuşulacak öğrenciler önce: düşüşte/yükselenler öne
    .sort((a, b) => {
      const rank = (s: RosterStudent) =>
        s.badge === "Düşüşte" ? 0 : s.badge === "Yükselen" ? 1 : s.badge === "Plato" ? 2 : 3;
      return rank(a) - rank(b);
    });

  // Kart sırası ve kimlikleri mock examSegments ile aynı — segment filtresi
  // roster.segmentKey üzerinden bu kartlara bağlanır.
  const segments: ExamSegment[] = [
    {
      id: "dusus-alarmi",
      icon: "trending_down",
      iconClass: "text-error",
      badge: "Düşüşte",
      badgeClass: "bg-error-container text-error",
      count: String(segmentCounts.DECLINING ?? 0),
      unit: "Öğrenci",
      statusLabel: "Acil veli araması planlandı",
      statusClass: "text-error",
      description: "Net kaybı yaşayan, müdahale gereken öğrenciler.",
      footerLabel: "İncele",
      footerClass: "text-error",
      pulseDot: true,
    },
    {
      id: "yukselenler",
      icon: "trending_up",
      iconClass: "text-secondary",
      badge: "Yükselenler",
      badgeClass: "bg-secondary-container text-secondary",
      count: String(segmentCounts.RISING ?? 0),
      unit: "Öğrenci",
      statusLabel: "Tebrik araması önerilir",
      statusClass: "text-secondary",
      description: "Son denemesinde net artışı kaydeden öğrenciler.",
      footerLabel: "Listeyi Gör",
      footerClass: "text-primary",
    },
    {
      id: "zirve-ogrenciler",
      icon: "workspace_premium",
      iconClass: "text-primary",
      badge: "Zirve",
      badgeClass: "bg-primary-fixed text-primary",
      count: String(segmentCounts.TOP_PERFORMER ?? 0),
      unit: "Öğrenci",
      statusLabel: "Derece koçluğu önerilir",
      statusClass: "text-primary",
      description: "Yüksek net bandındaki, derece adayı öğrenciler.",
      footerLabel: "Listeyi Gör",
      footerClass: "text-primary",
    },
    {
      id: "plato-sikisanlar",
      icon: "trending_flat",
      iconClass: "text-tertiary",
      badge: "Plato",
      badgeClass: "bg-tertiary-container text-tertiary-container",
      count: String(segmentCounts.PLATEAU ?? 0),
      unit: "Öğrenci",
      statusLabel: "Motivasyon araması kuyruğunda",
      statusClass: "text-tertiary",
      description: "Gelişimi durağanlaşan öğrenciler.",
      footerLabel: "Listeyi Gör",
      footerClass: "text-primary",
    },
    {
      id: "ilk-deneme",
      icon: "waving_hand",
      iconClass: "text-primary",
      badge: "İlk Sınav",
      badgeClass: "bg-surface-container-high text-on-surface-variant",
      count: String(segmentCounts.FIRST_TIMER ?? 0),
      unit: "Öğrenci",
      statusLabel: "Karşılama araması bekliyor",
      statusClass: "text-on-surface-variant",
      description: "İlk denemesini yeni tamamlanan öğrenciler.",
      footerLabel: "Listeyi Gör",
      footerClass: "text-primary",
    },
  ];

  return { segments, roster };
}

/** Sınav için kısa grafik etiketi: sınav adı ya da tarih (AA/GG). */
function shortExamLabel(row: ExamResult): string {
  if (row.exam_name) {
    return row.exam_name.length > 8 ? row.exam_name.slice(0, 8) : row.exam_name;
  }
  if (row.exam_date) return row.exam_date.slice(5).replaceAll("-", "/");
  return "—";
}

function numberOf(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * En büyük net düşüşüne sahip öğrenciyi seçip detay kartı verisini kurar.
 * Düşüş yaşayan öğrenci yoksa null döner — kart mock veriye düşer.
 */
export function pickHighlightView(
  rows: ExamResult[],
  contacts: Contact[]
): HighlightView | null {
  const byContact = new Map(contacts.map((c) => [c.id, c]));

  // Öğrenci başına kronolojik sınav geçmişi
  const grouped = new Map<string, ExamResult[]>();
  for (const row of rows) {
    const list = grouped.get(row.contact_id) ?? [];
    list.push(row);
    grouped.set(row.contact_id, list);
  }

  let worst: { contactId: string; exams: ExamResult[]; delta: number } | null = null;
  for (const [contactId, exams] of grouped) {
    const sorted = [...exams].sort(
      (a, b) =>
        new Date(a.exam_date ?? 0).getTime() - new Date(b.exam_date ?? 0).getTime()
    );
    if (sorted.length < 2) continue;
    const nets = sorted.map((e) => Number(e.total_net ?? 0));
    const delta = nets[nets.length - 1] - nets[nets.length - 2];
    if (!worst || delta < worst.delta) worst = { contactId, exams: sorted, delta };
  }
  // Hiç kimse düşmediyse canlı vurgu üretilmez.
  if (!worst || worst.delta >= 0) return null;

  const sorted = worst.exams;
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const contact = byContact.get(worst.contactId);
  const name = contact?.student_name ?? last.student_name ?? "Öğrenci";

  const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  const netsAll = sorted.map((e) => Number(e.total_net ?? 0));
  const nets = netsAll.slice(-10);
  const examNames = sorted.slice(-10).map(shortExamLabel);

  // Son sınavın ders netleri + bir önceki sınavla karşılaştırma
  const subjectDefs: Array<{
    key: "math_net" | "science_net" | "turkish_net" | "social_net";
    name: string;
    bar: string;
  }> = [
    { key: "turkish_net", name: "Türkçe", bar: "bg-surface-variant" },
    { key: "math_net", name: "Matematik", bar: "bg-primary-container" },
    { key: "science_net", name: "Fen Bilimleri", bar: "bg-secondary" },
    { key: "social_net", name: "Sosyal Bilg.", bar: "bg-surface-variant" },
  ];
  const subjects: SubjectNet[] = [];
  for (const def of subjectDefs) {
    const current = numberOf(last[def.key]);
    if (current === null) continue;
    const previous = numberOf(prev[def.key]);
    const diff = previous !== null ? current - previous : null;
    subjects.push({
      name: def.name,
      // Canlı veride soru sayısı kolonu yok — arayüz bu alanı gizler.
      questions: "",
      net: fmt(current),
      delta:
        diff === null ? "—" : `${diff >= 0 ? "+" : ""}${fmt(diff)} Net`,
      deltaClass:
        diff === null ? "text-on-surface-variant" : diff >= 0 ? "text-secondary" : "text-error",
      barClass: def.bar,
    });
  }

  return {
    name,
    initials: initialsOf(name),
    meta: [contact?.student_grade, contact?.exam_type].filter(Boolean).join(" • ") || "—",
    net: fmt(netsAll[netsAll.length - 1] ?? 0),
    deltaLabel: `${worst.delta >= 0 ? "+" : ""}${fmt(worst.delta)}`,
    deltaDown: worst.delta < 0,
    nets,
    examNames,
    subjects,
    parentName: contact?.parent_name ?? null,
    phone: contact?.phone ?? null,
  };
}
