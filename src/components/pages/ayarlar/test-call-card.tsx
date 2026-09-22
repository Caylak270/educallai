"use client";

import { useState } from "react";
import { CardHeader } from "./card-header";
import { clsx } from "@/lib/clsx";

type CallStatus = "idle" | "connecting" | "sent" | "failed";

type TestCallCardProps = {
  phone: string;
  onPhoneChange: (value: string) => void;
};

export function TestCallCard({ phone, onPhoneChange }: TestCallCardProps) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [note, setNote] = useState<string | null>(null);

  const triggerCall = async () => {
    if (status === "connecting") return;
    setStatus("connecting");
    setNote(null);
    // Girdiyi E.164'e çevir: "5XX XXX XX XX" → "+905XXXXXXXXX"
    const digits = (phone.match(/\d/g) ?? []).join("");
    const clean = digits.length >= 10 ? `+90${digits.slice(-10)}` : "";
    if (!clean) {
      setStatus("failed");
      setNote("Geçerli bir numara girin (örn. 5XX XXX XX XX).");
      return;
    }
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: clean,
          name: "Test Çağrısı",
          context: "Ayarlar test çağrısı",
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("sent");
        setNote(
          data.mode === "live"
            ? "Çağrı LiveKit üzerinden çevriliyor — telefonunuzu bekleyin!"
            : "Demo kaydı oluşturuldu — gerçek arama için LIVEKIT + NETGSM anahtarları gerekir."
        );
      } else {
        setStatus("failed");
        setNote(data.error ?? "Arama başlatılamadı.");
      }
    } catch {
      setStatus("failed");
      setNote("Sunucuya ulaşılamadı.");
    }
  };

  const resetLater = () => {
    setTimeout(() => {
      setStatus("idle");
      setNote(null);
    }, 8000);
  };

  return (
    <section className="flex flex-col gap-space-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
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
          onClick={() => {
            void triggerCall();
            resetLater();
          }}
          disabled={status === "connecting"}
          className={clsx(
            "flex w-full items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-md py-space-sm font-title-sm text-title-sm text-on-primary transition-all hover:bg-primary active:scale-[0.99]",
            status === "connecting" && "opacity-50"
          )}
        >
          <span
            className={clsx(
              "material-symbols-outlined text-[18px]",
              status === "connecting" && "animate-spin"
            )}
          >
            {status === "connecting" ? "refresh" : "ring_volume"}
          </span>
          <span>
            {status === "connecting"
              ? "Bağlanıyor..."
              : status === "sent"
                ? "Çağrı Gönderildi"
                : "Numarama Demo Çağrı Gönder"}
          </span>
        </button>

        <span
          className={clsx(
            "text-center font-label-sm text-label-sm",
            status === "sent" || status === "failed"
              ? "flex items-center justify-center gap-1"
              : "hidden",
            status === "failed" ? "text-error" : "text-secondary"
          )}
        >
          {status === "sent" || status === "failed" ? (
            <>
              <span className="material-symbols-outlined text-[14px]">
                {status === "sent" ? "done" : "error"}
              </span>
              {note}
            </>
          ) : null}
        </span>
      </div>
    </section>
  );
}
