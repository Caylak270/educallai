"""Cascade Pipeline iskeleti — VAD → STT → LLM → TTS bileşen bağlaması.

Şema (Pattern B: sinyal kaydı ve KB ön-çekme yan aktişimlerde yürür,
konuşma akışını bloklamaz)::

    [Telefon / LiveKit Cloud]
        │
        ▼
    [Silero VAD]  ── barge-in kararı (Pattern 6 speech gating)
        │ konuşma başladı
        ▼
    [Deepgram Nova-3 STT]  lang="tr" + keyterm prompting
        │ interim transcript ──────────────► [KB Prefetch (Pattern 7)]
        │ final transcript                          │ (paralel)
        ▼                                          │
    [LLM: Claude Haiku 4.5]                        │
      FallbackAdapter → Claude Haiku (yedek)        │
        │ ilk cümle token'ları                     │
        ├───────────────► [record_signals (Pattern B, paralel)]
        ▼                                          │
    [Türkçe TTS normalizasyonu (Pattern 8)] ◄──────┘
        ▼
    [Cartesia Sonic 3.6 TTS] ──► [Ambiyans maskeleme hook'u (Sistem 5)]

**Streaming overlap notları (gecikme bütçesi <600 ms):**

* STT interim transcript LLM turunu **bekletmeden** KB prefetch'i ateşler.
* LLM yanıtını cümle parçaları halinde stream eder; TTS ilk parçayla
  birlikte başlar (metnin tamamı beklenmez).
* ``record_signals`` çağrısı ayrı bir görevde yürütülür; yanıt akışını
  durdurmaz (Pattern B).
* ``prewarm()``: outbound aramanın çalma (ring) anında STT/TTS/WebRTC
  bağlantıları ısıtılır; veli açtığında ilk token süresi kısalır.

Bu modülde LiveKit/sağlayıcı import'ları ``try/except ImportError`` ile
korunur: kütüphaneler kurulu değilken bile dosya import edilebilir ve
``assemble()`` bileşen yerine not listesi döndürür.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from . import kb
from .capabilities import DershaneCapabilities, filter_tools
from .config import AgentConfig
from .signals import build_record_signals_tool
from .tts_normalize import normalize_for_tts
from .vad import DEFAULT_TURKISH_VAD, TurkishVADConfig

logger = logging.getLogger(__name__)

try:  # LiveKit Agents SDK — yalnızca canlı ortamda gerekli.
    from livekit import api as lk_api  # noqa: F401  (tip/bağlam için)
    from livekit.agents import llm as lk_llm  # type: ignore[attr-defined]

    LIVEKIT_AVAILABLE: bool = True
except ImportError:  # pragma: no cover - iskelet/test ortamı
    lk_llm = None  # type: ignore[assignment]
    LIVEKIT_AVAILABLE = False


@dataclass
class PipelineComponents:
    """``assemble()`` çıktısı: bağlı bileşenler + ortam notları."""

    vad: Any | None = None
    stt: Any | None = None
    llm: Any | None = None
    tts: Any | None = None
    #: Kurulum sırasında toplanan uyarı/eksik bileşen notları.
    notes: list[str] = field(default_factory=list)


class NormalizingStream:
    """Streaming normalizasyon sarmalayıcısı.

    LLM'den metin parça parça gelir; "12.000 TL" gibi Pattern 8 desenleri
    parçalar arasında bölünebileceği için rakamlı son kelime bir sonraki
    parçaya kadar bekletilir (taşıma tamponu). Böylece streaming gecikmesi
    korunur (ilk ses hemen başlar) ama normalizasyon bozulmaz.
    """

    def __init__(self, inner: Any) -> None:
        self._inner = inner
        self._pending = ""

    def push_text(self, token: str) -> None:
        self._pending += token
        cut = _safe_prefix_length(self._pending)
        if cut > 0:
            self._inner.push_text(normalize_for_tts(self._pending[:cut]))
            self._pending = self._pending[cut:]

    def flush(self) -> None:
        if self._pending:
            self._inner.push_text(normalize_for_tts(self._pending))
            self._pending = ""
        self._inner.flush()

    def end_input(self) -> None:
        if self._pending:
            self._inner.push_text(normalize_for_tts(self._pending))
            self._pending = ""
        self._inner.end_input()

    async def aclose(self) -> None:
        await self._inner.aclose()

    async def __aenter__(self) -> "NormalizingStream":
        aenter = getattr(self._inner, "__aenter__", None)
        if aenter:
            await aenter()
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        aclose = getattr(self._inner, "aclose", None)
        if aclose:
            await aclose()

    def __aiter__(self) -> "NormalizingStream":
        return self

    async def __anext__(self) -> Any:
        return await self._inner.__anext__()


def _safe_prefix_length(text: str) -> int:
    """Gönderilmesi güvenli önek uzunluğu: sondaki sayı/ayraçlı kelimeyi beklet.

    "12.000 TL" gibi desenler parça sınırında bölünebileceğinden, boşlukla
    ayrılmış SON kelimenin içinde rakam varsa o kelime gönderilmez.
    """
    stripped = text.rstrip()
    if not stripped:
        return 0
    last = stripped.split(" ")[-1]
    if any(ch.isdigit() for ch in last) or last.endswith((".", ",")) or last in ("TL", "₺", "%"):
        idx = text.rfind(" ")
        return idx + 1 if idx != -1 else 0
    return len(text)


class NormalizingTTS:
    """TTS sarmalayıcı — sentez öncesi Pattern 8 Türkçe normalizasyonu.

    Hem tek parçalı ``synthesize(text, ...)`` hem streaming ``stream()``
    imzasını uygular; diğer öznitelikler ``__getattr__`` ile delege edilir.
    LiveKit kurulu olmasa da import edilebilir (duck typing).
    """

    def __init__(self, inner: Any) -> None:
        self._inner = inner

    def stream(self, **kwargs: Any) -> NormalizingStream:
        """Streaming sentez: parçaları normalize ederek alt akıma iletir."""
        return NormalizingStream(self._inner.stream(**kwargs))

    async def synthesize(self, text: str, **kwargs: Any) -> Any:
        """Metni Türkçe okunuşa çevirip alttaki TTS'e gönderir."""
        normalized = normalize_for_tts(text)
        return await self._inner.synthesize(normalized, **kwargs)

    def __getattr__(self, item: str) -> Any:
        return getattr(self._inner, item)


class CascadePipeline:
    """VAD → STT → LLM (fallback) → TTS zincirinin bağlama katmanı.

    Canlı ortamda bileşenlerin gerçek örneklerini üretir; SDK kurulu
    değilken her üretici metodu ``None`` + not döndürerek iskelet
    modunda güvenli kalır.
    """

    def __init__(
        self,
        config: AgentConfig,
        capabilities: DershaneCapabilities,
        vad_config: TurkishVADConfig = DEFAULT_TURKISH_VAD,
    ) -> None:
        self.config = config
        self.capabilities = capabilities
        self.vad_config = vad_config
        self.kb_hook = kb.KBPrefetchHook()

    # ------------------------------------------------------------------
    # Bileşen üreticileri (her biri izole; biri başarısız olursa diğerleri
    # etkilenmez)
    # ------------------------------------------------------------------

    def build_vad(self) -> Any | None:
        """Silero VAD — Pattern 5 Türkçe kalibrasyon değerleriyle."""
        if not LIVEKIT_AVAILABLE:
            self._note("livekit-agents kurulu değil; VAD bileşeni atlandı.")
            return None
        from livekit.plugins import silero  # yerel import: canlı ortam şartı

        return silero.VAD.load(**self.vad_config.to_livekit_vad_kwargs())

    def build_stt(self) -> Any | None:
        """Deepgram Nova-3 STT — lang="tr" + dershane keyterm prompting."""
        if not LIVEKIT_AVAILABLE:
            self._note("livekit-agents kurulu değil; STT bileşeni atlandı.")
            return None
        from livekit.plugins import deepgram

        # NOT: keyterm parametre adı eklenti sürümüne göre doğrulanmalı
        # (nova-3 keyterm prompting, şartname gereği zorunlu).
        return deepgram.STT(
            model=self.config.deepgram_model,
            language=self.config.deepgram_language,
            keyterms=self.config.dershane_keyterms,
        )

    def build_llm(self) -> Any | None:
        """LLM + FallbackAdapter: OpenAI GPT-4o mini (birincil) → Claude Haiku (yedek).

        2026-09-20 karar: OpenAI birincil LLM (maliyet ~6x düşük: $0,15/$0,60 MTok
        vs Haiku $1/$5; Türkçe kalite yeterli). Anthropic anahtarı da varsa ikinci
        hattı olarak FallbackAdapter'a eklenir. Raporlama katmanı: GPT-4o tek motor
        (Sağlayıcı sadeleşmesi — bkz. PLAN.md).
        """
        if not LIVEKIT_AVAILABLE:
            self._note("livekit-agents kurulu değil; LLM bileşeni atlandı.")
            return None
        from livekit.plugins import openai

        models: list[Any] = []

        # 2026-09-22: GEMINI_API_KEY verilirse Gemini BİRİNCİL (OpenAI kredi
        # 429'da çalışmıyor); anahtar yoksa OpenAI başa döner.
        if self.config.gemini_api_key:
            from livekit.plugins import google
            from google.genai import types

            models.append(
                google.LLM(
                    model=self.config.llm_gemini_model,
                    api_key=self.config.gemini_api_key,
                    # Gemini API 400 veriyor: "deadline 5s is too short, min 10s"
                    # → SDK timeout'unu 30s'e çek (ms cinsinden HttpOptions).
                    http_options=types.HttpOptions(timeout=30_000),
                    # 2.5-flash düşünme modu ilk token'ı geciktirir — sesli
                    # konuşma için kapatılır (daha hızlı + kota dostu).
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                )
            )
            self._note("LLM birincil: Gemini (test) — OpenAI ikinci sıraya alındı")

        models.append(openai.LLM(model=self.config.llm_primary_model))

        anthropic_key = getattr(self.config, "anthropic_api_key", "")
        if anthropic_key:
            from livekit.plugins import anthropic

            models.append(anthropic.LLM(model=self.config.llm_fallback_model))
        else:
            self._note(
                "ANTHROPIC_API_KEY yok — yedek hat kurulmadı "
                "(birincil: OpenAI GPT-4o mini)."
            )
        return lk_llm.FallbackAdapter(models)

    def build_tts(self) -> Any | None:
        """Cartesia Sonic 3.6 TTS + Pattern 8 normalizasyon sarmalayıcı."""
        if not LIVEKIT_AVAILABLE:
            self._note("livekit-agents kurulu değil; TTS bileşeni atlandı.")
            return None
        from livekit.plugins import cartesia

        voice_id = (
            self.config.cartesia_voice_id
            or self.config.cartesia_voice_female  # varsayılan: kadın sesi
        )
        # word_timestamps=False ZORUNLU: TR dili timestamp desteklemiyor,
        # aksi halde Cartesia sessizce boş ses döndürüyor (canlı testte tespit).
        inner = cartesia.TTS(
            model=self.config.cartesia_model,
            language=self.config.cartesia_language,
            voice=voice_id,
            word_timestamps=False,  # TR desteklenmiyor — boş ses döndürüyordu
            speed=self.config.cartesia_speed,
        )
        return NormalizingTTS(inner)

    def assemble(self) -> PipelineComponents:
        """Tüm bileşenleri üretip bağlar; hatalar not olarak toplanır."""
        components = PipelineComponents()
        builders = (
            ("vad", self.build_vad),
            ("stt", self.build_stt),
            ("llm", self.build_llm),
            ("tts", self.build_tts),
        )
        for attr, builder in builders:
            try:
                setattr(components, attr, builder())
            except Exception as exc:  # tek bileşen tüm oturumu düşürmesin
                self._note(f"{attr} bileşeni kurulamadı: {exc}")
        if not LIVEKIT_AVAILABLE:
            components.notes.append(
                "İSKELET MODU: canlı oturum için pip install -r agent/requirements.txt"
            )
        return components

    # ------------------------------------------------------------------
    # Araç (tool) bağlaması
    # ------------------------------------------------------------------

    def tool_definitions(self) -> list[dict[str, Any]]:
        """Yetenek matrisine göre filtrelenmiş tool şemaları.

        ``record_signals`` her zaman sunulur (Pattern 1); yetenek
        araçları yalnızca matriste izinliyse eklenir (Pattern 2).
        """
        tools: list[dict[str, Any]] = [build_record_signals_tool()]
        allowed = filter_tools(
            [
                "quote_pricing",
                "create_appointment",
                "reschedule_appointment",
                "check_exam_results",
                "check_payment_status",
                "share_schedule",
                "send_location",
                "schedule_trial_exam",
                "transfer_to_human",
            ],
            self.capabilities,
        )
        for name in allowed:
            tools.append({"type": "function", "name": name, "parameters": {}})
        # enroll_student kasıtlı olarak hiçbir koşulda eklenmez.
        return tools

    # ------------------------------------------------------------------
    # Pattern 6 — Speech gating (barge-in kararı)
    # ------------------------------------------------------------------

    def should_allow_interruption(self, interim_transcript: str) -> bool:
        """Kullanıcının asistanı kesmesine izin verilecek mi?

        STT interim'ındaki kelime sayısı VAD kalibrasyonundaki
        ``min_interruption_words`` eşiğini geçmelidir; tek kelimelik
        arka plan sesi konuşmayı kesmez.
        """
        word_count = len([w for w in interim_transcript.split() if w.strip()])
        return self.vad_config.allows_interruption(word_count)

    # ------------------------------------------------------------------
    # Pattern 7 — KB prefetch hook'u
    # ------------------------------------------------------------------

    async def on_interim_transcript(self, transcript: str) -> None:
        """STT interim callback'i: KB ön-çekmeyi zamanlar (bloklamaz)."""
        self.kb_hook.schedule(transcript)

    async def collect_kb_context(self) -> list[kb.KBSearchResult]:
        """Tamamlanan KB ön-çekme sonucunu LLM bağlamı için döndürür.

        Sağlayıcı bağlı değilse (``NotImplementedError``) boş liste ile
        sessizce devam edilir — KB'siz oturum çalışır.
        """
        try:
            return await self.kb_hook.latest() or []
        except NotImplementedError:
            return []

    # ------------------------------------------------------------------
    # Sistem 5 — Ambiyans maskeleme hook'u
    # ------------------------------------------------------------------

    def apply_ambiance_masking(self) -> dict[str, Any]:
        """Outbound aramalarda cevap anına kadar hafif ambiyans maskesi.

        Şartname Sistem 5: arama çalarken hatDead sesinin "yapay zekâ
        gecikmesi" gibi hissettirmemesi için ilk saniyelerde çok hafif
        ofis ambiyansı/white noise oynatılır; veli açtığında kesilir.
        Canlıda bir yayın (audio source) bileşeni bağlanır.
        """
        return {
            "enabled": LIVEKIT_AVAILABLE,
            "strategy": "soft_office_noise",
            "fade_out_on_pickup": True,
            "note": (
                "Canlı bağlamda LiveKit audio source ile oynatılacak; "
                "iskelet modunda yalnızca şema döndürülür."
            ),
        }

    # ------------------------------------------------------------------
    # Streaming overlap — ön ısıtma
    # ------------------------------------------------------------------

    def prewarm(self) -> dict[str, bool]:
        """Arama çalarken bileşen bağlantılarını ısıt (overlap bütçesi).

        Canlıda: STT WebSocket hand-shake'i, LLM istemcisinin
        oluşturulması ve prompt cache ısınması, TTS bağlantısı.
        """
        warmed = {
            "vad": LIVEKIT_AVAILABLE,
            "stt": LIVEKIT_AVAILABLE,
            "llm": LIVEKIT_AVAILABLE,
            "tts": LIVEKIT_AVAILABLE,
        }
        if not LIVEKIT_AVAILABLE:
            self._note("prewarm atlandı: livekit-agents kurulu değil.")
        return warmed

    # ------------------------------------------------------------------

    def _note(self, message: str) -> None:
        """Bileşen notunu loglar (assemble içinde toplanmak üzere)."""
        logger.info("CascadePipeline: %s", message)
