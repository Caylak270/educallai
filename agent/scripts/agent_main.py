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
import os
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
from agent.agent.settings import apply_to_config as apply_settings_to_config  # noqa: E402
from agent.agent.settings import load_agent_settings  # noqa: E402
from agent.agent.prompt_settings import build_prompt_block, load_agent_prompt  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

logger = logging.getLogger("velipilot.agent")

# agent/.env dosyasını yükle (LiveKit/OpenAI/Deepgram/Cartesia anahtarları)
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except ImportError:  # python-dotenv yoksa ortam değişkenleri zaten set edilmeli
    pass


class RecordSignalsArgs(BaseModel):
    """Pattern 1 — LLM'in her turda kaydedeceği sinyaller."""

    sentiment: str = Field(description="veli duygusu: positive / neutral / negative")
    intent: str = Field(description="niyet: kayit_talebi / fiyat_sorusu / deneme_istegi / randevu_talebi / diger")
    lead_temperature: str = Field(description="hot / warm / cold")
    enrollment_readiness: float = Field(description="0.0-1.0 arası kayda hazırlık")
    payment_objection: str | None = Field(default=None, description="ödeme itirazı notu, yoksa null")
    recommend_handoff: bool = Field(default=False, description="insan danışmana aktarım önerildi mi")


def main() -> None:  # pragma: no cover - canlı ortam bloğu
    """LiveKit CLI worker'ını başlatır (anahtarlar olmadan çalışmaz)."""
    # --- Sağlayıcı import'ları YALNIZCA canlı çalıştırmada gerekli ---
    try:
        from livekit.agents import (
            Agent,
            AgentSession,
            JobContext,
            RoomInputOptions,
            cli,
            function_tool,
            llm,
        )
        from livekit.plugins import cartesia, deepgram, openai, silero
        from livekit.plugins.noise_cancellation import BVC
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

    # Soğuk başlatma fix'i: bileşenleri PROSES BAŞLANGICINDA kur (ONNX ~350ms,
    # SSL context'ler — ilk bağlantıdaki gecikmeyi tamamen kaldırır).
    warm: dict = {}
    try:
        warm["components"] = CascadePipeline(config, capabilities).assemble()
        print("[velipilot] Sıcak bileşenler başlangıçta kuruldu ✓")
    except Exception as exc:
        print(f"[velipilot] Başlangıç kurulumu atlandı: {exc}")

    def prewarm(proc) -> None:
        # DİKKAT: livekit prewarm_fnc SENKRON'dur (Callable[[JobProcess], Any])
        # ve JobProcess alır — async yazarsak sessizce hiç çalışmaz
        # ("coroutine was never awaited" uyarısıyla: gecikme paketi öncesi durum).
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
        # Yerel import'lar — fonksiyon içi import = tüm fonksiyonda lokal;
        # kullanımdan ÖNCE gelmeli.
        import asyncio
        import os
        import random
        import time as _time
        import httpx
        import numpy as np
        from livekit import rtc
        from livekit.plugins import openai as openai_plugin
        from openai.types import realtime as _oai_realtime

        # ── Dashboard-canlı ayarlar: her görüşmede TAZE okunur ──────
        # Dashboard (Ayarlar → AI Ses ve Ton Seçimi) agent-settings.json'a
        # yazar; burada okunması yeterli — ajan restart GEREKMEZ.
        settings = load_agent_settings()
        live_config = apply_settings_to_config(settings, AgentConfig.from_env())
        use_realtime = settings.use_realtime
        if use_realtime is None:  # tercihi yoksa .env'deki REALTIME_MODE karar verir
            use_realtime = os.environ.get("REALTIME_MODE") == "1"
        turn_close_ms = settings.turn_close_ms or 180  # dengeli: bölme yok (test matrisi)
        logger.info(
            "Canlı ayarlar: mod=%s ses=%s hız=%s tur_ms=%s rt_ses=%s",
            settings.mode or "env",
            settings.voice or "varsayılan",
            settings.speech_speed or "varsayılan",
            turn_close_ms,
            settings.realtime_voice or "varsayılan",
        )

        comps = warm.get("components")
        # Cartesia ses gerektiren modlar (natural + hybrid): ses cinsiyeti/hız
        # tercihini TAZE TTS ile uygula (VAD/STT/LLM sıcak kalır).
        if not use_realtime or settings.mode == "hybrid":
            voice_pipeline = CascadePipeline(live_config, capabilities)
            if comps is None:
                voice_pipeline.prewarm()
                comps = voice_pipeline.assemble()
            else:
                comps.tts = voice_pipeline.build_tts()
        elif comps is None:  # saf Realtime modda zincir kurulmaz ama emniyet
            comps = CascadePipeline(live_config, capabilities).assemble()

        # AĞ ISITMA: ilk veli turundan ÖNCE bağlantıları aç — soğuk connect
        # (1-1.5s) velinin ilk sorusu gelmeden eritilir. Moda göre ısıtılır.
        async def _warm_network() -> None:
            try:
                if use_realtime and settings.mode != "hybrid":
                    return  # Realtime bağlantısı session.start ile açılır
                if not (use_realtime and settings.mode == "hybrid"):
                    chat_ctx = llm.ChatContext()
                    chat_ctx.add_message(role="user", content="Merhaba")
                    stream = comps.llm.chat(chat_ctx=chat_ctx)
                    async for _chunk in stream:
                        break  # ilk parça: LLM bağlantısı açıldı
                tts_stream = comps.tts.stream()
                tts_stream.push_text("Merhaba.")
                tts_stream.end_input()
                async for _frame in tts_stream:
                    break  # ilk frame: Cartesia bağlantısı açıldı
                logger.info("Ağ ısıtma: bağlantılar sıcak (mod=%s)", settings.mode or "env")
            except Exception as exc:
                logger.warning("Ağ ısıtma atlandı: %s", str(exc)[:120])

        asyncio.create_task(_warm_network())

        common = dict(
            # ── Gecikme + doğal turn-taking ──
            preemptive_generation=True,   # EOT beklemeden LLM'i başlat
            min_endpointing_delay=max(0.12, min(0.5, turn_close_ms / 1000)),
            max_endpointing_delay=1.2,    # belirsiz turlarda bile ≤1.2 sn
            allow_interruptions=True,
            min_interruption_duration=0.2,
            resume_false_interruption=True,   # "hı hı" gibi sesler cümleyi bozmasın
            false_interruption_timeout=2.0,
        )
        if use_realtime and settings.mode != "hybrid":
            # OpenAI Realtime: STT+LLM+TTS tek bağlantı — en düşük gecikme yolu.
            rt_voice = settings.realtime_voice or os.environ.get("REALTIME_VOICE", "marin")
            session = AgentSession(
                llm=openai_plugin.realtime.RealtimeModel(
                    model="gpt-realtime",
                    voice=rt_voice,
                    modalities=["text", "audio"],
                    # gpt-4o-mini-transcribe: whisper-1'den daha iyi TR doğruluk,
                    # benzer gecikme (plugin'in kendi default'u da bu).
                    input_audio_transcription={
                        "model": "gpt-4o-mini-transcribe",
                        "language": "tr",
                    },
                    # ServerVAD: veli sustuktan turn_close_ms sonra turu kapat —
                    # dashboard'dan ayarlanır (180ms = bölmesiz dengeli değer).
                    # dict DEĞİL, typed object (eklenti typed bekliyor).
                    turn_detection=_oai_realtime.realtime_audio_input_turn_detection.ServerVad(
                        type="server_vad",
                        create_response=True,
                        interrupt_response=True,
                        threshold=0.6,          # nefes/patlama yanlış turu önler
                        prefix_padding_ms=min(150, int(turn_close_ms * 0.8)),
                        silence_duration_ms=turn_close_ms,
                    ),
                ),
                **common,
            )
        elif use_realtime and settings.mode == "hybrid":
            # HİBRİT: Realtime sadece BEYİN (metin üretir, ses üretmez) —
            # seslendirmeyi Cartesia yapar. Realtime'ın hızlı zekâsı +
            # Cascade'in doğal TR sesi (dashboard'da 'Hibrit' modu).
            session = AgentSession(
                llm=openai_plugin.realtime.RealtimeModel(
                    model="gpt-realtime",
                    modalities=["text"],  # ← ses YOK; metin → Cartesia TTS
                    input_audio_transcription={
                        "model": "gpt-4o-mini-transcribe",
                        "language": "tr",
                    },
                    turn_detection=_oai_realtime.realtime_audio_input_turn_detection.ServerVad(
                        type="server_vad",
                        create_response=True,
                        interrupt_response=True,
                        threshold=0.6,
                        prefix_padding_ms=min(150, int(turn_close_ms * 0.8)),
                        silence_duration_ms=turn_close_ms,
                    ),
                ),
                tts=comps.tts,   # Cartesia + Pattern 8 streaming normalizasyon
                **common,
            )
        else:
            session = AgentSession(
                vad=comps.vad,   # Silero — Pattern 5 (sıcak)
                stt=comps.stt,   # Deepgram nova-3 tr + keyterms
                llm=comps.llm,   # GPT-4o mini birincil (FallbackAdapter)
                tts=comps.tts,   # Cartesia + Pattern 8 streaming normalizasyon
                **common,
            )

        # ── Oturum veri toplama (CRM'e yazım için) ─────────────────

        state = {"speaking": False, "task": None, "interrupted": False}
        state["items"] = []       # [(role, text)]
        state["signals"] = []     # record_signals çıktıları
        state["start"] = _time.time()
        state["eot_ts"] = None    # kullanıcının SON SES anı (hissiyat ölçümü)
        state["eot_arrival"] = None  # VAD'ın tur kapatma kararının geldiği an
        state["user_speaking"] = False
        state["filler_said"] = False  # tur başına tek dolgu

        @session.on("conversation_item_added")
        def _on_item(ev) -> None:
            text = getattr(ev.item, "text_content", None) or ""
            if not text:
                content = getattr(ev.item, "content", None) or []
                text = " ".join(str(x) for x in content)
            if text.strip():
                state["items"].append((str(getattr(ev.item, "role", "user")), text))
            if str(getattr(ev.item, "role", "")) == "assistant":
                # MetricsReport bir dict (TypedDict); e2e_latency = kullanıcı
                # sustu → ajanın ilk sesi (asıl hedef metrik, ms×1000).
                m = getattr(ev.item, "metrics", None) or {}
                e2e = m.get("e2e_latency")
                logger.info(
                    "TUR SÜRESİ: eot→ilk ses=%sms (eot=%sms, stt=%sms)",
                    round(e2e * 1000) if e2e is not None else "N/A",
                    round(m["end_of_turn_delay"] * 1000)
                    if m.get("end_of_turn_delay") is not None
                    else "N/A",
                    round(m["transcription_delay"] * 1000)
                    if m.get("transcription_delay") is not None
                    else "N/A",
                )

        @function_tool
        async def record_signals(args: RecordSignalsArgs) -> str:
            """Her dönüşün sonunda veli hakkında çıkardığın sinyalleri kaydet.

            Args:
                args: Duygu, niyet ve kayda hazırlık sinyalleri
            """
            state["signals"].append(args.model_dump())
            return "Sinyaller kaydedildi."

        live_tools = build_live_tools()
        live_tools.append(record_signals)

        # Dashboard "Ajan Promptu" tercihleri — her görüşmede TAZE okunur
        agent_prompt = load_agent_prompt()
        prompt_block = build_prompt_block(agent_prompt)
        logger.info(
            "Ajan promptu: ad=%s greeting=%s blok=%s",
            agent_prompt.assistant_name or "-",
            agent_prompt.greeting or "-",
            f"tam denetim {len(prompt_block)} kr"
            if agent_prompt.instructions and prompt_block
            else (f"{len(prompt_block)} kr" if prompt_block else "boş"),
        )

        class VeliPilotAgent(Agent):
            """System prompt + capability-filtreli araçlarla oturum ajanı."""

            def __init__(self) -> None:
                super().__init__(
                    instructions=build_system_prompt(
                        dershane_name="Limit Dershane",
                        capabilities=capabilities,
                        custom_block=prompt_block,
                        # Yönetici talimat girdiyse o talimat ANA GÖVDE olur
                        custom_full=bool(agent_prompt.instructions),
                        kvkk_enabled=agent_prompt.kvkk_enabled,
                        kvkk_text=agent_prompt.kvkk_text,
                    ),
                    tools=live_tools,
                )

        await session.start(
            agent=VeliPilotAgent(),
            room=ctx.room,
            # LiveKit Cloud BVC gürültü engelleme (Builder'daki Quali VF S
            # eşdeğeri) — mikrofon/gürültü filtresi, tüm modlarda etkin.
            # NOT: BVC gürültü engelleme geçici kaldırıldı — RoomIO input
            # kurulumunu takıyordu (ajan ses track'i hiç publish etmiyordu).
            # accepted_sources default [MICROPHONE] ile sorun yok.
            # room_input_options=RoomInputOptions(noise_cancellation=BVC()),
        )

        # ── PROAKTİF KARŞILAMA (geçici devre dışı) ───────────────────
        # Not: session.say RoomIO hazır olmadan çağrılınca input stream
        # takılıyordu; greeting talimatı promptta kaldığından ajan ilk
        # yanıtında yine "Merhaba iyi günler." ile açılıyor (23:58 kanıt).
        # Sistem 5 (canlı): ambiyans maskeleme — yumuşak kahverengi gürültü,
        # ajan konuşurken kısılır (fade), hat düştü hissini engeller.

        async def ambience_task() -> None:
            """Dershane ortam sesi: yumuşak uğultu + klavye tık patlamaları."""
            source = rtc.AudioSource(24000, 1)
            track = rtc.LocalAudioTrack.create_audio_track("ambience", source)
            await ctx.room.local_participant.publish_track(track)

            rng = np.random.default_rng(7)
            sr = 24000
            loop_sec = 24
            n = sr * loop_sec
            # Uğultu yatağı (kahverengi gürültü, DC düzeltilmiş)
            white = rng.standard_normal(n) * 0.02
            bed = np.cumsum(white)
            bed -= np.linspace(bed[0], bed[-1], n)
            bed /= (np.max(np.abs(bed)) + 1e-9)
            audio = bed * 0.35
            # Klavye tık patlamaları: 3-8 hızlı tık + 1-4 sn sessizlik
            t = 0.0
            while t < loop_sec - 0.05:
                burst = rng.integers(3, 9)
                for _ in range(burst):
                    pos = int(t * sr)
                    dur = int(rng.uniform(0.004, 0.012) * sr)
                    if pos + dur >= n:
                        break
                    click = rng.standard_normal(dur) * np.exp(-np.linspace(0, 6, dur))
                    audio[pos : pos + dur] += click * rng.uniform(0.05, 0.16)
                    t += rng.uniform(0.05, 0.18)
                t += rng.uniform(1.0, 4.0)
            audio = np.tanh(audio * 1.4)  # yumuşak doyurma
            loop = (audio * 32767 * 0.5).astype(np.int16)  # master ~%50
            loop_frames = [
                rtc.AudioFrame(loop[i : i + sr].tobytes(), sr, 1, sr)
                for i in range(0, len(loop), sr)
            ]

            gain = 0.35
            idx = 0
            while True:
                if state["speaking"]:
                    target = 0.10  # ajan konuşurken neredeyse kapat
                else:
                    target = 0.55
                gain += (target - gain) * 0.08
                frame = loop_frames[idx % len(loop_frames)]
                data = (np.frombuffer(frame.data, dtype=np.int16) * gain).astype(np.int16).tobytes()
                out = rtc.AudioFrame(data, sr, 1, frame.samples_per_channel)
                await source.capture_frame(out)
                idx += 1
                await asyncio.sleep(0)

        amb = asyncio.create_task(ambience_task())

        # ── Oturum sonu: transkript + sinyalleri Supabase'e yaz ────

        async def save_to_crm() -> None:
            if not state["items"]:
                return
            duration = int(_time.time() - state["start"])
            transcript = "\n".join(
                f"{'Veli' if role == 'user' else 'Asistan'}: {text}"
                for role, text in state["items"]
            )
            last_sig = state["signals"][-1] if state["signals"] else {}
            payload = {
                "contact_id": "33333333-3333-4333-8333-000000000001",  # demo test velisi
                "dershane_id": "11111111-1111-4111-8111-111111111111",
                "channel": "voice",
                "direction": "inbound",
                "sentiment": last_sig.get("sentiment") or "neutral",
                "intent": last_sig.get("intent") or "test_gorusmesi",
                "lead_temperature": last_sig.get("lead_temperature") or "warm",
                "enrollment_readiness": float(last_sig.get("enrollment_readiness") or 0.5),
                "recommend_handoff": bool(last_sig.get("recommend_handoff", False)),
                "transcript": transcript,
                "duration_seconds": duration,
            }
            try:
                async with httpx.AsyncClient(timeout=10) as hc:
                    res = await hc.post(
                        f"{config.supabase_url}/rest/v1/conversation_signals",
                        headers={
                            "apikey": config.supabase_service_key,
                            "Authorization": f"Bearer {config.supabase_service_key}",
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal",
                        },
                        json=payload,
                    )
                logger.info("CRM kaydı: %s (%s)", res.status_code, transcript[:60])
            except Exception as exc:  # CRM yazımı oturumu düşürmesin
                logger.warning("CRM kaydı başarısız: %s", str(exc)[:120])

        ctx.add_shutdown_callback(save_to_crm)

        # ── DOLGU SESİ (backchannel) ─────────────────────────────────
        # Veli sustuktan ~0.9 sn içinde yanıt başlamadıysa KISA nötr bir
        # dolgu söylenir (tur başına TEK — "bakayım" spam'i doğal değil);
        # ajan konuşmaya başlayınca iptal edilir.

        fillers = [
            "Hımm.",
            "Bir saniye.",
        ]
        @session.on("agent_state_changed")
        def _on_agent_state(ev) -> None:
            speaking = getattr(ev, "new_state", "") == "speaking"
            state["speaking"] = speaking
            if speaking and state["task"] and not state["task"].done():
                state["task"].cancel()
            # İki ayrı ölçüm (hedef metrik ilki):
            #  son_ses→ilk ses : velinin hissettiği TOPLAM bekleme (VAD kararı dahil)
            #  karar→ilk ses   : VAD kararından sonra motorun hızı (LLM+ilk ses)
            if speaking and state["eot_ts"] is not None:
                now = _time.time()
                logger.info(
                    "TUR SÜRESİ: son_ses→ilk ses=%dms (karar→ses=%dms)",
                    round((now - state["eot_ts"]) * 1000),
                    round((now - state["eot_arrival"]) * 1000)
                    if state["eot_arrival"] is not None
                    else 0,
                )
                state["eot_ts"] = None
                state["eot_arrival"] = None

        @session.on("agent_state_changed")
        def _mark_interrupt(ev) -> None:
            # ajan konuşuyorken kullanıcı mikrofonu açarsa = söz kesildi
            if getattr(ev, "new_state", "") == "listening" and state["speaking"]:
                state["interrupted"] = True

        @session.on("metrics_collected")
        def _on_metrics(ev) -> None:
            m = getattr(ev, "metrics", None)
            typ = getattr(m, "type", "?")
            ttfb = getattr(m, "ttfb", None)
            total = getattr(m, "total_latency", None) or getattr(m, "duration", None)
            if typ == "llm_metrics" or (ttfb is not None):
                logger.info("GECİKME: tip=%s ttfb=%s toplam=%s", typ, ttfb, total)

        @session.on("user_state_changed")
        def _on_user_state(ev) -> None:
            """Kullanıcı konuşmayı bitirdiğinde eot zamanını işaretle ve
            gerektiğinde dolgu sesi kur. Not: user_input_committed Realtime
            (speech-to-speech) modda tetiklenmiyor; bu event her iki modda gelir.
            Alan adları: new_state / created_at (UserStateChangedEvent)."""
            st = getattr(ev, "new_state", "")
            # created_at = kullanıcının son ses anı (varsa) — en doğru eot
            ts = getattr(ev, "created_at", None) or _time.time()
            if st == "speaking":
                state["user_speaking"] = True
                state["filler_said"] = False  # yeni tur → dolgu hakkı sıfırlanır
            elif st == "listening" and state["user_speaking"]:
                state["user_speaking"] = False
                # created_at = son gerçek ses anı (hissiyat); arrival = kararın
                # geldiği an. İkisi arası = VAD'ın bekleme süresi.
                state["eot_ts"] = ts  # kullanıcı sustu → ilk sesi saymaya başla
                state["eot_arrival"] = _time.time()
                if state.get("interrupted"):
                    # söz kesildi → filler yok, kısa onay ver
                    async def _ack() -> None:
                        await session.say(
                            random.choice(["Efendim?", "Buyrun, dinliyorum."]),
                            allow_interruptions=True,
                            add_to_chat_ctx=False,
                        )
                        state["interrupted"] = False
                    state["task"] = asyncio.create_task(_ack())
                else:
                    async def _maybe_filler() -> None:
                        try:
                            # 900ms backchannel + TUR BAŞINA TEK: her duraklamada
                            # "bir saniye bakayım" spam'i doğal değil (veli
                            # "kafayı yedi" dedi) — kısa nötr dolgular, tek sefer.
                            await asyncio.sleep(0.9)
                            if not state["speaking"] and not state["filler_said"]:
                                state["filler_said"] = True
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
            agent_name=os.environ.get("AGENT_NAME", ""),  # dispatch için isimli ajan
        )
    )


if __name__ == "__main__":
    main()
