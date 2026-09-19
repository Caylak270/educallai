"""VeliPilot AI — Türkçe dershane sesli asistan çekirdek modülleri.

Katmanlar:

* **Saf mantık** (harici servis çağırmadan, pytest ile test edilebilir):
  ``config``, ``signals``, ``capabilities``, ``tts_normalize``, ``vad``,
  ``working_hours``, ``dialer``, ``collections``, ``exam_engine``,
  ``lag_recovery``, ``prompts``, ``kb``.
* **Canlı bağlam** (LiveKit / Deepgram / Anthropic / Cartesia yalnızca
  arayüz olarak): ``pipeline`` ve ``scripts/agent_main.py``.

Tüm saf modüller, ``livekit-agents`` kurulu olmasa bile import edilebilir.
"""

from .capabilities import DershaneCapabilities, filter_tools, load_capabilities
from .collections import CollectionDecision, Stage, resolve_collection_stage
from .config import DERSHANE_KEYTERMS, AgentConfig
from .dialer import Lead, can_call_lead, next_retry_time, prioritize_leads, score_lead
from .exam_engine import Category, ExamProfile, classify_student, linear_slope
from .lag_recovery import RecoveryAction, detect_gaps
from .prompts import (
    KVKK_DISCLOSURE,
    build_inner_intuition,
    build_system_prompt,
)
from .signals import Signals, build_record_signals_tool, merge_signals
from .tts_normalize import normalize_for_tts, number_to_turkish_words
from .vad import DEFAULT_TURKISH_VAD, TurkishVADConfig
from .working_hours import is_call_allowed, is_optimal_window, next_allowed_slot

__all__ = [
    "AgentConfig",
    "DERSHANE_KEYTERMS",
    "KVKK_DISCLOSURE",
    "Category",
    "CollectionDecision",
    "DershaneCapabilities",
    "ExamProfile",
    "Lead",
    "RecoveryAction",
    "Signals",
    "Stage",
    "TurkishVADConfig",
    "DEFAULT_TURKISH_VAD",
    "build_inner_intuition",
    "build_record_signals_tool",
    "build_system_prompt",
    "can_call_lead",
    "classify_student",
    "detect_gaps",
    "filter_tools",
    "is_call_allowed",
    "is_optimal_window",
    "linear_slope",
    "load_capabilities",
    "merge_signals",
    "next_allowed_slot",
    "next_retry_time",
    "normalize_for_tts",
    "number_to_turkish_words",
    "prioritize_leads",
    "resolve_collection_stage",
    "score_lead",
]

__version__ = "0.1.0"
