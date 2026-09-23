/**
 * Öğrenci Ekosistemi — DURUM HESAP KATMANI (TEK KAYNAK).
 *
 * 13 contact_id'li tablodan öğrenci başına tek OgrenciDurumu modeli türetilir;
 * Risk Paneli, Beceri Karnesi, Veli Bülteni, Dashboard ve yeni modüller
 * yalnızca bu haritayı okur. M9.2'deki odev-performans.ts deseninin
 * genelleştirilmiş hâlidir:
 *   - Saf fonksiyondur: DB'ye erişmez, demo/canlı ayrımı yapmaz, Date.now kullanmaz.
 *   - Yeni bir sinyal eklemek = buraya bir blok; yansıma tüm modüllere otomatik.
 *   - Faaliyet akışı türetilir (log tablosu kopyası değil) — denetim izi için
 *     activity_log'a Oğuzhan abi aşamasında trigger'la başlanacak.
 */

import { odevPerformansHaritasi } from "./odev-performans";
import { SKILLS } from "@/lib/skills";
import type {
  BeceriOzeti,
  DenemeOzeti,
  OgrenciDurumu,
  OgrenciFaaliyeti,
  OgrenciGirdiler,
  OgrenciRozeti,
  FaaliyetYonu,
} from "@/lib/types/ogrenci";

/** Faaliyet akışının öğrenci başına azami uzunluğu (akış taşmasını önler). */
const AKIS_LIMITI = 40;

const KANAL_TR: Record<string, string> = {
  voice: "sesli",
  whatsapp: "WhatsApp",
  sms: "SMS",
  instagram: "Instagram",
};

const ODEV_STATUS_TR: Record<string, string> = {
  done: "yapıldı",
  partial: "yarım yapıldı",
  missing: "yapılmadı",
};

const YOKLAMA_TR: Record<string, string> = {
  present: "katıldı",
  late: "geç kaldı",
  absent: "gelmedi",
};

const RANDEVU_TR: Record<string, string> = {
  scheduled: "planlandı",
  confirmed: "onaylandı",
  completed: "tamamlandı",
  no_show: "veli gelmedi",
  cancelled: "iptal",
  rescheduled: "ertelendi",
};

/** İlk dolu tarih alanını döndürür (olay ts'i için). */
function tsOf(...adaylar: (string | null | undefined)[]): string | null {
  for (const a of adaylar) {
    if (a) return a;
  }
  return null;
}

function beceriEtiketi(skill: string): string {
  return SKILLS.find((s) => s.id === skill)?.label ?? skill;
}

function duyguYonu(sentiment: string | null): FaaliyetYonu {
  if (sentiment === "negative") return "risk";
  if (sentiment === "positive") return "olumlu";
  return "notr";
}

/** contact_id → OgrenciDurumu haritası. Tüm modüller buradan beslenir. */
export function ogrenciDurumHaritasi(
  girdiler: OgrenciGirdiler
): Map<string, OgrenciDurumu> {
  const harita = new Map<string, OgrenciDurumu>();

  const ogrenci = (contactId: string): OgrenciDurumu => {
    let d = harita.get(contactId);
    if (!d) {
      d = {
        contact_id: contactId,
        odev: null,
        yoklama: { total: 0, present: 0, late: 0, absent: 0 },
        deneme: { sayi: 0, sonNet: null, delta: null, kategori: null, sonTarih: null },
        beceri: { gozlem: 0, ort: null, enIyi: null, enZayif: null },
        tahsilat: { odenen: 0, geciken: 0, acik: 0, sonOdemeTarihi: null },
        etkinlik: { davet: 0, katildi: 0 },
        gorusme: { toplam: 0, sonDuygu: null, sonTarih: null },
        randevu: { toplam: 0, noShow: 0, sonTarih: null },
        faaliyetler: [],
      };
      harita.set(contactId, d);
    }
    return d;
  };

  const faaliyet = (
    contactId: string,
    f: Omit<OgrenciFaaliyeti, "contact_id">
  ) => {
    ogrenci(contactId).faaliyetler.push({ contact_id: contactId, ...f });
  };

  /* ── Ödev (M9.2 tek kaynağı yeniden kullanılır) ─────────────── */
  const odevBasliklari = new Map((girdiler.odevler ?? []).map((o) => [o.id, o.title]));
  for (const [contactId, p] of odevPerformansHaritasi(girdiler.submissions ?? [])) {
    ogrenci(contactId).odev = { ...p };
  }
  for (const s of girdiler.submissions ?? []) {
    if (s.status !== "done" && s.status !== "partial" && s.status !== "missing") continue;
    const baslik = odevBasliklari.get(s.assignment_id);
    faaliyet(s.contact_id, {
      ts: tsOf(s.checked_at, s.submitted_at, s.created_at),
      tip: "odev",
      baslik: baslik ? `Ödev: ${baslik}` : "Ödev işaretlendi",
      detay: ODEV_STATUS_TR[s.status],
      yon: s.status === "done" ? "olumlu" : s.status === "missing" ? "risk" : "notr",
    });
  }

  /* ── Yoklama — derse katılmama sinyali öne çıkar ────────────── */
  const dersAdi = new Map((girdiler.lessons ?? []).map((l) => [l.id, l.name]));
  for (const a of girdiler.attendance ?? []) {
    const y = ogrenci(a.contact_id).yoklama;
    y.total += 1;
    if (a.status === "present") y.present += 1;
    else if (a.status === "late") y.late += 1;
    else if (a.status === "absent") y.absent += 1;
    // "Katıldı" akışı doldurmasın; gecikme ve devamsızlık faaliyettir.
    if (a.status === "absent" || a.status === "late") {
      const ders = dersAdi.get(a.lesson_id);
      faaliyet(a.contact_id, {
        ts: tsOf(a.created_at),
        tip: "yoklama",
        baslik: ders ? `Ders: ${ders}` : "Ders yoklaması",
        detay: `Öğrenci ${YOKLAMA_TR[a.status] ?? a.status}`,
        yon: a.status === "absent" ? "risk" : "notr",
      });
    }
  }

  /* ── Deneme — kronolojik sırayla son net ve değişim ─────────── */
  const denemeler = new Map<string, NonNullable<OgrenciGirdiler["exams"]>>();
  for (const e of girdiler.exams ?? []) {
    const liste = denemeler.get(e.contact_id) ?? [];
    liste.push(e);
    denemeler.set(e.contact_id, liste);
  }
  for (const [contactId, liste] of denemeler) {
    const sirali = [...liste].sort(
      (a, b) =>
        new Date(tsOf(a.exam_date, a.created_at) ?? 0).getTime() -
        new Date(tsOf(b.exam_date, b.created_at) ?? 0).getTime()
    );
    const son = sirali[sirali.length - 1];
    const onceki = sirali.length > 1 ? sirali[sirali.length - 2] : null;
    const sonNet = son?.total_net != null ? Number(son.total_net) : null;
    const oncekiNet = onceki?.total_net != null ? Number(onceki.total_net) : null;
    const ozet: DenemeOzeti = {
      sayi: sirali.length,
      sonNet,
      delta: sonNet !== null && oncekiNet !== null ? sonNet - oncekiNet : null,
      kategori: son?.category ?? null,
      sonTarih: tsOf(son?.exam_date, son?.created_at),
    };
    ogrenci(contactId).deneme = ozet;
    for (let i = 0; i < sirali.length; i++) {
      const e = sirali[i];
      const net = e.total_net != null ? Number(e.total_net) : null;
      const evvelki = i > 0 && sirali[i - 1].total_net != null ? Number(sirali[i - 1].total_net) : null;
      let yon: FaaliyetYonu = "notr";
      if (net !== null && evvelki !== null) yon = net >= evvelki ? "olumlu" : "risk";
      faaliyet(contactId, {
        ts: tsOf(e.exam_date, e.created_at),
        tip: "deneme",
        baslik: e.exam_name ? `Deneme: ${e.exam_name}` : "Deneme sonucu",
        detay: net !== null ? `Toplam net ${net.toLocaleString("tr-TR")}` : null,
        yon,
      });
    }
  }

  /* ── Beceri gözlemleri ───────────────────────────────────────── */
  const beceriToplamlari = new Map<string, Map<string, { toplam: number; adet: number }>>();
  for (const g of girdiler.skillGozlemleri ?? []) {
    const d = ogrenci(g.contact_id).beceri;
    d.gozlem += 1;
    let beceriMap = beceriToplamlari.get(g.contact_id);
    if (!beceriMap) {
      beceriMap = new Map();
      beceriToplamlari.set(g.contact_id, beceriMap);
    }
    const k = beceriMap.get(g.skill) ?? { toplam: 0, adet: 0 };
    k.toplam += g.score;
    k.adet += 1;
    beceriMap.set(g.skill, k);
    faaliyet(g.contact_id, {
      ts: tsOf(g.created_at),
      tip: "beceri",
      baslik: `Beceri gözlemi: ${beceriEtiketi(g.skill)}`,
      detay: `${g.score}/5`,
      yon: g.score >= 4 ? "olumlu" : g.score >= 3 ? "notr" : "risk",
    });
  }
  for (const [contactId, beceriMap] of beceriToplamlari) {
    const ortalamalar = [...beceriMap.entries()].map(([skill, k]) => ({
      skill,
      ort: k.toplam / k.adet,
    }));
    const genelOrt =
      ortalamalar.reduce((t, x) => t + x.ort, 0) / (ortalamalar.length || 1);
    const sirali = [...ortalamalar].sort((a, b) => b.ort - a.ort);
    const ozet: BeceriOzeti = {
      gozlem: ogrenci(contactId).beceri.gozlem,
      ort: genelOrt,
      enIyi: sirali[0] ? beceriEtiketi(sirali[0].skill) : null,
      enZayif: sirali[sirali.length - 1]
        ? beceriEtiketi(sirali[sirali.length - 1].skill)
        : null,
    };
    ogrenci(contactId).beceri = ozet;
  }

  /* ── Tahsilat ────────────────────────────────────────────────── */
  for (const t of girdiler.taksitler ?? []) {
    const d = ogrenci(t.contact_id).tahsilat;
    if (t.state === "PAID") {
      d.odenen += 1;
      if (t.paid_at && (!d.sonOdemeTarihi || t.paid_at > d.sonOdemeTarihi)) {
        d.sonOdemeTarihi = t.paid_at;
      }
      const tutar = t.installment_amount
        ? `₺${Number(t.installment_amount).toLocaleString("tr-TR")}`
        : "";
      faaliyet(t.contact_id, {
        ts: tsOf(t.paid_at, t.due_date),
        tip: "tahsilat",
        baslik: "Taksit ödendi",
        detay: tutar || null,
        yon: "olumlu",
      });
    } else if (t.state.startsWith("OVERDUE") || t.state === "ESCALATED") {
      d.geciken += 1;
      faaliyet(t.contact_id, {
        ts: tsOf(t.due_date),
        tip: "tahsilat",
        baslik: t.state === "ESCALATED" ? "Taksit tahsilata devredildi" : "Taksit gecikmede",
        detay: t.installment_amount
          ? `₺${Number(t.installment_amount).toLocaleString("tr-TR")}`
          : null,
        yon: "risk",
      });
    } else {
      d.acik += 1;
    }
  }

  /* ── Etkinlik katılımı ───────────────────────────────────────── */
  const etkinlikAdi = new Map((girdiler.etkinlikler ?? []).map((e) => [e.id, e]));
  for (const davet of girdiler.davetler ?? []) {
    const d = ogrenci(davet.contact_id).etkinlik;
    d.davet += 1;
    if (davet.status === "katildi") {
      d.katildi += 1;
      const e = etkinlikAdi.get(davet.event_id);
      faaliyet(davet.contact_id, {
        ts: tsOf(e?.event_date, davet.created_at),
        tip: "etkinlik",
        baslik: e ? `Etkinliğe katıldı: ${e.name}` : "Etkinliğe katıldı",
        detay: null,
        yon: "olumlu",
      });
    }
  }

  /* ── AI veli görüşmeleri ─────────────────────────────────────── */
  for (const s of girdiler.gorusmeler ?? []) {
    const d = ogrenci(s.contact_id).gorusme;
    d.toplam += 1;
    if (!d.sonTarih || s.created_at > d.sonTarih) {
      d.sonTarih = s.created_at;
      d.sonDuygu = s.sentiment;
    }
    const kanal = KANAL_TR[s.channel ?? ""] ?? s.channel ?? "görüşme";
    const sure = s.duration_seconds
      ? ` · ${Math.round(s.duration_seconds / 60)} dk`
      : "";
    faaliyet(s.contact_id, {
      ts: tsOf(s.created_at),
      tip: "gorusme",
      baslik: `AI veli görüşmesi (${kanal}${sure})`,
      detay: null,
      yon: duyguYonu(s.sentiment),
    });
  }

  /* ── Randevular ──────────────────────────────────────────────── */
  for (const r of girdiler.randevular ?? []) {
    const d = ogrenci(r.contact_id).randevu;
    d.toplam += 1;
    if (r.status === "no_show") d.noShow += 1;
    if (!d.sonTarih || r.scheduled_at > d.sonTarih) d.sonTarih = r.scheduled_at;
    faaliyet(r.contact_id, {
      ts: tsOf(r.scheduled_at),
      tip: "randevu",
      baslik: "Veli randevusu",
      detay: RANDEVU_TR[r.status] ?? r.status,
      yon: r.status === "no_show" ? "risk" : r.status === "completed" ? "olumlu" : "notr",
    });
  }

  /* ── Akışı sırala ve sınırlandır ─────────────────────────────── */
  for (const d of harita.values()) {
    d.faaliyetler.sort((a, b) => {
      const ta = a.ts ? new Date(a.ts).getTime() : 0;
      const tb = b.ts ? new Date(b.ts).getTime() : 0;
      return tb - ta;
    });
    if (d.faaliyetler.length > AKIS_LIMITI) {
      d.faaliyetler = d.faaliyetler.slice(0, AKIS_LIMITI);
    }
  }

  return harita;
}

/**
 * Öğrenci rozetleri — "tek dil": tüm modüller aynı metni/ikonu gösterir.
 * Renk UI'da yon alanından türetilir (olumlu→yeşil, notr→sarı, risk→kırmızı).
 */
export function ogrenciRozetleri(d: OgrenciDurumu): OgrenciRozeti[] {
  const rozetler: OgrenciRozeti[] = [];

  if (d.odev && d.odev.total > 0) {
    if (d.odev.missing / d.odev.total >= 0.5) {
      rozetler.push({ metin: `Ödevler çoğunlukla eksik (${d.odev.missing}/${d.odev.total})`, yon: "risk", ikon: "checklist" });
    } else if (d.odev.missing > 0) {
      rozetler.push({ metin: `${d.odev.missing} eksik ödev`, yon: "notr", ikon: "checklist" });
    } else {
      rozetler.push({ metin: `Ödevleri düzenli (${d.odev.done}/${d.odev.total})`, yon: "olumlu", ikon: "checklist" });
    }
  }

  if (d.yoklama.absent > 0) {
    rozetler.push({ metin: `${d.yoklama.absent} devamsızlık`, yon: "risk", ikon: "event_busy" });
  } else if (d.yoklama.late > 0) {
    rozetler.push({ metin: `${d.yoklama.late} kez geç kaldı`, yon: "notr", ikon: "schedule" });
  }

  if (d.tahsilat.geciken > 0) {
    rozetler.push({ metin: `${d.tahsilat.geciken} gecikmiş taksit`, yon: "risk", ikon: "payments" });
  }

  if (d.deneme.kategori === "DECLINING") {
    rozetler.push({ metin: "Denemede düşüş", yon: "risk", ikon: "trending_down" });
  } else if (d.deneme.kategori === "RISING") {
    rozetler.push({ metin: "Denemede yükseliş", yon: "olumlu", ikon: "trending_up" });
  }

  if (d.etkinlik.davet > 0 && d.etkinlik.katildi === 0) {
    rozetler.push({ metin: `${d.etkinlik.davet} davet, hiç katılmadı`, yon: "notr", ikon: "celebration" });
  }

  return rozetler;
}
