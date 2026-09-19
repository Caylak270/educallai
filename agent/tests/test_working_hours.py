"""Working Hours Guard testleri — hafta içi / cumartesi / pazar / engelli dönem.

Doğrulanmış 2026 takvim gerçekleri: 2026-09-22 Salı, 2026-09-26
Cumartesi, 2026-06-20 Cumartesi (YKS), 2026-03-20 Cuma (bayram),
2026-03-04 Çarşamba (ramazan).
"""

from datetime import date, datetime, time

from agent.agent.working_hours import (
    BLOCKED_PERIODS,
    is_call_allowed,
    is_optimal_window,
    next_allowed_slot,
    stop_conditions,
)


def _dt(y: int, m: int, d: int, hh: int, mm: int = 0) -> datetime:
    return datetime(y, m, d, hh, mm)


# ---------------------------------------------------------------------------
# Hafta içi
# ---------------------------------------------------------------------------


def test_weekday_within_hours_allowed() -> None:
    decision = is_call_allowed(_dt(2026, 9, 22, 14, 0))  # Salı
    assert decision.allowed is True
    assert decision.reason == "izinli"


def test_weekday_before_open_and_next_slot() -> None:
    decision = is_call_allowed(_dt(2026, 9, 22, 8, 0))
    assert decision.allowed is False
    assert decision.reason == "mesai_disi"
    slot = next_allowed_slot(_dt(2026, 9, 22, 8, 0))
    assert slot == _dt(2026, 9, 22, 9, 30)  # aynı gün açılış


def test_weekday_after_close_next_slot_next_day() -> None:
    slot = next_allowed_slot(_dt(2026, 9, 22, 19, 0))  # Salı akşamı
    assert slot == _dt(2026, 9, 23, 9, 30)  # Çarşamba açılış


def test_exact_open_and_close_boundaries() -> None:
    assert is_call_allowed(_dt(2026, 9, 22, 9, 30)).allowed is True
    assert is_call_allowed(_dt(2026, 9, 22, 18, 0)).allowed is True
    assert is_call_allowed(_dt(2026, 9, 22, 18, 1)).allowed is False


# ---------------------------------------------------------------------------
# Cumartesi ve pazar
# ---------------------------------------------------------------------------


def test_saturday_hours() -> None:
    assert is_call_allowed(_dt(2026, 9, 26, 12, 0)).allowed is True
    decision = is_call_allowed(_dt(2026, 9, 26, 16, 0))
    assert decision.allowed is False
    assert decision.reason == "mesai_disi"


def test_saturday_after_close_skips_sunday() -> None:
    slot = next_allowed_slot(_dt(2026, 9, 26, 16, 0))  # Cmt 16:00
    assert slot == _dt(2026, 9, 28, 9, 30)  # Pazartesi 09:30


def test_sunday_closed() -> None:
    decision = is_call_allowed(_dt(2026, 9, 20, 12, 0))  # Pazar
    assert decision.allowed is False
    assert decision.reason == "kapali_gun"
    assert next_allowed_slot(_dt(2026, 9, 20, 12, 0)) == _dt(2026, 9, 21, 9, 30)


# ---------------------------------------------------------------------------
# Engelli dönemler
# ---------------------------------------------------------------------------


def test_yks_exam_day_blocked() -> None:
    decision = is_call_allowed(_dt(2026, 6, 20, 11, 0))  # YKS 1. gün (Cmt)
    assert decision.allowed is False
    assert decision.reason == "blocked_period:yks_sinav_gunu"
    slot = next_allowed_slot(_dt(2026, 6, 20, 11, 0))
    assert slot == _dt(2026, 6, 22, 9, 30)  # Pazartesi (21'ci pazar atlanır)


def test_bayram_whole_day_blocked() -> None:
    decision = is_call_allowed(_dt(2026, 3, 20, 11, 0))  # Ramazan Bayramı 1. gün
    assert decision.allowed is False
    assert decision.reason == "blocked_period:bayram_1_gun"
    slot = next_allowed_slot(_dt(2026, 3, 20, 11, 0))
    assert slot == _dt(2026, 3, 21, 10, 0)  # Cumartesi açılışı 10:00


def test_ramazan_iftar_window_blocked_only_in_window() -> None:
    # İftar penceresi (18:00-19:30) içinde: engelli.
    decision = is_call_allowed(_dt(2026, 3, 4, 18, 30))
    assert decision.allowed is False
    assert decision.reason == "blocked_period:ramazan_iftar_saati"
    # Pencere dışında, mesai içinde: izinli.
    assert is_call_allowed(_dt(2026, 3, 4, 10, 0)).allowed is True


def test_ramazan_iftar_next_slot_is_next_morning() -> None:
    # 19:31 > hafta içi kapanış 18:00 → ertesi gün sabahı.
    slot = next_allowed_slot(_dt(2026, 3, 4, 18, 30))
    assert slot == _dt(2026, 3, 5, 9, 30)  # Perşembe 09:30


def test_blocked_periods_configured() -> None:
    names = {period.name for period in BLOCKED_PERIODS}
    assert {
        "ramazan_iftar_saati",
        "bayram_1_gun",
        "yks_sinav_gunu",
        "lgs_sinav_gunu",
    } <= names


# ---------------------------------------------------------------------------
# Optimal pencereler
# ---------------------------------------------------------------------------


def test_optimal_windows_weekday() -> None:
    assert is_optimal_window(_dt(2026, 9, 22, 11, 0)) is True   # 10:00-12:00
    assert is_optimal_window(_dt(2026, 9, 22, 15, 0)) is True   # 14:00-17:00
    assert is_optimal_window(_dt(2026, 9, 22, 9, 45)) is False  # mesai ama optimal değil
    assert is_optimal_window(_dt(2026, 9, 22, 17, 30)) is False


def test_optimal_windows_saturday() -> None:
    assert is_optimal_window(_dt(2026, 9, 26, 11, 0)) is True   # 10:30-13:00
    assert is_optimal_window(_dt(2026, 9, 26, 14, 0)) is False


# ---------------------------------------------------------------------------
# Stop koşulları
# ---------------------------------------------------------------------------


def test_stop_conditions_combination() -> None:
    reasons = stop_conditions(
        _dt(2026, 9, 20, 12, 0),  # Pazar
        do_not_call=True,
        max_attempts_reached=True,
        paid_in_full=True,
    )
    assert "kapali_gun" in reasons
    assert "do_not_call" in reasons
    assert "max_attempts" in reasons
    assert "odeme_alindi" in reasons


def test_stop_conditions_empty_when_allowed() -> None:
    assert stop_conditions(_dt(2026, 9, 22, 11, 0)) == []
