"""agent.agent.prompt_settings — dashboard canlı prompt dosyası testleri."""

import json
from pathlib import Path

from agent.agent.prompt_settings import (
    AgentPrompt,
    build_prompt_block,
    load_agent_prompt,
)


def _write(tmp_path: Path, payload: dict) -> Path:
    p = tmp_path / "agent-prompt.json"
    p.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return p


class TestLoadAgentPrompt:
    def test_missing_and_broken_files(self, tmp_path: Path):
        assert load_agent_prompt(tmp_path / "yok.json") == AgentPrompt()
        p = tmp_path / "agent-prompt.json"
        p.write_text("{bozuk", encoding="utf-8")
        assert load_agent_prompt(p).is_empty()

    def test_full_parse(self, tmp_path: Path):
        p = _write(
            tmp_path,
            {
                "assistant_name": "VeliPilot",
                "tone": "enerjik_samimi",
                "instructions": "# ROL\nDershane asistanısın.",
                "collect_fields": [
                    {"label": "Ad Soyad", "key": "full_name", "required": True},
                    {"label": "", "key": "atlanacak"},  # etiketsiz → atlanır
                ],
                "avoid_rules": [
                    {"keywords": "garanti", "response": "Sonuç bireyseldir."}
                ],
                "fallback_reply": "Danışmanımıza bağlayayım mı?",
                "examples": [{"user": "Fiyat?", "assistant": "Hangi program?"}],
            },
        )
        s = load_agent_prompt(p)
        assert s.assistant_name == "VeliPilot"
        assert s.tone == "enerjik_samimi"
        assert s.instructions == "# ROL\nDershane asistanısın."
        assert len(s.collect_fields) == 1
        assert s.collect_fields[0].required is True
        assert len(s.avoid_rules) == 1
        assert len(s.examples) == 1
        assert not s.is_empty()

    def test_unknown_tone_rejected(self, tmp_path: Path):
        p = _write(tmp_path, {"tone": "kızgın"})
        assert load_agent_prompt(p).tone is None

    def test_limits_enforced(self, tmp_path: Path):
        p = _write(
            tmp_path,
            {
                "instructions": "x" * 9000,
                "collect_fields": [
                    {"label": f"f{i}", "key": f"k{i}"} for i in range(20)
                ],
                "examples": [
                    {"user": "u", "assistant": "a"} for _ in range(20)
                ],
            },
        )
        s = load_agent_prompt(p)
        assert len(s.instructions) <= 6000
        assert len(s.collect_fields) <= 8
        assert len(s.examples) <= 5


class TestBuildPromptBlock:
    def test_empty_returns_none(self):
        assert build_prompt_block(AgentPrompt()) is None

    def test_block_contains_sections(self, tmp_path: Path):
        s = load_agent_prompt(
            _write(
                tmp_path,
                {
                    "assistant_name": "VeliPilot",
                    "tone": "sıcak_profesyonel",
                    "instructions": "Kayıt odaklı konuş.",
                    "collect_fields": [
                        {"label": "Telefon", "key": "phone", "required": True}
                    ],
                    "avoid_rules": [
                        {"keywords": "garanti, kesin sonuç", "response": "Sonuç bireyseldir."}
                    ],
                    "fallback_reply": "Danışmanımıza bağlayayım mı?",
                    "examples": [{"user": "Fiyat?", "assistant": "Hangi program?"}],
                },
            )
        )
        block = build_prompt_block(s)
        assert block is not None
        for parça in (
            "KURUMA ÖZEL TALİMATLAR",
            "VeliPilot",
            "sıcak ve profesyonel".capitalize(),  # blokta cümle başı büyük
            "Kayıt odaklı konuş.",
            "TOPLANACAK BİLGİLER",
            "Telefon [phone]",
            "ZORUNLU",
            "KONUŞULMAYACAK KONULAR",
            "garanti, kesin sonuç",
            "Sonuç bireyseldir.",
            "BİLGİ BULUNAMADIĞINDA",
            "Danışmanımıza bağlayayım mı?",
            "ÖRNEK DİYALOGLAR",
            "Fiyat?",
        ):
            assert parça in block, f"blokta yok: {parça}"

    def test_partial_settings_still_build(self, tmp_path: Path):
        s = load_agent_prompt(_write(tmp_path, {"instructions": "Kısa cevap ver."}))
        block = build_prompt_block(s)
        assert block is not None and "Kısa cevap ver." in block
