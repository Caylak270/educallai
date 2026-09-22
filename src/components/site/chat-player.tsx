"use client";

import { useEffect, useState } from "react";

import { clsx } from "@/lib/clsx";

export type ChatMsg = { from: "ai" | "parent" | "system"; text: string };
export type ChatScenario = { id: string; label: string; messages: ChatMsg[] };

/*
  Kendiliğinden oynayan WhatsApp sohbeti (chatflow.muratify.com vitrin
  mantığı): mesajlar yazılıyor efektiyle tek tek düşer, senaryo bitince
  birkaç saniye bekler ve sıradaki senaryoya geçer.
*/
export function ChatPlayer({
  scenarios,
  className,
}: {
  scenarios: ChatScenario[];
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(true);
  const scenario = scenarios[idx];

  useEffect(() => {
    let cancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        timers.push(setTimeout(res, ms));
      });

    (async () => {
      setCount(0);
      setTyping(true);
      await wait(800);
      for (let i = 0; i < scenario.messages.length; i++) {
        if (cancelled) return;
        setTyping(true);
        await wait(scenario.messages[i].from === "system" ? 700 : 1200);
        if (cancelled) return;
        setTyping(false);
        setCount(i + 1);
        await wait(650 + Math.min(1100, scenario.messages[i].text.length * 11));
      }
      if (cancelled) return;
      await wait(3200);
      if (cancelled) return;
      setIdx((i) => (i + 1) % scenarios.length);
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [idx, scenario, scenarios.length]);

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-2xl",
        className
      )}
    >
      {/* WhatsApp başlık çubuğu */}
      <div className="flex items-center justify-between gap-3 border-b border-obsidian-border bg-[#075E54]/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-primary">
            AI
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-white">educallai Asistanı</p>
            <p className="flex items-center gap-1 text-[11px] text-emerald-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              çevrimiçi · 7/24
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
          canlı
        </span>
      </div>

      {/* Mesaj alanı */}
      <div className="flex h-[380px] flex-col justify-end gap-2 overflow-hidden bg-[#0B141A] px-4 py-4">
        {scenario.messages.slice(0, count).map((msg, i) => (
          <ChatBubble key={`${scenario.id}-${i}`} msg={msg} animated />
        ))}
        {typing && (
          <div className="chat-in flex w-max items-center gap-1 rounded-2xl rounded-bl-sm bg-[#1F2C33] px-3 py-2.5">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="h-1.5 w-1.5 rounded-full bg-slate-400"
                style={{ animation: `typing-blink 1.1s ${d * 0.18}s infinite` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Senaryo seçici */}
      <div className="flex gap-1.5 border-t border-obsidian-border bg-obsidian-canvas/80 px-3 py-2.5">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIdx(i)}
            aria-pressed={i === idx}
            className={clsx(
              "flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
              i === idx
                ? "bg-primary text-on-primary"
                : "text-outline-variant hover:text-surface-container-lowest"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Statik sohbet balonu — server bileşenlerde diyalog örnekleri için */
export function ChatBubble({
  msg,
  animated,
}: {
  msg: ChatMsg;
  animated?: boolean;
}) {
  if (msg.from === "system") {
    return (
      <div
        className={clsx(
          "mx-auto w-max max-w-full rounded-full bg-white/5 px-3 py-1 text-center text-[10.5px] text-emerald-300",
          animated && "chat-in"
        )}
      >
        {msg.text}
      </div>
    );
  }
  const isAi = msg.from === "ai";
  return (
    <div className={clsx("flex", isAi ? "justify-start" : "justify-end")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed",
          animated && "chat-in",
          isAi
            ? "rounded-bl-sm bg-[#1F2C33] text-slate-100"
            : "rounded-br-sm bg-[#005C4B] text-white"
        )}
      >
        {msg.text}
      </div>
    </div>
  );
}
