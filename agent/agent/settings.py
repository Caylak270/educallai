"""Dashboard-canlı ajan ayarları — ``agent/agent-settings.json``.

Dashboard'daki "AI Ses ve Ton Seçimi" kartı bu dosyayı yazar; ajan her
görüşme başında (entrypoint) TAZE okur — ajan restart gerekmez.

Tercih dosyasıdır: anahtar/sifre içermez; boş/eksik/bozuk değerler
``None``'a düşer ve kod varsayılanına döner (graceful).

Şema::

    {
      "mode": "natural" | "fast",   # natural = Cartesia cascade, fast = OpenAI Realtime
      "voice": "female" | "male",   # Cartesia ses cinsiyeti (natural mod)
      "speech_speed": 1.0,          # Cartesia hız (0.7-1.3)
      "turn_close_ms": 180,         # tur kapatma penceresi ms (80-400)
      "realtime_voice": "marin"     # OpenAI Realtime ses adı (fast mod)
    }
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

#: agent/ dizini (bu dosya agent/agent/ altında).
DEFAULT_SETTINGS_PATH = Path(__file__).resolve().parents[1] / "agent-settings.json"

#: OpenAI Realtime ses beyaz listesi (güvenlik: keyfi string yazılmasın).
REALTIME_VOICES = frozenset(
    {"marin", "verse", "coral", "ash", "sage", "ballad", "alloy", "echo"}
)

#: Tur kapatma penceresi sınırları — 80ms altı cümleyi böler, 400ms üstü
#: veliye "düşüyor" hissi verir (canlı test matrisi: 180ms dengeli).
TURN_CLOSE_MIN_MS = 80
TURN_CLOSE_MAX_MS = 400


@dataclass(frozen=True)
class AgentSettings:
    """Dosyadan okunan tercihler; ``None`` = kullanıcı ayarlamadı, dokunma."""

    mode: str | None = None
    voice: str | None = None
    speech_speed: float | None = None
    turn_close_ms: int | None = None
    realtime_voice: str | None = None

    @property
    def use_realtime(self) -> bool | None:
        """Realtime LLM tercihi; ``None`` = env (REALTIME_MODE) karar verir.

        "hybrid" de Realtime LLM kullanır (ama ses Cartesia'dan çıkar) —
        entrypoint bu alanı yalnız LLM motoru kararı için okur.
        """
        if self.mode == "fast":
            return True
        if self.mode == "natural":
            return False
        if self.mode == "hybrid":
            return True  # Realtime LLM (ses değil) — entrypoint mode ile ayırır
        return None

    @property
    def uses_cartesia_tts(self) -> bool | None:
        """Sesin Cartesia'dan çıkıp çıkmayacağı (natural VE hybrid modda evet)."""
        if self.mode == "natural":
            return True
        if self.mode == "hybrid":
            return True
        if self.mode == "fast":
            return False
        return None


def load_agent_settings(path: Path | str = DEFAULT_SETTINGS_PATH) -> AgentSettings:
    """Ayar dosyasını güvenli oku; bozuk/eksik alanlar varsayılana düşer."""
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return AgentSettings()
    if not isinstance(data, dict):
        return AgentSettings()

    def _enum(key: str, allowed: frozenset | tuple) -> str | None:
        val = data.get(key)
        return val if isinstance(val, str) and val.strip() in allowed else None

    def _float(key: str, lo: float, hi: float) -> float | None:
        try:
            val = float(data[key])
        except (KeyError, TypeError, ValueError):
            return None
        return max(lo, min(hi, val))

    def _int(key: str, lo: int, hi: int) -> int | None:
        try:
            val = int(float(data[key]))
        except (KeyError, TypeError, ValueError):
            return None
        return max(lo, min(hi, val))

    rt_voice = _enum("realtime_voice", REALTIME_VOICES)
    # Beyaz liste dışı ama boş olmayan değer: kullanıcının girdiği özel id
    # olabilir → köşeli durumlarda None'a zorlamak yerine güvenli bırakma:
    # sadece bilinen sesleri kabul ediyoruz (anti-halüsinasyon ilkesi).
    return AgentSettings(
        mode=_enum("mode", ("fast", "natural", "hybrid")),
        voice=_enum("voice", ("female", "male")),
        speech_speed=_float("speech_speed", 0.7, 1.3),
        turn_close_ms=_int("turn_close_ms", TURN_CLOSE_MIN_MS, TURN_CLOSE_MAX_MS),
        realtime_voice=rt_voice,
    )


def apply_to_config(settings: AgentSettings, config) -> object:
    """Cartesia ile ilgili tercihleri ``AgentConfig`` üzerine yazar.

    Realtime (ServerVAD ses adı, tur ms) entrypoint'te doğrudan okunur;
    burada yalnız cascade pipeline'ın kullandığı alanlar ezilir.
    """
    if settings.voice == "female":
        config.cartesia_voice_id = config.cartesia_voice_female
    elif settings.voice == "male":
        config.cartesia_voice_id = config.cartesia_voice_male
    if settings.speech_speed is not None:
        config.cartesia_speed = settings.speech_speed
    return config
