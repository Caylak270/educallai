"use client";

import { useEffect, useRef, useState } from "react";
import { CardHeader } from "./card-header";
import { clsx } from "@/lib/clsx";

type CallStatus = "idle" | "connecting" | "sent";

type TestCallCardProps = {
  phone: string;
  onPhoneChange: (value: string) => void;
};

export function TestCallCard({ phone, onPhoneChange }: TestCallCardProps) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const triggerCall = () => {
    if (status !== "idle") return;
    setStatus("connecting");
    timers.current.push(
      setTimeout(() => {
        setStatus("sent");
        timers.current.push(setTimeout(() => setStatus("idle"), 4000));
      }, 1200)
    );
  };

  return (
    <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <CardHeader
        icon="phone_in_talk"
        title="Test Çağrısı Başlat"
        description="Kendi telefonunuzda botu anında test edin"
      />

      <div className="flex flex-col gap-space-sm">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="demo-phone-input"
            className="font-label-sm text-label-sm font-medium text-on-surface"
          >
            Telefon Numaranız
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 font-mono-data text-mono-data text-on-surface-variant">
              +90
            </span>
            <input
              id="demo-phone-input"
              type="text"
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder="5XX XXX XX XX"
              className="w-full rounded-lg bg-surface-container-low py-space-sm pl-12 pr-space-md font-mono-data text-mono-data text-on-surface outline-none transition-all focus:bg-surface-container"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={triggerCall}
          disabled={status !== "idle"}
          className={clsx(
            "flex w-full items-center justify-center gap-space-xs rounded-lg bg-on-background px-space-md py-space-sm font-title-sm text-title-sm text-on-primary shadow transition-all hover:bg-inverse-surface active:scale-[0.99]",
            status !== "idle" && "opacity-50"
          )}
        >
          <span className={clsx("material-symbols-outlined text-[18px]", status === "connecting" && "animate-spin")}>
            {status === "idle" ? "ring_volume" : status === "connecting" ? "refresh" : "done"}
          </span>
          <span>
            {status === "idle"
              ? "Numarama Demo Çağrı Gönder"
              : status === "connecting"
                ? "Bağlanıyor..."
                : "Çağrı Gönderildi"}
          </span>
        </button>

        <span
          className={clsx(
            "text-center font-label-sm text-label-sm text-secondary",
            status === "sent" ? "flex items-center justify-center gap-1" : "hidden"
          )}
        >
          <span className="material-symbols-outlined text-[14px]">done</span>
          Çağrı sıraya alındı, 10 saniye içinde aranacaksınız!
        </span>
      </div>
    </section>
  );
}
