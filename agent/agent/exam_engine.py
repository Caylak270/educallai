"""Sistem 3 — Deneme sınavı net serisine göre öğrenci kategorilendirme.

``nets`` (deneme netleri, kronolojik sıralı) listesinden öğrencinin
konuşma stratejisi ve aciliyeti türetilir:

* ``PLATO``          : 5+ deneme, std < 3 → plato kırma stratejisi
* ``RISING``         : 3+ deneme, pozitif eğim → motivasyon
* ``TOP_PERFORMER``  : kohortun üst %10'u → bursluluk/hedef konuşması
* ``DECLINING``      : 3+ deneme, negatif eğim → acil veli görüşmesi
* ``FIRST_TIMER``    : tek deneme → ısınma ve ikinci deneme daveti
* ``STABLE``         : eşiklerin arasında → izleme (dahili kategori)

Eğim, en basit lineer regresyon (x = deneme indeksi) ile hesaplanır.
Saf modüldür; istatistik için yalnızca standart kütüphane kullanır.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from enum import Enum


class Category(str, Enum):
    """Öğrenci performans kategorileri."""

    PLATO = "PLATO"
    RISING = "RISING"
    TOP_PERFORMER = "TOP_PERFORMER"
    DECLINING = "DECLINING"
    FIRST_TIMER = "FIRST_TIMER"
    #: Eşiklerin arasında kalan iç izleme kategorisi.
    STABLE = "STABLE"


#: Plato için gereken minimum deneme sayısı.
PLATO_MIN_EXAMS: int = 5
#: Plato std tavanı (daha düşük std = plato).
PLATO_STD_MAX: float = 3.0
#: Trend analizinde minimum deneme sayısı.
TREND_MIN_EXAMS: int = 3
#: Pozitif/negatif trend için eğim eşiği (net / deneme).
SLOPE_THRESHOLD: float = 0.5
#: Üst %10 eşiği (kohort içindeki altındakilerin oranı).
TOP_PERCENTILE: float = 0.9

#: Kategori → (aciliyet, konuşma stratejisi).
STRATEGY: dict[Category, tuple[str, str]] = {
    Category.PLATO: (
        "medium",
        "Plato kırma: son iki denemenin konu analizi, zayıf ders için "
        "etüt önerisi ve farklı bir deneme serisi planla.",
    ),
    Category.RISING: (
        "low",
        "Yükseliş trendini somut net artışıyla anlat; motivasyonu koru ve "
        "sürecin devamı için mevcut planı onayla.",
    ),
    Category.TOP_PERFORMER: (
        "low",
        "Üst %10 performans: bursluluk olanakları ve hedef üniversite "
        "konusunu aç; özenli, takdir edici bir ton kullan.",
    ),
    Category.DECLINING: (
        "high",
        "Düşüş trendi: acil veli görüşmesi, ders/etüt planı revizyonu ve "
        "rehber öğretmen desteği öner.",
    ),
    Category.FIRST_TIMER: (
        "medium",
        "İlk deneme: ısınma süreci olduğunu vurgula, sonuç analizi sun ve "
        "ikinci denemeye davet et.",
    ),
    Category.STABLE: (
        "low",
        "Stabil seyir: düzenli deneme takvimi ve hedef net sohbeti öner.",
    ),
}


@dataclass(frozen=True)
class ExamProfile:
    """Kategorilendirme sonucu ve konuşma stratejisi."""

    #: Hedef kategori.
    category: Category
    #: Deneme başına net değişim eğimi (lineer regresyon).
    slope: float
    #: Netlerin popülasyon std sapması.
    std: float
    #: En son denemenin neti.
    latest_net: float
    #: Aciliyet: "low" | "medium" | "high"
    urgency: str
    #: Asistanın izleyeceği konuşma stratejisi (Türkçe).
    strategy: str


def linear_slope(values: list[float]) -> float:
    """Basit lineer regresyon eğimi (x = 0,1,2,...; y = net).

    2'den az nokta → 0.0. Formül: ``cov(x, y) / var(x)``.
    """
    n = len(values)
    if n < 2:
        return 0.0
    mean_x = (n - 1) / 2.0
    mean_y = sum(values) / n
    numerator = sum((i - mean_x) * (y - mean_y) for i, y in enumerate(values))
    denominator = sum((i - mean_x) ** 2 for i in range(n))
    if denominator == 0:
        return 0.0
    return numerator / denominator


def _percentile_below(value: float, population: list[float]) -> float:
    """Kohort içinde verilen değerin altında kalanların oranı (0-1)."""
    if not population:
        return 0.0
    below = sum(1 for item in population if item < value)
    return below / len(population)


def classify_student(
    nets: list[float], cohort_nets: list[float] | None = None
) -> ExamProfile:
    """Net serisine (ve opsiyonel kohort ortalamalarına) göre kategori üretir.

    Kontrol sırası şartnamedeki öncelikle birebir aynıdır:
    FIRST_TIMER (tek deneme) → PLATO → RISING → TOP_PERFORMER → DECLINING
    (hiçbiri tutmazsa STABLE).

    Args:
        nets: Kronolojik sıralı deneme netleri.
        cohort_nets: Sınıf/kurs genelinde öğrenci başına ortalama netler;
            ``TOP_PERFORMER`` (üst %10) yalnızca bu verilirse hesaplanır.

    Raises:
        ValueError: ``nets`` boşsa.
    """
    if not nets:
        raise ValueError("En az bir deneme neti gerekli.")

    latest = float(nets[-1])
    std = float(statistics.pstdev(nets)) if len(nets) > 1 else 0.0
    slope = linear_slope([float(v) for v in nets])

    if len(nets) == 1:
        category = Category.FIRST_TIMER
    elif len(nets) >= PLATO_MIN_EXAMS and std < PLATO_STD_MAX:
        category = Category.PLATO
    elif (
        len(nets) >= TREND_MIN_EXAMS
        and slope > SLOPE_THRESHOLD
    ):
        category = Category.RISING
    elif (
        cohort_nets
        and _percentile_below(latest, list(cohort_nets)) >= TOP_PERCENTILE
    ):
        category = Category.TOP_PERFORMER
    elif len(nets) >= TREND_MIN_EXAMS and slope < -SLOPE_THRESHOLD:
        category = Category.DECLINING
    else:
        category = Category.STABLE

    urgency, strategy = STRATEGY[category]
    return ExamProfile(
        category=category,
        slope=slope,
        std=std,
        latest_net=latest,
        urgency=urgency,
        strategy=strategy,
    )
