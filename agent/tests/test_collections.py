"""Sistem 2 — Tahsilat eskalasyon state machine testleri.

Her aşamanın tetikleyicisi + tüm durdurma koşulları kapsanır.
Vade: 2026-10-01 (perşembe).
"""

from datetime import date

from agent.agent.collections import Stage, resolve_collection_stage

DUE = date(2026, 10, 1)


# ---------------------------------------------------------------------------
# Aşama tetikleyicileri
# ---------------------------------------------------------------------------


def test_stage_none_before_due_minus_3() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 9, 27))  # vade -4
    assert decision.stage == Stage.NONE
    assert decision.channel is None


def test_stage_1_gentle_whatsapp_at_due_minus_3() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 9, 28))  # vade -3
    assert decision.stage == Stage.GENTLE_WHATSAPP
    assert decision.channel == "whatsapp"
    assert decision.tone == "nazik"


def test_stage_2_due_day_sms_and_whatsapp() -> None:
    decision = resolve_collection_stage(DUE, DUE)
    assert decision.stage == Stage.DUE_DAY_SMS
    assert decision.channel == "sms+whatsapp"
    assert decision.tone == "bilgilendirici"


def test_stage_3_warning_at_plus_3() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 4))
    assert decision.stage == Stage.WARNING
    assert decision.channel == "whatsapp"
    assert decision.tone == "uyarıcı"
    assert decision.touchpoints == ["+3", "+7"]


def test_stage_3_still_warning_at_plus_7() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 8))
    assert decision.stage == Stage.WARNING


def test_stage_4_gentle_ai_call_at_plus_14() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 15))
    assert decision.stage == Stage.AI_CALL_GENTLE
    assert decision.channel == "voice_ai"
    assert decision.tone == "nazik"


def test_stage_4_holds_until_plus_29() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 30))
    assert decision.stage == Stage.AI_CALL_GENTLE


def test_stage_5_firm_ai_call_and_staff_escalation_at_plus_30() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 31))
    assert decision.stage == Stage.AI_CALL_ESCALATED
    assert decision.channel == "voice_ai"
    assert decision.tone == "kararlı"
    assert decision.escalate_to_staff is True


# ---------------------------------------------------------------------------
# Durdurma koşulları
# ---------------------------------------------------------------------------


def test_stop_when_paid() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 15), paid=True)
    assert decision.stage == Stage.NONE
    assert decision.stop_reason == "odeme_alindi"


def test_stop_when_restructuring() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 15), restructuring=True)
    assert decision.stop_reason == "yeniden_yapilandirma"


def test_stop_when_enrollment_deleted() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 15), enrollment_deleted=True)
    assert decision.stop_reason == "kayit_silindi"


def test_stop_when_claims_no_debt_and_handoff_to_human() -> None:
    decision = resolve_collection_stage(DUE, date(2026, 10, 15), claims_no_debt=True)
    assert decision.stop_reason == "borc_itirazi"
    assert decision.handoff_to_human is True


def test_paid_overrides_late_stage() -> None:
    """Durdurma koşulu, aşamadan bağımsız olarak önceliklidir."""
    decision = resolve_collection_stage(DUE, date(2026, 11, 15), paid=True)  # +45
    assert decision.stage == Stage.NONE
    assert decision.stop_reason is not None
