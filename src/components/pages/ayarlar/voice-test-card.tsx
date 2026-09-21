"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CardHeader } from "./card-header";
import { clsx } from "@/lib/clsx";

type TestPhase = "idle" | "connecting" | "waiting-agent" | "live" | "error";

/** Sesli Test kartı — dashboard'dan seçilen ajan ayarlarıyla canlı konuşma.
 *  Token: /api/agent-test-token → agent-test-* odası → dev worker oturumu
 *  otomatik alır → ajan agent-settings.json'daki SON ayarlarla konuşur. */
export function VoiceTestCard() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<import("livekit-client").Room | null>(null);
  const audioElsRef = useRef<HTMLAudioElement[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    for (const el of audioElsRef.current) {
      el.remove();
    }
    audioElsRef.current = [];
    roomRef.current = null;
    setSeconds(0);
  }, []);

  useEffect(() => {
    return () => {
      void roomRef.current?.disconnect();
      cleanup();
    };
  }, [cleanup]);

  const start = useCallback(async () => {
    setPhase("connecting");
    setError(null);
    try {
      const res = await fetch("/api/agent-test-token", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Token alınamadı");
      }
      const { token, url } = (await res.json()) as { token: string; url: string };

      const { Room, RoomEvent } = await import("livekit-client");
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.ParticipantConnected, () => {
        // Bu odada tek diğer katılımcı ajandır (dev worker otomatik kabul eder)
        setPhase("live");
        timerRef.current = setInterval(
          () => setSeconds((s) => s + 1),
          1000,
        );
      });
      room.on(RoomEvent.TrackSubscribed, (track) => {
        // Ajan sesi tarayıcıda çalınır (gizli audio element)
        const el = track.attach();
        el.style.display = "none";
        document.body.appendChild(el);
        audioElsRef.current.push(el);
      });
      room.on(RoomEvent.Disconnected, () => {
        cleanup();
        setPhase("idle");
      });

      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);

      // Ajan zaten odadaysa (hızlı dispatch) hemen canlıya geç
      const agentHere = [...room.remoteParticipants.values()].length > 0;
      setPhase(agentHere ? "live" : "waiting-agent");
      if (agentHere) {
        timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bağlantı kurulamadı");
      setPhase("error");
      cleanup();
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    void roomRef.current?.disconnect();
    cleanup();
    setPhase("idle");
  }, [cleanup]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const phaseMeta: Record<TestPhase, { dot: string; text: string }> = {
    idle: { dot: "bg-outline", text: "Hazır" },
    connecting: { dot: "bg-tertiary animate-pulse", text: "Bağlanıyor…" },
    "waiting-agent": {
      dot: "bg-tertiary animate-pulse",
      text: "Bağlandı — ajan katılıyor, mikrofon açık",
    },
    live: { dot: "bg-secondary animate-pulse", text: "Ajan dinliyor — konuşabilirsin" },
    error: { dot: "bg-error", text: "Hata" },
  };
  const meta = phaseMeta[phase];

  return (
    <section className="flex flex-col gap-space-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
      <CardHeader
        icon="mic"
        className="pb-space-xs"
        title="Sesli Test"
        description="Yukarıda uyguladığın son ayarlarla ajanla canlı konuş — mikrofon iznini onayla."
      />

      <div className="flex items-center gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
        <span className={clsx("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
        <span className="flex-1 font-body-sm text-body-sm text-on-surface">{meta.text}</span>
        {phase === "live" ? (
          <span className="font-mono-data text-mono-data font-bold text-secondary">
            {mm}:{ss}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg bg-error-container/60 p-space-sm font-body-sm text-body-sm text-on-error-container">
          {error}
        </p>
      ) : null}

      {phase === "idle" || phase === "error" ? (
        <button
          type="button"
          onClick={() => void start()}
          className="flex items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-lg py-space-sm font-title-sm text-title-sm font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_circle
          </span>
          <span>Sesli Testi Başlat</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={stop}
          className="flex items-center justify-center gap-space-xs rounded-xl bg-error-container px-space-lg py-space-sm font-title-sm text-title-sm font-semibold text-on-error-container transition-all hover:bg-error hover:text-on-error active:scale-[0.98]"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            stop_circle
          </span>
          <span>Testi Bitir</span>
        </button>
      )}

      <p className="text-center font-body-sm text-body-sm text-[11px] text-on-surface-variant">
        Testten önce <strong>Ajan&apos;a Uygula</strong>&apos;ya bas — test, kayıtlı son
        ayarlarla açılır. Görüşme transkripti CRM&apos;e yazılır.
      </p>
    </section>
  );
}
