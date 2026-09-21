"""agent.agent.settings — dashboard canlı ayar dosyası testleri."""

import json
from pathlib import Path

import pytest

from agent.agent.settings import (
    AgentSettings,
    TURN_CLOSE_MAX_MS,
    TURN_CLOSE_MIN_MS,
    apply_to_config,
    load_agent_settings,
)


def _write(tmp_path: Path, payload: dict) -> Path:
    p = tmp_path / "agent-settings.json"
    p.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return p


class TestLoadAgentSettings:
    def test_missing_file_returns_defaults(self, tmp_path: Path):
        s = load_agent_settings(tmp_path / "yok.json")
        assert s == AgentSettings()

    def test_broken_json_returns_defaults(self, tmp_path: Path):
        p = tmp_path / "agent-settings.json"
        p.write_text("{ bozuk", encoding="utf-8")
        assert load_agent_settings(p) == AgentSettings()

    def test_full_settings_parsed(self, tmp_path: Path):
        p = _write(
            tmp_path,
            {
                "mode": "natural",
                "voice": "male",
                "speech_speed": 0.95,
                "turn_close_ms": 150,
                "realtime_voice": "verse",
            },
        )
        s = load_agent_settings(p)
        assert s.mode == "natural"
        assert s.voice == "male"
        assert s.speech_speed == pytest.approx(0.95)
        assert s.turn_close_ms == 150
        assert s.realtime_voice == "verse"
        assert s.use_realtime is False

    def test_invalid_enum_rejected(self, tmp_path: Path):
        p = _write(tmp_path, {"mode": "hizli", "voice": "robot"})
        s = load_agent_settings(p)
        assert s.mode is None
        assert s.voice is None

    def test_unknown_realtime_voice_rejected(self, tmp_path: Path):
        p = _write(tmp_path, {"realtime_voice": "elevenlabs-x"})
        assert load_agent_settings(p).realtime_voice is None

    def test_turn_close_clamped(self, tmp_path: Path):
        p = _write(tmp_path, {"turn_close_ms": 5})
        assert load_agent_settings(p).turn_close_ms == TURN_CLOSE_MIN_MS
        p2 = _write(tmp_path, {"turn_close_ms": 9999})
        assert load_agent_settings(p2).turn_close_ms == TURN_CLOSE_MAX_MS

    def test_speed_clamped(self, tmp_path: Path):
        p = _write(tmp_path, {"speech_speed": 9.9})
        assert load_agent_settings(p).speech_speed == 1.3

    def test_use_realtime_mapping(self):
        assert AgentSettings(mode="fast").use_realtime is True
        assert AgentSettings(mode="natural").use_realtime is False
        assert AgentSettings().use_realtime is None  # env karar verir


class TestApplyToConfig:
    class _FakeConfig:
        cartesia_voice_female = "female-id"
        cartesia_voice_male = "male-id"
        cartesia_voice_id = ""
        cartesia_speed = 1.0

    def test_female_voice_applied(self):
        cfg = self._FakeConfig()
        apply_to_config(AgentSettings(voice="female"), cfg)
        assert cfg.cartesia_voice_id == "female-id"

    def test_male_voice_applied(self):
        cfg = self._FakeConfig()
        apply_to_config(AgentSettings(voice="male"), cfg)
        assert cfg.cartesia_voice_id == "male-id"

    def test_speed_applied_and_none_ignored(self):
        cfg = self._FakeConfig()
        apply_to_config(AgentSettings(speech_speed=0.9), cfg)
        assert cfg.cartesia_speed == pytest.approx(0.9)
        apply_to_config(AgentSettings(), cfg)  # None → dokunma
        assert cfg.cartesia_speed == pytest.approx(0.9)
