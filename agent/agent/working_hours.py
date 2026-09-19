"""Working Hours Guard — çağrı saatleri, engelli dönemler ve optimal pencereler.

Dershaneye giden **dışa dönük (outbound)** çağrıların yalnızca uygun
zamanlarda yapılmasını garanti eder:

* Hafta içi 09:30-18:00, Cumartesi 10:00-15:00, Pazar kapalı.
* ``blocked_periods``: ramazan iftar saati (gün içi pencere), bayram 1. gün,
  YKS ve LGS sınav günleri (tam gün).
* ``optimal_windows``: ulaşım/cevap oranı en yüksek "öncelikli" arama
  pencereleri (dialer skorlamasında bonus verir).

Saf modüldür; tüm fonksiyonlar ``datetime`` alır, servis çağırmaz.
Tarihler yıllık olarak operasyon ekibi tarafından güncellenir.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta


@dataclass(frozen=True)
class TimeWindow:
    """Gün içi saat penceresi (``start <= t <= end`` kapalı aralık)."""

    start: time
    end: time

    def contains(self, t: time) -> bool:
        """Verilen saatin pencere içinde olup olmadığını döndürür."""
        return self.start <= t <= self.end


#: Hafta içi (Pzt-Cum) mesai penceresi.
WEEKDAY_HOURS = TimeWindow(time(9, 30), time(18, 0))
#: Cumartesi mesai penceresi.
SATURDAY_HOURS = TimeWindow(time(10, 0), time(15, 0))

#: Haftanın gününe (``date.weekday()``: 0=Pzt ... 6=Paz) göre mesai. Pazar: None.
WORKING_HOURS: dict[int, TimeWindow | None] = {
    0: WEEKDAY_HOURS,
    1: WEEKDAY_HOURS,
    2: WEEKDAY_HOURS,
    3: WEEKDAY_HOURS,
    4: WEEKDAY_HOURS,
    5: SATURDAY_HOURS,
    6: None,  # Pazar kapalı
}

#: Öncelikli arama pencereleri (optimal) — dialer skorlamasında +puan.
OPTIMAL_WINDOWS: dict[int, list[TimeWindow]] = {
    0: [TimeWindow(time(10, 0), time(12, 0)), TimeWindow(time(14, 0), time(17, 0))],
    1: [TimeWindow(time(10, 0), time(12, 0)), TimeWindow(time(14, 0), time(17, 0))],
    2: [TimeWindow(time(10, 0), time(12, 0)), TimeWindow(time(14, 0), time(17, 0))],
    3: [TimeWindow(time(10, 0), time(12, 0)), TimeWindow(time(14, 0), time(17, 0))],
    4: [TimeWindow(time(10, 0), time(12, 0)), TimeWindow(time(14, 0), time(17, 0))],
    5: [TimeWindow(time(10, 30), time(13, 0))],
    6: [],
}


@dataclass(frozen=True)
class BlockedPeriod:
    """Çağrı yapılmayan dönem.

    ``whole_day=True`` ise tarih aralığının tamamı engellidir; aksi halde
    ``daily_window`` içindeki saatler engellenir (ör. iftar saati).
    """

    name: str
    start_date: date
    end_date: date
    reason: str
    whole_day: bool = True
    daily_window: TimeWindow | None = None

    def covers(self, d: date, t: time | None = None) -> bool:
        """Tarih (ve gün içi saat) bu engelli döneme düşüyor mu?"""
        if not (self.start_date <= d <= self.end_date):
            return False
        if self.whole_day:
            return True
        return bool(self.daily_window is not None and t is not None
                    and self.daily_window.contains(t))


#: Yıllık güncellenen engelli dönemler (2026 takvimi).
BLOCKED_PERIODS: list[BlockedPeriod] = [
    BlockedPeriod(
        name="ramazan_iftar_saati",
        start_date=date(2026, 2, 19),
        end_date=date(2026, 3, 19),
        reason="Ramazan ayında iftar saati çakışması",
        whole_day=False,
        daily_window=TimeWindow(time(18, 0), time(19, 30)),
    ),
    BlockedPeriod(
        name="bayram_1_gun",
        start_date=date(2026, 3, 20),
        end_date=date(2026, 3, 20),
        reason="Ramazan Bayramı 1. gün",
        whole_day=True,
    ),
    BlockedPeriod(
        name="yks_sinav_gunu",
        start_date=date(2026, 6, 20),
        end_date=date(2026, 6, 21),
        reason="YKS sınav günü (veliler ulaşılamaz)",
        whole_day=True,
    ),
    BlockedPeriod(
        name="lgs_sinav_gunu",
        start_date=date(2026, 6, 14),
        end_date=date(2026, 6, 14),
        reason="LGS sınav günü",
        whole_day=True,
    ),
]


@dataclass(frozen=True)
class CallDecision:
    """Çağrı izin kararı ve gerekçe kodu."""

    allowed: bool
    reason: str


def is_call_allowed(dt: datetime) -> CallDecision:
    """Verilen anda dışa dönük çağrı yapılabilir mi? (saf kontrol)

    Kontrol sırası: kapalı gün → engelli dönem → mesai dışı.
    """
    d, t = dt.date(), dt.time()
    window = WORKING_HOURS.get(d.weekday())
    if window is None:
        return CallDecision(False, "kapali_gun")
    for period in BLOCKED_PERIODS:
        if period.covers(d, t):
            return CallDecision(False, f"blocked_period:{period.name}")
    if not window.contains(t):
        return CallDecision(False, "mesai_disi")
    return CallDecision(True, "izinli")


def _open_time(d: date) -> time | None:
    """Günün açılış saati (kapalı gün için ``None``)."""
    window = WORKING_HOURS.get(d.weekday())
    return window.start if window else None


def next_allowed_slot(dt: datetime, max_days: int = 60) -> datetime:
    """Verilen andan itibaren çağrı yapılabilen ilk anı döndürür.

    Kademeli ilerleme: gün içi engel biter bitmez → aynı gün açılışa →
    ertesi günün açılışına. ``max_days`` aşılmazsa girdi olduğu gibi
    döner (beklenmedik yapılandırmaya karşı emniyet).
    """
    candidate = dt.replace(second=0, microsecond=0)
    for _ in range(max_days):
        if is_call_allowed(candidate).allowed:
            return candidate
        d, t = candidate.date(), candidate.time()

        # 1) Gün içi engel (ör. iftar penceresi): pencere bitiminde dene.
        jumped = False
        for period in BLOCKED_PERIODS:
            window = period.daily_window
            if (
                not period.whole_day
                and window is not None
                and period.start_date <= d <= period.end_date
                and window.contains(t)
            ):
                candidate = datetime.combine(d, window.end) + timedelta(minutes=1)
                jumped = True
                break
        if jumped:
            continue

        # 2) Henüz açılış öncesiysek aynı günün açılışına git.
        open_t = _open_time(d)
        if open_t is not None and t < open_t:
            candidate = datetime.combine(d, open_t)
            continue

        # 3) Mesai sonu / kapalı gün / tam gün engel → ertesi gün açılışı.
        next_day = d + timedelta(days=1)
        next_open = _open_time(next_day) or time(9, 30)
        candidate = datetime.combine(next_day, next_open)
    return candidate


def is_optimal_window(dt: datetime) -> bool:
    """Verilen an, öncelikli (optimal) arama penceresinde mi?"""
    windows = OPTIMAL_WINDOWS.get(dt.date().weekday(), [])
    return any(w.contains(dt.time()) for w in windows)


def stop_conditions(
    dt: datetime,
    *,
    do_not_call: bool = False,
    max_attempts_reached: bool = False,
    paid_in_full: bool = False,
) -> list[str]:
    """Verilen andaki aktif durdurma koşullarının listesini döndürür.

    Boş liste = çağrı durdurmaya gerek yok. Saat/gün kaynaklı koşullar
    ``is_call_allowed``; hesap kaynaklı koşullar bayraklardan gelir.
    """
    reasons: list[str] = []
    decision = is_call_allowed(dt)
    if not decision.allowed:
        reasons.append(decision.reason)
    if do_not_call:
        reasons.append("do_not_call")
    if max_attempts_reached:
        reasons.append("max_attempts")
    if paid_in_full:
        reasons.append("odeme_alindi")
    return reasons
