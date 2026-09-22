import type { Metadata } from "next";

/*
  Web sitesindeki canlı vitrin ekranı — porsyon.com.tr "Ürün vitrini"
  mantığında: sol sidebar navigasyonu + Genel Bakış paneli (KPI + günlük
  operasyon akışı + yan kartlar) + Veliler CRM kanban + Görüşmeler +
  Tahsilat görünümleri. Root layout altında: header/footer'sız, iframe'e
  gömülür. Veriler temsilidir.
*/

const NAV = [
  { id: "genel-bakis", label: "Genel Bakış", icon: "space_dashboard", active: true },
  { id: "veliler", label: "Veliler CRM", icon: "groups" },
  { id: "gorusmeler", label: "Görüşmeler", icon: "record_voice_over" },
  { id: "tahsilat", label: "Tahsilat", icon: "payments" },
];

const KPIS = [
  { label: "Bugün Aranan Veli", value: "128", note: "günlük hedefin %82'si" },
  { label: "Oluşturulan Randevu", value: "14", note: "bu hafta +3" },
  { label: "Bugün Tahsilat", value: "₺52.400", note: "9 taksit kapandı" },
  { label: "Bağlantı Başarısı", value: "%94", note: "son 7 gün ortalaması" },
];

const FEED = [
  {
    time: "09:12",
    title: "AI arama tamamlandı",
    desc: "Ayşe Yılmaz · Erken kayıt · Randevu alındı",
  },
  {
    time: "10:05",
    title: "Deneme analizi araması",
    desc: "Mehmet Demir · Fen +%30 · Bilgi verildi",
  },
  {
    time: "10:47",
    title: "Taksit hatırlatması",
    desc: "Hakan Kaya · Ödeme linki gönderildi",
  },
  {
    time: "11:30",
    title: "WhatsApp broşürü iletildi",
    desc: "Zeynep Kaya · Fiyat tablosu + kurum konumu",
  },
  {
    time: "11:52",
    title: "İnsana devir",
    desc: "Bursluluk sorusu · Elif (rehber öğretmen) devraldı",
  },
];

const SIDE_CARDS = [
  {
    alert: true,
    title: "3 veli 48 saattir dönüş yapmadı",
    desc: "Acil müdahale listesinde · tek tıkla tekrar arayın",
    badge: "Aksiyon",
    badgeClass: "bg-red-100 text-red-600",
  },
  {
    title: "Bugünün Randevuları",
    desc: "14:00 Rehberlik · Ayşe Yılmaz",
    badge: "Onaylı",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Akşam Arama Kampanyası",
    desc: "128 veli · Erken kayıt senaryosu",
    badge: "Planlandı",
    badgeClass: "bg-sky-100 text-sky-700",
  },
  {
    title: "Geciken Tahsilat",
    desc: "₺48.900 · 14 taksit takipte",
    badge: "Takip",
    badgeClass: "bg-amber-100 text-amber-700",
  },
];

type Lead = {
  initials: string;
  avatar: string;
  ring: string;
  name: string;
  student: string;
  score: number;
  heat: string;
  heatClass: string;
  time: string;
  channel: string;
  aiNote?: string;
};

const COLUMNS: Array<{
  name: string;
  dot: string;
  total: number;
  leads: Lead[];
}> = [
  {
    name: "Yeni Lead",
    dot: "bg-slate-400",
    total: 18,
    leads: [
      {
        initials: "AD",
        avatar: "bg-indigo-100 text-indigo-700",
        ring: "border-slate-300 text-slate-500",
        name: "Ayşe Demir",
        student: "Kerem Demir · 8. Sınıf",
        score: 41,
        heat: "Ilık",
        heatClass: "bg-slate-100 text-slate-600",
        time: "5 dk önce",
        channel: "Web formu doldurdu",
        aiNote: "📞 14:06'da aranacak",
      },
      {
        initials: "SÖ",
        avatar: "bg-sky-100 text-sky-700",
        ring: "border-slate-300 text-slate-500",
        name: "Serkan Öz",
        student: "Defne Öz · 12. Sınıf Sayısal",
        score: 38,
        heat: "Ilık",
        heatClass: "bg-slate-100 text-slate-600",
        time: "1 sa önce",
        channel: "Web formu doldurdu",
        aiNote: "📞 Kuyrukta · 3. sıra",
      },
    ],
  },
  {
    name: "İletişime Geçildi",
    dot: "bg-indigo-400",
    total: 34,
    leads: [
      {
        initials: "MY",
        avatar: "bg-indigo-100 text-indigo-700",
        ring: "border-indigo-400 text-indigo-600",
        name: "Murat Yılmaz",
        student: "Kerem Yılmaz · 11. Sınıf Sayısal",
        score: 62,
        heat: "Sıcak",
        heatClass: "bg-orange-50 text-orange-600",
        time: "09:24 · bugün",
        channel: "AI sesli arama · 2 dk 40 sn",
        aiNote: "📄 Broşür + konum WhatsApp'ta",
      },
      {
        initials: "EŞ",
        avatar: "bg-teal-100 text-teal-700",
        ring: "border-indigo-400 text-indigo-600",
        name: "Elif Şahin",
        student: "Pelin Şahin · 10. Sınıf",
        score: 58,
        heat: "Sıcak",
        heatClass: "bg-orange-50 text-orange-600",
        time: "10:52 · bugün",
        channel: "WhatsApp mesajı",
        aiNote: "💬 Fiyat listesini okudu",
      },
    ],
  },
  {
    name: "İlgileniyor",
    dot: "bg-emerald-400",
    total: 27,
    leads: [
      {
        initials: "ZK",
        avatar: "bg-emerald-100 text-emerald-700",
        ring: "border-emerald-500 text-emerald-600",
        name: "Zeynep Kaya",
        student: "Efe Kaya · 12. Sınıf Eşit Ağırlık",
        score: 87,
        heat: "🔥 Çok sıcak",
        heatClass: "bg-red-50 text-red-600",
        time: "11:30 · bugün",
        channel: "AI sesli arama · 3 dk 05 sn",
        aiNote: "🎯 Randevu niyeti beyan etti · bursluluk sorusu",
      },
      {
        initials: "HA",
        avatar: "bg-amber-100 text-amber-700",
        ring: "border-emerald-500 text-emerald-600",
        name: "Hakan Aydın",
        student: "Melis Aydın · 9. Sınıf",
        score: 71,
        heat: "Sıcak",
        heatClass: "bg-orange-50 text-orange-600",
        time: "13:15 · bugün",
        channel: "AI sesli arama · 2 dk 20 sn",
        aiNote: "📄 Deneme analiz karnesi iletildi",
      },
    ],
  },
  {
    name: "Randevu Alındı",
    dot: "bg-emerald-600",
    total: 15,
    leads: [
      {
        initials: "FY",
        avatar: "bg-emerald-100 text-emerald-700",
        ring: "border-emerald-600 text-emerald-700",
        name: "Fatma Yıldız",
        student: "Ahmet Yıldız · 12. Sınıf Sayısal",
        score: 91,
        heat: "🔥 Çok sıcak",
        heatClass: "bg-red-50 text-red-600",
        time: "Cmt 14:00 · rehberlik",
        channel: "AI randevu onadı",
        aiNote: "✅ SMS + WhatsApp hatırlatma kurulu",
      },
      {
        initials: "EK",
        avatar: "bg-violet-100 text-violet-700",
        ring: "border-emerald-600 text-emerald-700",
        name: "Emre Koç",
        student: "Nisa Koç · 11. Sınıf Dil",
        score: 78,
        heat: "Sıcak",
        heatClass: "bg-orange-50 text-orange-600",
        time: "Salı 16:30 · müdür",
        channel: "AI randevu onadı",
        aiNote: "✅ Veli onayı WhatsApp'tan geldi",
      },
    ],
  },
];

const CALLS = [
  {
    parent: "Zeynep Kaya",
    scenario: "Erken Kayıt",
    time: "11:30 · 3 dk 05 sn",
    result: "Randevu Alındı",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    parent: "Mehmet Demir",
    scenario: "Deneme Analizi",
    time: "10:05 · 1 dk 55 sn",
    result: "Bilgi Verildi",
    tone: "bg-sky-50 text-sky-700",
  },
  {
    parent: "Hakan Kaya",
    scenario: "Taksit Hatırlatma",
    time: "09:47 · 1 dk 20 sn",
    result: "Ödeme Linki Gönderildi",
    tone: "bg-amber-50 text-amber-700",
  },
  {
    parent: "Fatma Yıldız",
    scenario: "Erken Kayıt",
    time: "09:12 · 2 dk 40 sn",
    result: "Randevu Alındı",
    tone: "bg-emerald-50 text-emerald-700",
  },
];

const INSTALLMENTS = [
  { student: "Kerem Yılmaz", term: "3/8 Taksit", amount: "₺4.250", status: "Ödendi", tone: "bg-emerald-50 text-emerald-700" },
  { student: "Zeynep Arslan", term: "5/10 Taksit", amount: "₺3.900", status: "Bugün Hatırlatıldı", tone: "bg-amber-50 text-amber-700" },
  { student: "Can Aydın", term: "2/8 Taksit", amount: "₺4.250", status: "Ödeme Linki Gönderildi", tone: "bg-sky-50 text-sky-700" },
];

const card =
  "rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

export const metadata: Metadata = {
  title: { absolute: "Panel Demo | educallai" },
};

export default function DemoPage() {
  return (
    <div
      className="flex min-h-screen bg-[#f6f7fb] text-slate-900"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-52 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.png" alt="" className="h-8 w-auto" />
          <span className="text-sm font-semibold tracking-tight">educallai</span>
        </div>
        <nav className="flex-1 space-y-1 px-2.5">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${
                item.active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              AY
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold">Ahmet Yıldız</p>
              <p className="text-[10px] text-slate-500">Müdür · Limit Dershane</p>
            </div>
          </div>
        </div>
      </aside>

      {/* İçerik */}
      <main className="min-w-0 flex-1 p-4">
        {/* 1 · Genel Bakış */}
        <section id="genel-bakis" className="scroll-mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold tracking-tight">Genel Bakış</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Canlı veriler · temsili kurum
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className={`${card} p-4`}>
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{kpi.note}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            {/* Günlük operasyon akışı */}
            <div className={`${card} p-0 lg:col-span-3`}>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold">Günlük Operasyon</p>
                <p className="text-[11px] text-slate-400">Bugün</p>
              </div>
              <div className="divide-y divide-slate-100">
                {FEED.map((item) => (
                  <div key={item.time} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 font-mono text-[11px] font-medium text-indigo-500">
                      {item.time}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yan kartlar */}
            <div className="space-y-3 lg:col-span-2">
              {SIDE_CARDS.map((c) => (
                <div
                  key={c.title}
                  className={`${card} p-4 ${c.alert ? "border-red-200 bg-red-50/60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{c.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{c.desc}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${c.badgeClass}`}>
                      {c.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2 · Veliler CRM (kanban) */}
        <section id="veliler" className="scroll-mt-4 space-y-3 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight">Veliler CRM</h2>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 sm:flex">
                <span className="material-symbols-outlined text-[15px]">search</span>
                Veli veya öğrenci ara…
              </div>
              <span className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                Yeni Veli
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.name} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2">
                <div className="flex items-center justify-between px-1.5 pb-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-semibold">{col.name}</span>
                    <span className="rounded-full bg-slate-200/70 px-1.5 text-[10px] font-medium text-slate-600">
                      {col.total}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {col.leads.map((lead) => (
                    <article key={lead.name} className={`${card} p-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${lead.avatar}`}
                          >
                            {lead.initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{lead.name}</p>
                            <p className="truncate text-[11px] text-slate-500">
                              Veli · {lead.student}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${lead.ring}`}
                          title="Lead puanı"
                        >
                          {lead.score}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${lead.heatClass}`}>
                          {lead.heat}
                        </span>
                        <span className="truncate text-[10px] text-slate-400">
                          {lead.time} · {lead.channel}
                        </span>
                      </div>
                      {lead.aiNote && (
                        <p className="mt-2 flex items-center gap-1 rounded-md bg-indigo-50/70 px-2 py-1 text-[10.5px] font-medium text-indigo-700">
                          <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                          {lead.aiNote}
                        </p>
                      )}
                    </article>
                  ))}
                  <p className="py-1 text-center text-[10.5px] text-slate-400">
                    +{col.total - col.leads.length} veli daha · sürükleyip aşama değiştirin
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3 · Görüşmeler */}
        <section id="gorusmeler" className="scroll-mt-4 space-y-2.5 pt-6">
          <h2 className="text-base font-bold tracking-tight">Son Görüşmeler</h2>
          <div className={card + " divide-y divide-slate-100 p-0"}>
            {CALLS.map((call) => (
              <div key={call.parent} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600">
                    AI
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{call.parent}</p>
                    <p className="text-xs text-slate-500">
                      {call.scenario} · {call.time}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${call.tone}`}>
                  {call.result}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4 · Tahsilat */}
        <section id="tahsilat" className="scroll-mt-4 space-y-2.5 pb-6 pt-6">
          <h2 className="text-base font-bold tracking-tight">Taksit Takibi</h2>
          <div className={card + " divide-y divide-slate-100 p-0"}>
            {INSTALLMENTS.map((row) => (
              <div key={row.student} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.student}</p>
                  <p className="text-xs text-slate-500">{row.term}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-bold tabular-nums">{row.amount}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${row.tone}`}>
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="pb-2 text-center text-[11px] text-slate-400">
            Geciken taksitlerde WhatsApp ödeme linki ve AI sesli hatırlatma otomatik
            çalışır.
          </p>
        </section>
      </main>
    </div>
  );
}
