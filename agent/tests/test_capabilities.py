"""Pattern 2 — Capability Matrix testleri: izin yok → tool yok; enroll asla yok."""

import json
from dataclasses import fields

from agent.agent.capabilities import (
    TOOL_CAPABILITY_MAP,
    DershaneCapabilities,
    allowed_tool_names,
    filter_tools,
    load_capabilities,
)


# ---------------------------------------------------------------------------
# Varsayılanlar
# ---------------------------------------------------------------------------


def test_default_capabilities_are_closed() -> None:
    caps = DershaneCapabilities()
    assert caps.can_share_pricing is False
    assert caps.can_create_appointment is False
    assert caps.can_accept_online_payment is False
    assert caps.can_check_exam_results is False
    # Güvenlik: insan aktarımı her zaman açık.
    assert caps.can_transfer_to_human is True


def test_enroll_student_never_possible_even_if_requested() -> None:
    caps = DershaneCapabilities.from_dict({"can_enroll_student": True})
    assert caps.can_enroll_student is False


def test_enroll_tool_never_in_any_allowed_list() -> None:
    """Her kombinasyonda 'enroll_student' araç listesine giremez."""
    all_true = {f.name: True for f in fields(DershaneCapabilities)}
    for caps in (
        DershaneCapabilities(),
        DershaneCapabilities.from_dict(all_true),
    ):
        assert "enroll_student" not in allowed_tool_names(caps)


# ---------------------------------------------------------------------------
# Filtreleme
# ---------------------------------------------------------------------------


def test_denied_capability_removes_tool() -> None:
    caps = DershaneCapabilities(can_share_pricing=False, can_transfer_to_human=False)
    result = filter_tools(
        ["quote_pricing", "transfer_to_human", "send_message"],
        caps,
    )
    assert "quote_pricing" not in result
    assert "transfer_to_human" not in result
    assert "send_message" in result  # eşleşme yoksa kısıt yok


def test_granted_capability_keeps_tool() -> None:
    caps = DershaneCapabilities.from_dict(
        {"can_share_pricing": True, "can_create_appointment": True}
    )
    result = filter_tools(
        ["quote_pricing", "create_appointment", "enroll_student"], caps
    )
    assert result == ["quote_pricing", "create_appointment"]


def test_unknown_tool_names_pass_through() -> None:
    caps = DershaneCapabilities()
    assert filter_tools(["custom_tool"], caps) == ["custom_tool"]


# ---------------------------------------------------------------------------
# Yükleme
# ---------------------------------------------------------------------------


def test_load_from_dict() -> None:
    caps = load_capabilities({"can_check_exam_results": True, "has_trial_exam": True})
    assert caps.can_check_exam_results is True
    assert caps.has_trial_exam is True
    assert caps.can_share_pricing is False


def test_load_from_json_string() -> None:
    caps = load_capabilities(json.dumps({"can_share_pricing": True}))
    assert caps.can_share_pricing is True


def test_load_from_file_path(tmp_path) -> None:
    path = tmp_path / "caps.json"
    path.write_text(
        json.dumps({"can_check_payment_status": True}), encoding="utf-8"
    )
    caps = load_capabilities(str(path))
    assert caps.can_check_payment_status is True


def test_unknown_json_keys_are_ignored() -> None:
    caps = load_capabilities({"can_share_pricing": True, "tanimsiz_alan": True})
    assert caps.can_share_pricing is True
    assert not hasattr(caps, "tanimsiz_alan")


def test_invalid_json_raises() -> None:
    import pytest

    with pytest.raises(ValueError):
        load_capabilities("{bozuk json")


# ---------------------------------------------------------------------------
# Eşleme tablosu bütünlüğü
# ---------------------------------------------------------------------------


def test_tool_capability_map_keys_exist_on_dataclass() -> None:
    caps = DershaneCapabilities()
    for capability in TOOL_CAPABILITY_MAP.values():
        assert hasattr(caps, capability)
