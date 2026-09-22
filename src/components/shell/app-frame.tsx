"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MobileHeader, WebTopbar } from "./topbars";
import { MobileTabbar } from "./mobile-tabbar";
import { Sidebar } from "./sidebar";
import { clsx } from "@/lib/clsx";

const STORAGE_KEY = "educallai-sidebar";

/**
 * Uygulama kabuğu — sidebar katlama durumunun tek sahibi.
 * Katlama tercihi localStorage'da tutulur; Sidebar/Topbar prop ile alınır,
 * içerik alanının sol boşluğu da buna göre geçiş yapar.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Hydration sonrası kayıtlı tercihi uygula (SSR güvenli)
    let alive = true;
    void Promise.resolve().then(() => {
      if (!alive) return;
      try {
        setCollapsed(localStorage.getItem(STORAGE_KEY) === "collapsed");
      } catch {
        // localStorage kapalıysa geniş başla
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded");
      } catch {
        // yalnız bu oturum
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div
        className={clsx(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[68px]" : "lg:pl-72"
        )}
      >
        <MobileHeader />
        <WebTopbar collapsed={collapsed} />
        <main className="w-full flex-1 pb-24 pt-16 lg:pb-10">{children}</main>
      </div>
      <MobileTabbar />
    </div>
  );
}
