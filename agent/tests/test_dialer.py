"""Sistem 1 — Outbound Batch Dialer testleri (öncelik sıralaması, retry, stop).

Tüm zaman testleri 2026-09-22 Salı (mesai içi, optimal pencere) üzerinedir.
"""

from datetime import datetime

from agent.agent.dialer import (
    MAX_ATTEMPTS,
    Lead,
    can_call_lead,
    next_retry_time,
    prioritize_leads,
    score_lead,
    should_retry,
)

# Salı 10:31 — mesai içi (09:30-18:00) ve optimal pencere (10:00-12:00).
NOW = datetime(2026, 9, 22, 10, 31)


def _lead(**kwargs) -> Lead:
    base = dict(id="lead-1", name="Veli", phone="05551234567")
    base.update(kwargs)
    return Lead(**base)


# ---------------------------------------------------------------------------
# Öncelik skorlama
# ---------------------------------------------------------------------------


def test_hot_lead_outranks_warm_lead() -> None:
    hot = _lead(id="hot", lead_temperature="hot")
    warm = _lead(id="warm", lead_temperature="warm")
    ordered = prioritize_leads([warm, hot], NOW)
    assert [lead.id for lead in ordered] == ["hot", "warm"]


def test_recency_breaks_temperature_ties() -> None:
    fresh = _lead(id="fresh", lead_temperature="hot", last_contact=NOW)
    stale = _lead(
        id="stale",
        lead_temperature="hot",
        last_contact=datetime(2026, 8, 1, 10, 0),  # ~7 hafta önce
    )
    ordered = prioritize_leads([fresh, stale], NOW)
    assert ordered[0].id == "stale"  # temas yaşı büyük olan öne geçer


def test_optimal_window_beats_working_hours_only() -> None:
    """Optimal penceredeki değerlendirme, tüm lead'lere aynı bonusu ekler;
    sıralama bileşen puanlarla test edilir."""
    in_optimal = score_lead(_lead(lead_temperature="warm"), NOW)
    outside = score_lead(_lead(lead_temperature="warm"), datetime(2026, 9, 22, 9, 45))
    assert in_optimal > outside  # optimal bonus > sıradan mesai bonusu


def test_trial_exam_count_and_interest_increase_score() -> None:
    base = _lead(lead_temperature="cold")
    enriched = _lead(
        lead_temperature="cold",
        trial_exam_count=4,
        interest_level="high",
    )
    assert score_lead(enriched, NOW) > score_lead(base, NOW)


def test_do_not_call_excluded_from_queue() -> None:
    dnc = _lead(id="dnc", do_not_call=True)
    normal = _lead(id="normal", lead_temperature="cold")
    ordered = prioritize_leads([dnc, normal], NOW)
    assert [lead.id for lead in ordered] == ["normal"]


# ---------------------------------------------------------------------------
# Retry policy
# ---------------------------------------------------------------------------


def test_busy_retry_in_30_minutes() -> None:
    attempt = datetime(2026, 9, 22, 10, 0)
    assert next_retry_time("busy", attempt) == datetime(2026, 9, 22, 10, 30)


def test_no_answer_retry_in_3_hours() -> None:
    attempt = datetime(2026, 9, 22, 10, 0)
    assert next_retry_time("no_answer", attempt) == datetime(2026, 9, 22, 13, 0)


def test_answered_has_no_retry() -> None:
    assert next_retry_time("answered", NOW) is None


def test_should_retry_respects_max_attempts() -> None:
    assert should_retry(_lead(last_outcome="no_answer", attempts=1)) is True
    assert should_retry(_lead(last_outcome="no_answer", attempts=MAX_ATTEMPTS)) is False
    assert should_retry(_lead(last_outcome="answered", attempts=0)) is False


# ---------------------------------------------------------------------------
# Durdurma koşulları (can_call_lead)
# ---------------------------------------------------------------------------


def test_do_not_call_stops_calling() -> None:
    allowed, reason = can_call_lead(_lead(do_not_call=True), NOW)
    assert allowed is False
    assert reason == "do_not_call"


def test_max_attempts_stops_calling() -> None:
    lead = _lead(attempts=MAX_ATTEMPTS, last_outcome="no_answer")
    allowed, reason = can_call_lead(lead, NOW)
    assert allowed is False
    assert reason == "max_attempts"


def test_retry_waiting_time_blocks_call() -> None:
    lead = _lead(last_outcome="busy", attempts=1)
    allowed, reason = can_call_lead(
        lead, datetime(2026, 9, 22, 10, 15), last_attempt=datetime(2026, 9, 22, 10, 0)
    )
    assert allowed is False
    assert reason == "bekleme_suresi"


def test_call_allowed_after_waiting_period() -> None:
    lead = _lead(last_outcome="busy", attempts=1)
    allowed, reason = can_call_lead(
        lead, datetime(2026, 9, 22, 10, 31), last_attempt=datetime(2026, 9, 22, 10, 0)
    )
    assert allowed is True
    assert reason == "uygun"


def test_outside_working_hours_blocks_call() -> None:
    allowed, reason = can_call_lead(_lead(lead_temperature="hot"), datetime(2026, 9, 22, 8, 0))
    assert allowed is False
    assert reason == "mesai_disi"
