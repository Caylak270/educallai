"""Sistem 3 — Deneme sınavı motoru testleri: 5 kategori + eğim/istatistik."""

import pytest

from agent.agent.exam_engine import (
    Category,
    classify_student,
    linear_slope,
)

#: 10 kişilik kohort (ortalamalar) — üst %10 eşiği için.
COHORT = [55.0, 58.0, 60.0, 62.0, 64.0, 66.0, 68.0, 70.0, 72.0, 75.0]


# ---------------------------------------------------------------------------
# 5 şartname kategorisi
# ---------------------------------------------------------------------------


def test_first_timer_single_exam() -> None:
    profile = classify_student([42.5])
    assert profile.category == Category.FIRST_TIMER
    assert profile.urgency == "medium"
    assert "ikinci deneme" in profile.strategy


def test_plato_many_exams_low_std() -> None:
    profile = classify_student([50.0, 51.0, 49.0, 50.0, 52.0, 51.0])
    assert profile.category == Category.PLATO
    assert profile.std < 3.0
    assert profile.urgency == "medium"


def test_rising_positive_trend() -> None:
    profile = classify_student([40.0, 45.0, 50.0, 55.0])
    assert profile.category == Category.RISING
    assert profile.slope > 0.5
    assert profile.urgency == "low"


def test_top_performer_cohort_top_10_percent() -> None:
    profile = classify_student([88.0, 88.0, 88.0], cohort_nets=COHORT)
    assert profile.category == Category.TOP_PERFORMER
    assert profile.urgency == "low"


def test_declining_negative_trend_is_high_urgency() -> None:
    profile = classify_student([55.0, 50.0, 45.0, 40.0])
    assert profile.category == Category.DECLINING
    assert profile.slope < -0.5
    assert profile.urgency == "high"
    assert "acil veli görüşmesi" in profile.strategy


def test_stable_fallback_when_no_threshold_matches() -> None:
    profile = classify_student([50.0, 51.0])  # 2 deneme: trend/plato eşiği yok
    assert profile.category == Category.STABLE


# ---------------------------------------------------------------------------
# Sınır / yardımcı davranışlar
# ---------------------------------------------------------------------------


def test_empty_nets_raise() -> None:
    with pytest.raises(ValueError):
        classify_student([])


def test_linear_slope_values() -> None:
    assert linear_slope([10.0, 20.0, 30.0]) == pytest.approx(10.0)
    assert linear_slope([30.0, 20.0, 10.0]) == pytest.approx(-10.0)
    assert linear_slope([42.0]) == 0.0  # tek nokta → eğim tanımsız = 0


def test_plato_priority_over_top_performer() -> None:
    """Şartname sırası: PLATO, TOP_PERFORMER'dan önce kontrol edilir."""
    profile = classify_student([88.0, 88.0, 88.0, 88.0, 88.0], cohort_nets=COHORT)
    assert profile.category == Category.PLATO  # 5 deneme + std 0 → plato kazanır
