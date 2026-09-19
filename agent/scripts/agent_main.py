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


def main() -> None:  # pragma: no cover - canlı ortam bloğu
    """LiveKit CLI worker'ını başlatır (anahtarlar olmadan çalışmaz)."""
    # --- Sağlayıcı import'ları YALNIZCA canlı çalıştırmada gerekli ---
    try:
        from livekit.agents import Agent, AgentSession, JobContext, cli, llm
        from livekit.plugins import anthropic, cartesia, deepgram, openai, silero
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

    async def entrypoint(ctx: JobContext) -> None:
        """Her gelen/giden arama için bir agent oturumu başlatır."""
        pipeline = CascadePipeline(config, capabilities)
        pipeline.prewarm()  # streaming overlap: bağlantıları önceden ısıt

        session = AgentSession(
            vad=pipeline.build_vad(),  # Silero — Pattern 5 kalibrasyonu
            stt=deepgram.STT(
                model=config.deepgram_model,
                language=config.deepgram_language,
                keyterms=config.dershane_keyterms,  # keyterm prompting
            ),
            llm=llm.FallbackAdapter(
                [
                    anthropic.LLM(model=config.llm_primary_model),  # Haiku 4.5
                    openai.LLM(model=config.llm_fallback_model),  # GPT-4o mini
                ]
            ),
            tts=NormalizingTTS(
                cartesia.TTS(
                    model=config.cartesia_model,
                    language=config.cartesia_language,
                    voice=config.cartesia_voice_id or None,
                )
            ),
        )

        class VeliPilotAgent(Agent):
            """System prompt + capability-filtreli araçlarla oturum ajanı."""

            def __init__(self) -> None:
                super().__init__(
                    instructions=build_system_prompt(
                        dershane_name=config.demo_dershane_id,
                        capabilities=capabilities,
                    ),
                    tools=pipeline.tool_definitions(),
                )

        await session.start(
            agent=VeliPilotAgent(),
            room=ctx.room,
        )
        # Sistem 5: outbound aramada cevaba kadar ambiyans maskeleme.
        logger.info("Ambiyans maskeleme: %s", pipeline.apply_ambiance_masking())

    cli.run_app(
        __import__("livekit.agents", fromlist=["WorkerOptions"]).WorkerOptions(
            entrypoint_fnc=entrypoint
        )
    )


if __name__ == "__main__":
    main()
