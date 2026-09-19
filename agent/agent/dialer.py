"""Sistem 1 — Outbound Batch Dialer mantığı (öncelik + retry policy).

Node/BullMQ tarafındaki **kuyruğun** hangi lead'leri, hangi sırada ve
ne zaman arayacağını besleyen saf karar fonksiyonları. Kuyruğa erişim,
HTTP çağrısı ya da zamanlama burada YOKTUR; python tarafı yalnızca
skorlama ve politika hesabı yapar.

Öncelik skoru bileşenleri (maks. 100):

* Lead sıcaklığı: hot 40 / warm 25 / cold 10
* Temas yaşı (recency): son temastan bugüne 14 güne lineer, maks 20
* Optimal saat: optimal pencerede +15, mesai içinde +8
* Deneme sınavı sayısı: her biri +3 (maks 5 sınav = +15)
* Önceki ilgi düzeyi: high 15 / medium 8 / low 3

Retry policy: cevapsız → 3 saat, meşgul → 30 dakika, en fazla 3 deneme.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Iterable

from . import working_hours as wh

#: Maksimum arama denemesi; aşılırsa lead durdurulur.
MAX_ATTEMPTS: int = 3

#: Sonuca göre tekrar arama gecikmesi. ``answered`` → tekrar yok.
RETRY_DELAYS: dict[str, timedelta | None] = {
    "busy": timedelta(minutes=30),
    "no_answer": timedelta(hours=3),
    "voicemail": timedelta(hours=3),
    "answered": None,
}

#: Lead sıcaklığı puanları.
TEMPERATURE_SCORES: dict[str, float] = {"hot": 40.0, "warm": 25.0, "cold": 10.0}
#: Önceki ilgi düzeyi puanları.
INTEREST_SCORES: dict[str, float] = {"high": 15.0, "medium": 8.0, "low": 3.0}
#: Optimal pencere / sıradan mesai bonusu.
OPTIMAL_BONUS: float = 15.0
WORKING_HOURS_BONUS: float = 8.0
#: Temas yaşı puanı: RECENCY_WINDOW_DAYS güne lineer doygunlaşır.
RECENCY_MAX_POINTS: float = 20.0
RECENCY_WINDOW_DAYS: float = 14.0
#: Deneme sınavı puanı: sınav başına, tavan sayısı.
TRIAL_POINTS_PER_EXAM: float = 3.0
TRIAL_MAX_EXAMS: int = 5


@dataclass
class Lead:
    """Batch dialer'da sıraya giren bir veli kaydı (kuyruk isterlerinden alişe)."""

    id: str
    name: str = ""
    phone: str = ""
    #: "hot" | "warm" | "cold"
    lead_temperature: str = "cold"
    #: Son temas zamanı (None = hiç aranmadı → en yüksek yaş puanı).
    last_contact: datetime | None = None
    #: Katıldığı deneme sınavı sayısı.
    trial_exam_count: int = 0
    #: "high" | "medium" | "low"
    interest_level: str = "low"
    #: Şimdiye kadarki arama denemesi sayısı.
    attempts: int = 0
    #: Son aramanın sonucu: "answered" | "no_answer" | "busy" | "voicemail"
    last_outcome: str | None = None
    #: Veli aramamayı istedi mi (kesin durdurma).
    do_not_call: bool = False


def temperature_score(lead: Lead) -> float:
    """Lead sıcaklık puanı (bilinmeyen etiket → cold puanı)."""
    return TEMPERATURE_SCORES.get(lead.lead_temperature, TEMPERATURE_SCORES["cold"])


def recency_score(lead: Lead, now: datetime) -> float:
    """Temas yaşı puanı: uzun süredir temas edilmeyen lead önceliklenir."""
    if lead.last_contact is None:
        return RECENCY_MAX_POINTS
    days = max((now - lead.last_contact).total_seconds() / 86400.0, 0.0)
    return min(days / RECENCY_WINDOW_DAYS, 1.0) * RECENCY_MAX_POINTS


def optimal_hour_score(lead: Lead, now: datetime) -> float:
    """Arama saati uygunluk puanı (optimal pencere > mesai > dışı)."""
    if wh.is_optimal_window(now):
        return OPTIMAL_BONUS
    if wh.is_call_allowed(now).allowed:
        return WORKING_HOURS_BONUS
    return 0.0


def trial_exam_score(lead: Lead) -> float:
    """Deneme sınavı bağlılığı puanı (sınav başına +3, tavan 5 sınav)."""
    return min(max(lead.trial_exam_count, 0), TRIAL_MAX_EXAMS) * TRIAL_POINTS_PER_EXAM


def interest_score(lead: Lead) -> float:
    """Önceki ilgi düzeyi puanı (bilinmeyen etiket → low puanı)."""
    return INTEREST_SCORES.get(lead.interest_level, INTEREST_SCORES["low"])


def score_lead(lead: Lead, now: datetime) -> float:
    """Lead'in toplam öncelik skoru (0-100)."""
    return (
        temperature_score(lead)
        + recency_score(lead, now)
        + optimal_hour_score(lead, now)
        + trial_exam_score(lead)
        + interest_score(lead)
    )


def prioritize_leads(leads: Iterable[Lead], now: datetime) -> list[Lead]:
    """Lead'leri skora göre azalan sıralar; ``do_not_call`` olanları ayıklar."""
    eligible = [lead for lead in leads if not lead.do_not_call]
    return sorted(eligible, key=lambda lead: score_lead(lead, now), reverse=True)


def next_retry_time(last_outcome: str, last_attempt: datetime) -> datetime | None:
    """Sonuca göre bir sonraki deneme zamanı (politika yoksa ``None``).

    * ``busy``      → son deneme + 30 dakika
    * ``no_answer`` → son deneme + 3 saat
    * ``voicemail`` → son deneme + 3 saat
    * ``answered``  → ``None`` (temas kuruldu; yeni deneme planlanmaz)
    """
    delay = RETRY_DELAYS.get(last_outcome)
    if delay is None:
        return None
    return last_attempt + delay


def should_retry(lead: Lead) -> bool:
    """Lead için yeni bir deneme planlanmalı mı? (deneme tavanı dahil)"""
    return (
        lead.last_outcome in RETRY_DELAYS
        and RETRY_DELAYS[lead.last_outcome] is not None
        and lead.attempts < MAX_ATTEMPTS
    )


def can_call_lead(
    lead: Lead, now: datetime, last_attempt: datetime | None = None
) -> tuple[bool, str]:
    """Lead şimdi aranabilir mi? ``(karar, gerekçe_kodu)`` döndürür.

    Kontrol sırası: DNC → deneme tavanı → temas kurulmuş → çalışma
    saatleri → retry bekleme süresi.
    """
    if lead.do_not_call:
        return False, "do_not_call"
    if lead.attempts >= MAX_ATTEMPTS:
        return False, "max_attempts"
    if lead.last_outcome == "answered":
        return False, "temas_kuruldu"
    decision = wh.is_call_allowed(now)
    if not decision.allowed:
        return False, decision.reason
    if (
        lead.last_outcome is not None
        and last_attempt is not None
        and lead.last_outcome in RETRY_DELAYS
        and RETRY_DELAYS[lead.last_outcome] is not None
    ):
        retry_at = next_retry_time(lead.last_outcome, last_attempt)
        if retry_at is not None and now < retry_at:
            return False, "bekleme_suresi"
    return True, "uygun"
