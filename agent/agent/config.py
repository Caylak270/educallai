"""Agent yapılandırması — .env okuma ve dershane keyterm listesi.

Saf modüldür: yalnızca standart kütüphane + (varsa) ``python-dotenv``
kullanır. Hiçbir harici servise bağlanmaz.

Kullanım::

    from agent.agent.config import AgentConfig

    cfg = AgentConfig.from_env()          # os.environ + .env dosyası
    cfg = AgentConfig.from_env(env={...}) # testlerde sözlükten
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field, fields
from typing import Any, Mapping

try:  # python-dotenv opsiyoneldir; kurulu değilse sessizce geçilir.
    from dotenv import load_dotenv  # type: ignore[import-untyped]

    _DOTENV_AVAILABLE = True
except ImportError:  # pragma: no cover - ortam bağımlı
    _DOTENV_AVAILABLE = False


#: Deepgram Nova-3'e "keyterm prompting" ile beslenecek Türkçe eğitim
#: terimleri. STT'nin sektör jargonunu (TYT, AYT, net, taksit...) doğru
#: yakalaması için transcript önceliğine eklenir.
DERSHANE_KEYTERMS: list[str] = [
    "TYT",
    "AYT",
    "LGS",
    "net",
    "netim",
    "deneme sınavı",
    "taksit",
    "kayıt",
    "ön kayıt",
    "yeniden kayıt",
    "bursluluk",
    "etüt",
    "ders programı",
    "dönem ücreti",
    "yeniden yapılandırma",
    "kontenjan",
    "ölçek puanı",
    "yaz kampı",
]


def _coerce(value: str | None, target_type: type) -> Any:
    """Ortam değişkeni metnini alan tipine çevirir (str/int/list)."""
    if value is None:
        return None
    if target_type is int:
        try:
            return int(value)
        except ValueError:
            return None
    if target_type is list:
        # Virgülle ayrılmış liste: "TYT, AYT, LGS"
        return [item.strip() for item in value.split(",") if item.strip()]
    return value


@dataclass
class AgentConfig:
    """Voice agent çalışma yapılandırması.

    Alan adları, .env değişken adlarının küçük harfli karşılığıdır
    (ör. ``LIVEKIT_URL`` → ``livekit_url``).
    """

    # --- LiveKit Cloud ---
    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""

    # --- Sağlayıcı anahtarları ---
    deepgram_api_key: str = ""
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    cartesia_api_key: str = ""

    # --- Veri / bildirim ---
    supabase_url: str = ""
    supabase_service_key: str = ""
    netgsm_usercode: str = ""
    netgsm_password: str = ""
    netgsm_header: str = ""

    # --- Demo kiracı ---
    demo_dershane_id: str = "demo-dershane"

    # --- Pipeline model ayarları ---
    deepgram_model: str = "nova-3"
    deepgram_language: str = "tr"
    llm_primary_model: str = "claude-haiku-4-5"  # Claude Haiku 4.5
    llm_fallback_model: str = "gpt-4o-mini"  # FallbackAdapter yedeği
    cartesia_model: str = "sonic-3.6"  # şartname: Cartesia Sonic 3.6
    cartesia_voice_id: str = ""
    cartesia_language: str = "tr"

    # --- Operasyon ---
    timezone: str = "Europe/Istanbul"
    latency_target_ms: int = 600  # uçtan uca hedef gecikme
    dershane_keyterms: list[str] = field(
        default_factory=lambda: list(DERSHANE_KEYTERMS)
    )

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "AgentConfig":
        """Ortamdan (ve mümkünse ``.env`` dosyasından) yapılandırma üretir.

        Args:
            env: Testler için alternatif ortam sözlüğü. ``None`` ise
                ``os.environ`` kullanılır ve ``.env`` dosyası yüklenir.
        """
        if env is None and _DOTENV_AVAILABLE:
            load_dotenv()  # mevcut değerlerin üzerine YAZMAZ
        source: Mapping[str, str] = os.environ if env is None else env

        # str olmayan alanlar için açık tip eşlemesi (annotation'lar
        # ``from __future__ import annotations`` nedeniyle metindir).
        non_str_types: dict[str, type] = {
            "latency_target_ms": int,
            "dershane_keyterms": list,
        }

        cfg = cls()
        for f in fields(cls):
            raw = _coerce(source.get(f.name.upper()), non_str_types.get(f.name, str))
            if raw is None:
                continue
            setattr(cfg, f.name, raw)
        return cfg

    def missing_required_keys(self) -> list[str]:
        """Canlıya çıkış için zorunlu ama boş olan .env anahtarlarını döndürür."""
        required = [
            "livekit_url",
            "livekit_api_key",
            "livekit_api_secret",
            "deepgram_api_key",
            "anthropic_api_key",
            "openai_api_key",
            "cartesia_api_key",
        ]
        return [name for name in required if not getattr(self, name)]

    def keyterms_as_json(self) -> str:
        """Keyterm listesini JSON metni olarak döndürür (log/prompt için)."""
        return json.dumps(self.dershane_keyterms, ensure_ascii=False)
