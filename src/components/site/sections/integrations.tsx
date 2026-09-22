const INTEGRATIONS = [
  { icon: "school", color: "text-primary", label: "K12NET Entegrasyonu" },
  { icon: "chat", color: "text-whatsapp-deep", label: "Meta WhatsApp Business API" },
  { icon: "calendar_month", color: "text-primary", label: "Google Takvim & Rehberlik Ajandası" },
  { icon: "credit_card", color: "text-voice-teal", label: "iyzico & Sanal POS Taksit" },
  { icon: "receipt_long", color: "text-on-surface", label: "GİB e-Fatura & e-Makbuz" },
  { icon: "analytics", color: "text-amber-notice", label: "Özdebir & Töder Net Çözümleme" },
  { icon: "table_view", color: "text-secondary", label: "Excel & CSV Otomatik Aktarım" },
] as const;

function IntegrationPill({ item, hidden }: { item: (typeof INTEGRATIONS)[number]; hidden?: boolean }) {
  return (
    <span
      aria-hidden={hidden}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-container-lowest px-3 py-1.5 font-body-sm text-body-sm text-on-surface shadow-sm"
    >
      <span className={`material-symbols-outlined text-[18px] ${item.color}`}>
        {item.icon}
      </span>{" "}
      {item.label}
    </span>
  );
}

/* Sonsuz kayan şerit — iki kopyalı liste, hover'da durur, kenarlarda maskeli */
export function Integrations() {
  return (
    <section className="border-b border-surface-container-highest bg-surface-container-low py-8">
      <div className="mx-auto max-w-[1240px] space-y-4 px-margin-mobile lg:px-margin">
        <div className="text-center">
          <h2 className="font-title-md text-title-md text-on-surface">
            Tüm Okul ve Kurs Yönetim Sistemleriyle Kusursuz Çalışır
          </h2>
        </div>
        <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max gap-2 pt-2 animate-[marquee_35s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 gap-2 pr-2">
                {INTEGRATIONS.map((item) => (
                  <IntegrationPill key={item.label} item={item} hidden={dup === 1} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
