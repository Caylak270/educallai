"use client";

import { useEffect, useRef, useState } from "react";

import { waLink } from "@/components/site/links";

/*
  Test çağrısı formu — otomatik arama YAPMAZ (token/maliyet sıfır):
  girdileri WhatsApp mesajına çevirip satış numarasına iletir; test
  çağrısını ekip manuel olarak planlayıp yapar.
*/
export function CallTestForm() {
  const [sent, setSent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <>
      <form
        className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const name = String(data.get("name") || "").trim();
          const phone = String(data.get("phone") || "").trim();
          const scenario = String(data.get("scenario") || "");
          const message = `Merhaba, ben ${name}. Ücretsiz test çağrısı almak istiyorum (${scenario}). Numaram: ${phone}`;
          window.open(waLink(message), "_blank", "noopener,noreferrer");
          setSent(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setSent(false), 8000);
        }}
      >
        <input
          className="w-full rounded-lg border border-obsidian-border bg-obsidian-canvas px-3 py-2 text-[13px] text-surface-container-lowest focus:border-primary focus:outline-none"
          placeholder="Adınız Soyadınız"
          name="name"
          required
          type="text"
        />
        <input
          className="w-full rounded-lg border border-obsidian-border bg-obsidian-canvas px-3 py-2 font-mono text-[13px] text-surface-container-lowest focus:border-primary focus:outline-none"
          placeholder="05XX XXX XX XX"
          name="phone"
          required
          type="tel"
        />
        <select
          className="w-full rounded-lg border border-obsidian-border bg-obsidian-canvas px-3 py-2 text-[13px] text-surface-container-lowest focus:border-primary focus:outline-none"
          name="scenario"
          defaultValue="Dershane Erken Kayıt Senaryosu"
        >
          <option>Dershane Erken Kayıt Senaryosu</option>
          <option>Deneme Sınavı Net Alarmı</option>
          <option>Taksit &amp; Muhasebe Bilgilendirmesi</option>
        </select>
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 font-title-md text-[13px] text-on-primary shadow-md transition-all hover:bg-primary-container"
          type="submit"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>{" "}
          WhatsApp&apos;tan İlet
        </button>
      </form>
      <div
        className={`mt-2 rounded bg-voice-teal/20 p-2 text-center font-mono text-[11px] text-voice-teal ${
          sent ? "" : "hidden"
        }`}
      >
        ✓ WhatsApp açıldı — mesajı göndermanız yeterli, test çağrınızı biz
        planlıyoruz.
      </div>
    </>
  );
}
