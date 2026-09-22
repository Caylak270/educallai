/**
 * Supabase leads/contacts/signals → CRM kanban görüntü modeli eşlemesi.
 * Mock Lead tipini (src/lib/mock/leads.ts) birebir üretir; renk kalıpları
 * lead sıcaklığına ve aşamasına göre deterministik seçilir.
 */

import type { Lead } from "@/lib/mock/leads";
import type { LiveLeadRow } from "./queries";

/* ── Aşama eşlemeleri (db ↔ kanban id) ──────────────────────── */

const STAGE_TR: Record<string, string> = {
  yeni: "Yeni",
  iletisim: "İletişim",
  ilgilendi: "İlgilendi",
  randevu: "Randevu Alındı",
  ziyaret: "Ziyaret",
  kayit: "Kayıt",
  kaybedildi: "Kaybedildi",
};

const DB_STAGE_TO_KANBAN: Record<string, string> = {
  new: "yeni",
  contacted: "iletisim",
  interested: "ilgilendi",
  appointment_set: "randevu",
  visited: "ziyaret",
  enrolled: "kayit",
  lost: "kaybedildi",
};

const SENTIMENT_TR: Record<string, string> = {
  positive: "Pozitif",
  neutral: "Nötr",
  negative: "Olumsuz",
};

const INTENT_TR: Record<string, string> = {
  kayit_talebi: "kayıt talebi",
  fiyat_sorusu: "fiyat sorusu",
  deneme_istegi: "deneme isteği",
  randevu_talebi: "randevu talebi",
  test_gorusmesi: "test görüşmesi",
  diger: "diğer",
};

const HEAT_STYLES: Record<
  string,
  { icon: string; iconClass: string; label: string; pill: string }
> = {
  hot: {
    icon: "local_fire_department",
    iconClass: "text-error",
    label: "Sıcak Lead",
    pill: "bg-tertiary-container/15 text-tertiary-container",
  },
  warm: {
    icon: "wb_sunny",
    iconClass: "text-tertiary",
    label: "Ilık Lead",
    pill: "bg-secondary-container/30 text-on-secondary-container",
  },
  cold: {
    icon: "ac_unit",
    iconClass: "text-primary",
    label: "Soğuk Lead",
    pill: "bg-surface-container text-on-surface-variant",
  },
  lost: {
    icon: "block",
    iconClass: "text-outline",
    label: "Kaybedildi",
    pill: "bg-surface-container text-on-surface-variant",
  },
};

const AVATAR_STYLES: Record<string, string> = {
  hot: "bg-primary-fixed text-primary",
  warm: "bg-secondary-fixed-dim/40 text-on-secondary-fixed",
  cold: "bg-surface-container-high text-on-surface-variant",
  lost: "bg-surface-container-high text-on-surface-variant",
};

const CHANNEL_STYLES: Record<
  string,
  { icon: string; label: string; badgeClass: string }
> = {
  outbound_call: { icon: "call_made", label: "Giden Arama", badgeClass: "bg-primary-container" },
  inbound_call: { icon: "call_received", label: "Gelen Arama", badgeClass: "bg-primary-container" },
  whatsapp: { icon: "forum", label: "WhatsApp", badgeClass: "bg-secondary-container" },
  instagram: { icon: "photo_camera", label: "Instagram", badgeClass: "bg-tertiary-container" },
  referral: { icon: "group_add", label: "Referans", badgeClass: "bg-secondary-container" },
};

function relativeLabel(iso: string | null): string {
  if (!iso) return "—";
  const diffMin = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (diffMin < 60) return `${diffMin} dk önce`;
  if (diffMin < 24 * 60) return `${Math.round(diffMin / 60)} saat önce`;
  return `${Math.round(diffMin / (24 * 60))} gün önce`;
}

function whenClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase("tr") ?? "")
    .join("");
}

function durationLabel(sec: number | null): string {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)} dk ${sec % 60} sn`;
}

/** Tek lead satırının filtre chip etiketleri — computeChipCounts ile aynı mantık. */
export function chipTagsOfRow(row: LiveLeadRow): string[] {
  const yksTypes = ["YKS", "TYT", "AYT"];
  const examType = (row.contact?.exam_type ?? "").toUpperCase();
  const tags: string[] = [];
  if (row.temperature === "hot") tags.push("hot");
  if (yksTypes.includes(examType)) tags.push("yks");
  if (examType === "LGS") tags.push("lgs");
  if (row.next_follow_up && new Date(row.next_follow_up) < new Date())
    tags.push("delayed");
  if ((row.signals?.length ?? 0) === 0) tags.push("waiting");
  return tags;
}

/** Canlı lead sayıları — filtre chip sayaçları için. */
export function computeChipCounts(rows: LiveLeadRow[]): Record<string, number> {
  const counts: Record<string, number> = { all: rows.length };
  for (const row of rows) {
    for (const tag of chipTagsOfRow(row)) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

/** Canlı lead satırlarını CRM kanban kart modeline çevirir. */
export function buildLeadsView(rows: LiveLeadRow[]): Lead[] {
  return rows.map((row) => {
    const temp = row.temperature ?? "cold";
    const heat = HEAT_STYLES[temp] ?? HEAT_STYLES.cold;
    const contact = row.contact;
    const name = contact?.parent_name ?? "İsimsiz Veli";
    const studentName = contact?.student_name ?? "—";
    const classTag = contact?.student_grade ?? "—";
    const program = contact?.exam_type ?? "";
    const channel =
      CHANNEL_STYLES[contact?.source ?? "inbound_call"] ??
      CHANNEL_STYLES.inbound_call;
    const signals = row.signals ?? [];
    const lastSignal = signals[0];
    const score = row.score ?? 0;
    const ringClass = score >= 80 ? "text-secondary" : score >= 50 ? "text-primary" : "text-outline";
    const sentimentClass =
      lastSignal?.sentiment === "positive"
        ? "bg-secondary/15 text-secondary"
        : lastSignal?.sentiment === "negative"
          ? "bg-error-container text-on-error-container"
          : "bg-surface-container text-on-surface-variant";

    const timeline = signals.slice(0, 3).map((s, i) => ({
      icon: "call",
      dotClass: i === 0 ? "bg-primary" : "bg-primary/60",
      iconClass: i === 0 ? "text-on-primary" : "text-on-primary/80",
      title: "AI Sesli Görüşme Tamamlandı",
      time: whenClock(s.created_at),
      desc: `Süre: ${durationLabel(s.duration_seconds)} · ${
        INTENT_TR[s.intent ?? "diger"] ?? "genel görüşme"
      }${s.recommend_handoff ? " · Danışmana önerildi" : ""}.`,
    }));

    const summaryText =
      contact?.contact_summary?.trim() ||
      (lastSignal?.transcript
        ? lastSignal.transcript.replace(/^(Veli|Asistan):\s*/gm, "").slice(0, 160)
        : "");

    return {
      id: row.id,
      stage: DB_STAGE_TO_KANBAN[row.stage] ?? "yeni",
      chipTags: chipTagsOfRow(row),
      initials: initialsOf(name) || "V",
      avatarClass: AVATAR_STYLES[temp] ?? AVATAR_STYLES.cold,
      badgeIcon: channel.icon,
      badgeClass: channel.badgeClass,
      badgeIconClass: "text-on-primary",
      name,
      role: "Veli",
      student: studentName,
      studentClass: [classTag, program].filter(Boolean).join(" (") + (program ? ")" : ""),
      studentClassClass: temp === "hot" ? "text-primary" : "text-secondary",
      score,
      ringClass,
      scoreLabelClass: ringClass,
      heatIcon: heat.icon,
      heatIconClass: heat.iconClass,
      heatLabel: heat.label,
      heatPillClass: heat.pill,
      channelIcon: channel.icon,
      channelIconClass: "text-secondary",
      channelLabel: channel.label,
      time: relativeLabel(row.last_contact_at ?? row.updated_at),
      insight: summaryText ? `"${summaryText}"` : '"Henüz görüşme kaydı yok."',
      actions: [
        {
          icon: "record_voice_over",
          label: "Şimdi Ara (AI Asistan)",
          style: "primary" as const,
          message: "AI Voice Bot araması başlatılıyor...",
        },
        {
          icon: "chat",
          label: "WhatsApp",
          style: "neutral" as const,
          message: "WhatsApp konuşması açılıyor...",
        },
      ],
      drawer: {
        phone: contact?.phone ?? "—",
        studentName,
        studentClass: [classTag, program].filter(Boolean).join(" "),
        scoreBadge: {
          text: `Lead Puanı: ${score}/100`,
          className: "bg-secondary-fixed text-on-secondary-fixed",
        },
        heatPill: {
          text: heat.label.split(" ")[0],
          icon: heat.icon,
          iconClass: heat.iconClass,
          className: heat.pill,
        },
        stagePill: {
          text: `Aşama: ${STAGE_TR[DB_STAGE_TO_KANBAN[row.stage] ?? "yeni"]}`,
          className: "bg-primary-fixed text-on-primary-fixed",
        },
        sentiment: {
          text: `Sentiment: ${SENTIMENT_TR[lastSignal?.sentiment ?? "neutral"] ?? "Nötr"}`,
          className: sentimentClass,
        },
        notePre: "Son görüşme: ",
        noteHighlight: durationLabel(lastSignal?.duration_seconds ?? null),
        notePost: summaryText ? `. ${summaryText}` : ". Henüz transkript kaydı yok.",
        audioMeta: lastSignal
          ? `${durationLabel(lastSignal.duration_seconds)} · Sesli`
          : "Kayıt yok",
        timeline,
      },
    } satisfies Lead;
  });
}
