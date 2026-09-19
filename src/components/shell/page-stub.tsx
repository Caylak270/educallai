import { clsx } from "@/lib/clsx";

export function PageStub({
  title,
  icon,
  designFile,
  className,
}: {
  title: string;
  icon: string;
  designFile: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        Bu ekran Stitch tasarımından taşınma aşamasında. Tasarım referansı:{" "}
        <code className="rounded bg-surface-container px-1.5 py-0.5 font-mono-data text-mono-data text-on-surface">
          {designFile}
        </code>
      </p>
    </div>
  );
}
