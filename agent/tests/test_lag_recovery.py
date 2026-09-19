"""Pattern 3 — Lag Recovery testleri: 4 senaryo + temiz durum + kısmi durum."""

from agent.agent.lag_recovery import detect_gaps


# ---------------------------------------------------------------------------
# 4 senaryo
# ---------------------------------------------------------------------------


def test_appointment_confirmed_but_not_synced() -> None:
    actions = detect_gaps(
        {"appointment_confirmed_by_ai": True, "calendar_synced": False}
    )
    assert len(actions) == 1
    action = actions[0]
    assert action.scenario == "appointment"
    assert action.actions == ["force_calendar_sync"]
    assert action.severity == "high"


def test_payment_reported_but_not_verified() -> None:
    actions = detect_gaps(
        {"payment_reported_paid": True, "payment_verified": False}
    )
    assert len(actions) == 1
    action = actions[0]
    assert action.scenario == "payment_reported"
    assert action.actions == ["halt_payment_flow", "mark_for_verification"]


def test_enrollment_intent_without_handoff() -> None:
    actions = detect_gaps({"enrollment_intent": "enroll", "handoff_created": False})
    assert len(actions) == 1
    action = actions[0]
    assert action.scenario == "enrollment_intent"
    assert action.actions == ["create_handoff"]


def test_exam_registration_not_added_to_list() -> None:
    actions = detect_gaps(
        {"exam_registration_requested": True, "added_to_exam_list": False}
    )
    assert len(actions) == 1
    action = actions[0]
    assert action.scenario == "exam_registration"
    assert action.actions == ["add_to_exam_list", "send_whatsapp_confirmation"]


# ---------------------------------------------------------------------------
# Olumsuz / kısmi durumlar
# ---------------------------------------------------------------------------


def test_clean_state_produces_no_actions() -> None:
    clean = {
        "appointment_confirmed_by_ai": True,
        "calendar_synced": True,
        "payment_reported_paid": True,
        "payment_verified": True,
        "enrollment_intent": "enroll",
        "handoff_created": True,
        "exam_registration_requested": True,
        "added_to_exam_list": True,
    }
    assert detect_gaps(clean) == []


def test_partial_flags_trigger_when_confirmation_missing() -> None:
    """Karşıt doğrulama bayrağı eksikse kopukluk SAYILIR: AI 'yaptım' diyor,
    arka ofis onayı hiç gelmemişse telafi tetiklenir."""
    assert [a.scenario for a in detect_gaps({"appointment_confirmed_by_ai": True})] == [
        "appointment"
    ]
    assert [
        a.scenario for a in detect_gaps({"payment_reported_paid": True})
    ] == ["payment_reported"]
    assert [
        a.scenario for a in detect_gaps({"exam_registration_requested": True})
    ] == ["exam_registration"]
    # Niyet farklıysa ('enroll' değilse) senaryo tetiklenmez.
    assert detect_gaps({"enrollment_intent": "none"}) == []


def test_empty_state_produces_no_actions() -> None:
    assert detect_gaps({}) == []


def test_multiple_gaps_reported_in_scenario_order() -> None:
    state = {
        "appointment_confirmed_by_ai": True,
        "calendar_synced": False,
        "payment_reported_paid": True,
        "payment_verified": False,
    }
    scenarios = [action.scenario for action in detect_gaps(state)]
    assert scenarios == ["appointment", "payment_reported"]


def test_single_flag_without_confirmation_triggers() -> None:
    """Karşıt bayrak hiç yoksa 'senkron/eklenmedi' varsayılır ve senaryo ateşlenir."""
    actions = detect_gaps({"appointment_confirmed_by_ai": True})
    assert [action.scenario for action in actions] == ["appointment"]
