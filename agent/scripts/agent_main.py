"""Canlıya giriş noktası — LiveKit AgentSession bağlama taslağı.

ÖNEMLİ: Bu dosya **import edilebilir** olmalıdır; LiveKit anahtarları
olmadan çalışması beklenmez. Tüm sağlayıcı import'ları ``main()``
içinde yapılır; modül import edildiğinde hiçbir ağ/servis bağlantısı
kurulmaz.

Canlı çalıştırma (anahtarlar .env'de)::

    agent/.venv/Scripts/python -m agent.scripts.agent_main download-files
    agent/.venv/Scripts/python -m agent.scripts.agent_main dev

Kuyruk entegrasyonu notu: Giden arama (batch dialer) ve tahsilat
kampanyaları Node/BullMQ tarafında kuyruklanır; bu Python süreci
yalnızca LiveKit agent oturumunu çalıştırır ve dispatch eder.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

# Betik olarak doğrudan çalıştırıldığında repo kökünü sys.path'e ekle
# (import edilebilirlik kuralı).
_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

# Saf modüller her zaman import edilebilir (servis bağlantısı yok).
from agent.agent.capabilities import load_capabilities  # noqa: E402
from agent.agent.config import AgentConfig  # noqa: E402
from agent.agent.pipeline import CascadePipeline, NormalizingTTS  # noqa: E402
from agent.agent.prompts import build_system_prompt  # noqa: E402

logger = logging.getLogger("velipilot.agent")

# agent/.env dosyasını yükle (LiveKit/OpenAI/Deepgram/Cartesia anahtarları)
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except ImportError:  # python-dotenv yoksa ortam değişkenleri zaten set edilmeli
    pass


def main() -> None:  # pragma: no cover - canlı ortam bloğu
    """LiveKit CLI worker'ını başlatır (anahtarlar olmadan çalışmaz)."""
    # --- Sağlayıcı import'ları YALNIZCA canlı çalıştırmada gerekli ---
    try:
        from livekit.agents import Agent, AgentSession, JobContext, cli, function_tool, llm
        from livekit.plugins import cartesia, deepgram, openai, silero
    except ImportError as exc:
        raise SystemExit(
            "livekit-agents kurulu değil. Kurulum: "
            "agent/.venv/Scripts/pip install -r agent/requirements.txt"
        ) from exc

    config = AgentConfig.from_env()
    missing = config.missing_required_keys()
    if missing:
        raise SystemExit(
            f"Eksik .env anahtarları: {', '.join(k.upper() for k in missing)}"
        )

    capabilities = load_capabilities({"can_share_pricing": True})

    # Soğuk başlatma fix'i: bileşenler worker başlarken BİR KEZ kurulur.
    warm: dict = {}

    async def prewarm(ctx) -> None:
        pipeline = CascadePipeline(config, capabilities)
        pipeline.prewarm()
        warm["components"] = pipeline.assemble()
        logger.info("Prewarm: bileşenler sıcak hazır")

    def build_live_tools() -> list:
        """Capability Matrix'e göre livekit @function_tool araçları üretir.

        Not: livekit-agents 1.8 dict araç kabul etmiyor — gerçek fonksiyon
        araçları zorunlu. Yanıtlar demo; gerçek aksiyonlar Supabase/dialer
        bağlandığında buraya eklenir.
        """
        tools: list = []

        if capabilities.can_share_pricing:

            @function_tool
            async def quote_pricing(program: str) -> str:
                """Dershane programının fiyat bilgisini paylaşır.

                Args:
                    program: Program adı (örn. "YKS", "LGS", "etüt")
                """
                return (
                    f"{program} programımız aylık 12.000 TL'den başlıyor, "
                    "10 taksit imkânımız var. Kayıt öncesi seviye tespit "
                    "sınavımız ücretsiz."
                )

            tools.append(quote_pricing)

        if capabilities.can_create_appointment:

            @function_tool
            async def create_appointment(date_time: str, topic: str) -> str:
                """Kurum ziyareti veya seviye tespiti için randevu oluşturur.

                Args:
                    date_time: Randevu tarihi ve saati (örn. "cumartesi 14:00")
                    topic: Randevunun konusu
                """
                return (
                    f"Randevu alındı: {date_time} — {topic}. Konum ve "
                    "hatırlatıcı WhatsApp'tan iletilecek."
                )

            tools.append(create_appointment)

        if capabilities.can_check_exam_results:

            @function_tool
            async def check_exam_results(student_name: str) -> str:
                """Öğrencinin son deneme sınavı sonucunu özetler.

                Args:
                    student_name: Öğrencinin adı
                """
                return (
                    f"{student_name} için son deneme sonucu: 68 net, "
                    "sınıf ortalamasının 6 üzerinde. Detaylı analizi "
                    "görüşmede paylaşabilirim."
                )

            tools.append(check_exam_results)

        if capabilities.can_transfer_to_human:

            @function_tool
            async def transfer_to_human(reason: str) -> str:
                """Görüşmeyi insan danışmana aktarır.

                Args:
                    reason: Aktarım gerekçesi
                """
                return f"Danışmana aktarılıyorsunuz. Gerekçe: {reason}"

            tools.append(transfer_to_human)

        return tools

    async def entrypoint(ctx: JobContext) -> None:
        """Her gelen/giden arama için bir agent oturumu başlatır."""
        comps = warm.get("components")
        if comps is None:  # prewarm kaçtıysa yerinde kur
            pipeline = CascadePipeline(config, capabilities)
            pipeline.prewarm()
            comps = pipeline.assemble()

        session = AgentSession(
            vad=comps.vad,   # Silero — Pattern 5 (sıcak)
            stt=comps.stt,   # Deepgram nova-3 tr + keyterms
            llm=comps.llm,   # GPT-4o mini birincil (FallbackAdapter)
            tts=comps.tts,   # Cartesia + Pattern 8 streaming normalizasyon
        )

        class VeliPilotAgent(Agent):
            """System prompt + capability-filtreli araçlarla oturum ajanı."""

            def __init__(self) -> None:
                super().__init__(
                    instructions=build_system_prompt(
                        dershane_name="Limit Dershane",
                        capabilities=capabilities,
                    ),
                    tools=build_live_tools(),
                )

        await session.start(
            agent=VeliPilotAgent(),
            room=ctx.room,
        )
        # Sistem 5: outbound aramada cevaba kadar ambiyans maskeleme.
        logger.info("Ambiyans maskeleme: %s", pipeline.apply_ambiance_masking())

        # ── DOLGU SESİ (ölü sessizlik = hat düştü hissi) ─────────────
        # Kullanıcı turunu bitirdikten ~1.3 sn içinde yanıt başlamadıysa
        # kısa doğal dolgu söylenir; ajan konuşmaya başlayınca iptal edilir.
        import asyncio
        import random

        fillers = [
            "Bir saniye, bakayım.",
            "Hım, şimdi bakıyorum.",
            "Tamam, bir saniye.",
        ]
        state = {"speaking": False, "task": None}

        @session.on("agent_state_changed")
        def _on_agent_state(ev) -> None:
            state["speaking"] = getattr(ev, "state", "") == "speaking"
            if state["speaking"] and state["task"] and not state["task"].done():
                state["task"].cancel()

        @session.on("user_input_committed")
        def _on_user_committed(_ev) -> None:
            async def _maybe_filler() -> None:
                try:
                    await asyncio.sleep(1.3)
                    if not state["speaking"]:
                        await session.say(
                            random.choice(fillers),
                            allow_interruptions=True,
                            add_to_chat_ctx=False,
                        )
                except asyncio.CancelledError:
                    pass

            state["task"] = asyncio.create_task(_maybe_filler())

    cli.run_app(
        __import__("livekit.agents", fromlist=["WorkerOptions"]).WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )


if __name__ == "__main__":
    main()
