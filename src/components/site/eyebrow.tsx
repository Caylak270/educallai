import { clsx } from "@/lib/clsx";

/*
  Bölüm eyebrow'ları için tek stil: hangi bölümde olursa olsun aynı hap
  görünümü. Ton semantiği: primary=bilgi, amber=dikkat, teal=canlı/AI.
*/

const TONES = {
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-notice/10 text-amber-600",
  teal: "bg-voice-teal/10 text-voice-teal-ink",
} as const;

export function Eyebrow({
  icon,
  tone = "primary",
  children,
}: {
  icon?: string;
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm font-semibold text-label-sm",
        TONES[tone]
      )}
    >
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </span>
  );
}
