"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onRangeChange } from "@/components/shell/topbar-menus";

/**
 * Topbar tarih aralığı değişince sayfayı sunucudan tazeletir —
 * dashboard verisi seçili aralığa göre yeniden üretilir.
 */
export function RangeRefresher() {
  const router = useRouter();
  useEffect(() => onRangeChange(() => router.refresh()), [router]);
  return null;
}
