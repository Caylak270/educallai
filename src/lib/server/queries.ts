/**
 * Supabase → Dashboard veri eşlemeleri (sunucu tarafı).
 * Canlı veri yoksa (anahtar yok / tablo boş / hata) null döner; sayfalar
 * mock veriye düşer. Şekiller mock tipleriyle birebir uyumludur.
 */

import { sbSelect, supabaseLive } from "./supabase";
import type { CallListItem, CallSentiment } from "@/lib/mock/call-list";
import type {
  AiSignals,
  AudioPlayerData,
  AutomationItem,
  AutomationPanel,
  NoteBox,
  TranscriptSegment,
} from "@/lib/mock/calls";
import type { Contact, ConversationSignal, Lead } from "@/lib/types/db";

/* ── Yardımcılar ─────────────────────────────────────────────── */

function whenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay(d, now)) return `Bugün ${time}`;
  if (sameDay(d, yesterday)) return `Dün ${time}`;
  return `${d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ${time}`;
}

const SENTIMENT_TR: Record<string, string> = {
  positive: "Pozitif",
  neutral: "Nötr",
  negative: "Olumsuz",
};

const INTENT_TR: Record<string, string> = {
  kayit_talebi: "Kayıt Talebi",
  fiyat_sorusu: "Fiyat Sorusu",
  deneme_istegi: "Deneme Sınavı İsteği",
  randevu_talebi: "Randevu Talebi",
  test_gorusmesi: "Test Görüşmesi",
  diger: "Diğer",
};

function toCallSentiment(
  sentiment: string | null,
  recommendHandoff: boolean | null,
): CallSentiment {
  if (recommendHandoff) return "handoff";
  if (sentiment === "positive" || sentiment === "negative") return sentiment;
  return "neutral";
}

/** "Veli: …\nAsistan: …" transkriptini segmentlere böler (zaman oransal). */
function parseTranscript(
  transcript: string | null,
  totalSeconds: number | null,
): TranscriptSegment[] {
  if (!transcript) return [];
  const lines = transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const segments = lines.map((line) => {
    const speaker = line.startsWith("Asistan:")
      ? ("ai" as const)
      : ("parent" as const);
    const text = line.replace(/^(Veli|Asistan):\s*/, "");
    return { speaker, text };
  });
  const total = Math.max(totalSeconds ?? segments.length * 12, segments.length * 4);
  return segments.map((s, i) => {
    const sec = Math.round((total / segments.length) * i);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return { id: i + 1, speaker: s.speaker, time: `${mm}:${ss}`, text: s.text };
  });
}

function contactKey(contactId: string): string {
  return contactId;
}

/* ── Görüşmeler listesi ─────────────────────────────────────── */

export async function getLiveCalls(): Promise<CallListItem[] | null> {
  if (!supabaseLive) return null;
  const [signals, contacts] = await Promise.all([
    sbSelect<ConversationSignal>(
      "conversation_signals",
      "select=id,contact_id,channel,direction,sentiment,intent,lead_temperature,recommend_handoff,transcript,duration_seconds,created_at&order=created_at.desc&limit=50",
    ),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone&limit=200",
    ),
  ]);
  if (!signals) return null;
  if (signals.length === 0) return [];

  const byContact = new Map(contacts?.map((c) => [c.id, c]) ?? []);
  return signals.map((s) => {
    const c = byContact.get(contactKey(s.contact_id));
    const firstLines = (s.transcript ?? "")
      .split("\n")
      .slice(0, 2)
      .join(" — ")
      .replace(/^(Veli|Asistan):\s*/gm, "");
    return {
      id: s.id,
      parentName: c?.parent_name ?? "Bilinmeyen Veli",
      studentName: c?.student_name ?? "—",
      grade: [c?.student_grade, c?.exam_type].filter(Boolean).join(" · ") || "—",
      channel: (s.channel ?? "voice") as CallListItem["channel"],
      direction: s.direction ?? ("inbound" as const),
      sentiment: toCallSentiment(s.sentiment, s.recommend_handoff),
      durationSeconds: s.duration_seconds ?? null,
      summary: firstLines.slice(0, 140) || "Transkript kaydı yok.",
      when: whenLabel(s.created_at),
      sortKey: Math.floor((Date.now() - new Date(s.created_at).getTime()) / 60000),
    };
  });
}

/* ── Görüşme detayı ─────────────────────────────────────────── */

export interface LiveCallDetail {
  id: string;
  summary: {
    directionPill: string;
    outcomePill: string;
    initials: string;
    parentName: string;
    callTime: string;
    studentLabel: string;
    studentName: string;
    classTag: string;
    programTag: string;
    phoneLabel: string;
    phone: string;
    durationLabel: string;
    duration: string;
  };
  audio: AudioPlayerData;
  transcriptMeta: {
    syncLabel: string;
    copyLabel: string;
    copiedLabel: string;
    aiSpeaker: string;
    parentSpeaker: string;
  };
  transcript: TranscriptSegment[];
  signals: AiSignals;
  automation: AutomationPanel;
  noteBox: NoteBox;
}

function durationLabel(sec: number | null): string {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)} dk ${sec % 60} sn`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase("tr") ?? "")
    .join("");
}

export async function getLiveCallDetail(
  id: string,
): Promise<LiveCallDetail | null> {
  if (!supabaseLive || !id) return null;
  const [signals, contacts] = await Promise.all([
    sbSelect<ConversationSignal>(
      "conversation_signals",
      `select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    ),
    sbSelect<Contact>(
      "contacts",
      "select=id,parent_name,student_name,student_grade,exam_type,phone&limit=200",
    ),
  ]);
  const signal = signals?.[0];
  if (!signal) return null;
  const contact = contacts?.find((c) => c.id === signal.contact_id);

  const parentName = contact?.parent_name ?? "Bilinmeyen Veli";
  const readiness = Math.round(
    parseFloat(signal.enrollment_readiness ?? "0.5") * 100,
  );
  const readinessBadge =
    readiness >= 70 ? "Yüksek Potansiyel" : readiness >= 40 ? "Orta Potansiyel" : "Düşük Potansiyel";
  const sentimentTr = SENTIMENT_TR[signal.sentiment ?? "neutral"] ?? "Nötr";
  const transcript = parseTranscript(signal.transcript, signal.duration_seconds);

  const automationItems: AutomationItem[] = [
    {
      id: 1,
      title: "Görüşme kaydı Supabase'e yazıldı",
      time: whenLabel(signal.created_at),
      desc: [
        { text: "Transkript, duygu ve niyet sinyalleri " },
        { text: "conversation_signals", strong: true },
        { text: " tablosuna kaydedildi." },
      ],
      footer: { variant: "success", icon: "check_circle", text: "Tamamlandı" },
    },
    ...(signal.recommend_handoff
      ? ([
          {
            id: 2,
            title: "Danışmana aktarım önerildi",
            time: whenLabel(signal.created_at),
            desc: [
              { text: "AI görüşmenin insana aktarımını önerdi (" },
              { text: signal.handoff_reason ?? "yetki sınırı", strong: true },
              { text: ")." },
            ],
            footer: { variant: "chip", icon: "pending", text: "Beklemede" },
          },
        ] satisfies AutomationItem[])
      : []),
  ];

  return {
    id: signal.id,
    summary: {
      directionPill:
        (signal.direction ?? "inbound") === "inbound"
          ? "Gelen Çağrı (Inbound)"
          : "Giden Çağrı (Outbound)",
      outcomePill: sentimentTr === "Olumsuz" ? "İnceleme Gerekli" : "Tamamlandı",
      initials: initialsOf(parentName) || "VP",
      parentName,
      callTime: whenLabel(signal.created_at),
      studentLabel: "Öğrenci:",
      studentName: contact?.student_name ?? "—",
      classTag: contact?.student_grade ?? "—",
      programTag: contact?.exam_type ?? "—",
      phoneLabel: "İletişim Numarası",
      phone: contact?.phone ?? "—",
      durationLabel: "Toplam Süre",
      duration: durationLabel(signal.duration_seconds),
    },
    audio: {
      channelTitle: "Ses Kaydı",
      channelSubtitle: "KVKK: kayıtlar azami 6 ay saklanır",
      playedBars: [],
      markerBar: 0,
      upcomingBars: [],
      elapsed: "00:00",
      total: signal.duration_seconds
        ? `${String(Math.floor(signal.duration_seconds / 60)).padStart(2, "0")}:${String(signal.duration_seconds % 60).padStart(2, "0")}`
        : "00:00",
      speeds: ["1.0x", "1.25x", "1.5x"],
      defaultSpeed: "1.0x",
    },
    transcriptMeta: {
      syncLabel: "Canlı Ses Senkronizasyonu Aktif",
      copyLabel: "Metin Olarak Kopyala",
      copiedLabel: "Kopyalandı",
      aiSpeaker: "VeliPilot (AI)",
      parentSpeaker: `${parentName} (Veli)`,
    },
    transcript,
    signals: {
      score: {
        title: "Kayıt Olma İhtimali Skoru",
        badge: readinessBadge,
        value: `%${readiness}`,
        regionAverage: "Bölge Ortalaması: %64",
        percent: readiness,
        note:
          signal.intent === "fiyat_sorusu"
            ? "Veli fiyata odaklandı; taksit bilgisi ile kayda yönlendirme önerilir."
            : "Sinyaller velinin konuşmasından AI tarafından çıkarılmıştır.",
      },
      sentiment: {
        title: "Duygu & Yaklaşım",
        detail: `${sentimentTr} · Sinyal: ${signal.sentiment ?? "neutral"}`,
        badge: sentimentTr,
      },
      intent: {
        label: "Temel Çağrı Niyeti",
        title: INTENT_TR[signal.intent ?? "diger"] ?? (signal.intent ?? "Diğer"),
        tag: contact?.exam_type ? `${contact.exam_type} Odağı` : "Program Belirsiz",
      },
      priceSensitivity: {
        label: "Fiyat Hassasiyeti",
        value: signal.price_sensitivity ?? "—",
        detail: signal.price_sensitivity
          ? "Görüşmede fiyata ilişkin sinyal tespit edildi."
          : "Bu görüşmede fiyat hassasiyeti sinyali kaydedilmedi.",
      },
      objection: {
        label: "Ödeme İtirazı",
        value: signal.payment_objection ? "Tespit Edildi" : "Tespit Edilmedi",
        detail: signal.payment_objection ?? "Veli ödeme itirazı bildirmedi.",
      },
      targetProgram: {
        label: "Hedef Program",
        value: contact?.exam_type ?? "—",
      },
      handoff: {
        button: signal.recommend_handoff ? "Aktarımı Görüntüle" : "Danışmana Aktar",
        captionPrefix: "Atanan danışman:",
        counselor: "Zeynep (Danışman)",
      },
    },
    automation: {
      title: "Otomasyon Günlüğü",
      subtitle: "Bu görüşmede tetiklenen aksiyonlar",
      badge: `${automationItems.length} Kayıt`,
      items: automationItems,
    },
    noteBox: {
      title: "Danışman Notu",
      hint: "Bu görüşmeye özel not yalnızca ekibiniz tarafından görülür.",
      placeholder: "Not ekleyin…",
      saveLabel: "Kaydet",
      savedLabel: "Kaydedildi",
    },
  };
}

/* ── Veliler (CRM kanban) ───────────────────────────────────── */

export interface LiveLeadRow extends Lead {
  contact: Contact | null;
  /** Contact'ın son görüşme sinyalleri (drawer zaman çizelgesi için). */
  signals: ConversationSignal[];
}

export async function getLiveLeads(): Promise<LiveLeadRow[] | null> {
  if (!supabaseLive) return null;
  const [leads, contacts, signals] = await Promise.all([
    sbSelect<Lead>("leads", "select=*&order=score.desc&limit=200"),
    sbSelect<Contact>(
      "contacts",
      "select=*&do_not_call=eq.false&limit=200",
    ),
    sbSelect<ConversationSignal>(
      "conversation_signals",
      "select=id,contact_id,sentiment,intent,recommend_handoff,transcript,duration_seconds,created_at&order=created_at.desc&limit=300",
    ),
  ]);
  if (!leads) return null;
  if (leads.length === 0) return [];
  const byContact = new Map(contacts?.map((c) => [c.id, c]) ?? []);
  const signalsByContact = new Map<string, ConversationSignal[]>();
  for (const s of signals ?? []) {
    const list = signalsByContact.get(s.contact_id) ?? [];
    list.push(s);
    signalsByContact.set(s.contact_id, list);
  }
  return leads.map((l) => ({
    ...l,
    contact: byContact.get(l.contact_id) ?? null,
    signals: signalsByContact.get(l.contact_id) ?? [],
  }));
}
