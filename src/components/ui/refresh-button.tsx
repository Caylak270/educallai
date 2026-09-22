"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { clsx } from "@/lib/clsx";

/**
 * Server verisini tazeleyen Yenile butonu (router.refresh).
 * Dashboard'un canlı veriye bağlandığı bileşenlerde kullanılır.
 */
export function RefreshButton({
  className,
  label = "Yenile",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      aria-busy={pending}
      className={clsx(className, pending && "opacity-70")}
      disabled={pending}
      type="button"
      onClick={() => startTransition(() => router.refresh())}
    >
      <span
        className={clsx(
          "material-symbols-outlined text-[16px]",
          pending && "animate-spin"
        )}
      >
        sync
      </span>
      <span>{label}</span>
    </button>
  );
}
