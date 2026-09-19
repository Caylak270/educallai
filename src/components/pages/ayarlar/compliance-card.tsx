import { CardHeader } from "./card-header";
import { complianceItems } from "@/lib/mock/settings";

export function ComplianceCard() {
  return (
    <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
          </div>
          <div>
            <h2 className="font-title-sm text-title-sm text-on-surface">KVKK &amp; İYS Uyumluluğu</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Yasal iletişim denetim kalkanı
            </p>
          </div>
        </div>
        <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-secondary-container">
          %100 Uyumlu
        </span>
      </div>

      <div className="flex flex-col gap-space-xs font-body-sm text-body-sm">
        {complianceItems.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-space-sm rounded-sm bg-surface-container-low p-space-xs"
          >
            <span
              className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-[13px] text-on-surface">{item.title}</span>
              <span className="text-[12px] text-on-surface-variant">{item.description}</span>
            </div>
          </div>
        ))}
      </div>

      <a
        href="#"
        className="mt-space-xs inline-flex items-center gap-space-xs font-label-md text-label-md font-semibold text-primary transition-colors hover:text-primary-container"
      >
        <span className="material-symbols-outlined text-[16px]">description</span>
        <span>Yasal Danışman Raporunu İndir (PDF)</span>
      </a>
    </section>
  );
}
