"""Sistem 2 — Tahsilat eskalasyon state machine (5 aşama).

Vadesi geçen ödemeler için zamana göre yükselen iletişim planı:

+------------------+-----------------------------------------------+
| Aşama            | Tetikleyici / Kanal / Ton                     |
+==================+===============================================+
| 1 GENTLE_WHATSAPP| vade -3 gün → WhatsApp, nazik hatırlatma      |
| 2 DUE_DAY_SMS    | vade günü → SMS + WhatsApp, bilgilendirici    |
| 3 WARNING        | +3 ve +7 gün → WhatsApp, uyarıcı              |
| 4 AI_CALL_GENTLE | +14 gün → nazik AI sesli arama                |
| 5 AI_CALL_FIRM   | +30 gün → kararlı AI arama + yetkiliye bildirim|
+------------------+-----------------------------------------------+

Durdurma koşulları (aşamadan bağımsız): ödeme alındı, yeniden
yapılandırma, kayıt silindi, "borcum yok" itirazı (→ insana aktarım).

Saf modüldür: ``(due_date, today, bayraklar)`` → karar; servis yok.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import IntEnum


class Stage(IntEnum):
    """Tahsilat iletişim aşamaları (0 = henüz iletişim yok)."""

    #: Henüz vadeye 3 günden fazla var.
    NONE = 0
    #: vade -3 gün: nazik WhatsApp hatırlatması.
    GENTLE_WHATSAPP = 1
    #: vade günü: SMS + WhatsApp bilgilendirme.
    DUE_DAY_SMS = 2
    #: +3 / +7 gün: uyarıcı WhatsApp.
    WARNING = 3
    #: +14 gün: nazik AI sesli arama.
    AI_CALL_GENTLE = 4
    #: +30 gün: kararlı AI arama + yetkiliye bildirim.
    AI_CALL_ESCALATED = 5


@dataclass(frozen=True)
class CollectionDecision:
    """Tek bir borç kaydı için hedef aşama ve aksiyon kararı."""

    #: Hedef aşama (durdurulduysa ``Stage.NONE``).
    stage: Stage
    #: Gönderim kanalı: "whatsapp" | "sms+whatsapp" | "voice_ai" | None
    channel: str | None = None
    #: Mesaj tonu: "nazik" | "bilgilendirici" | "uyarıcı" | "kararlı" | None
    tone: str | None = None
    #: Bu aşamadaki temas noktaları (ör. ["+3", "+7"]).
    touchpoints: list[str] = field(default_factory=list)
    #: Şirket yetkilisine (insan) bildirim gerekli mi (+30 aşaması).
    escalate_to_staff: bool = False
    #: Durdurma gerekçe kodu (durdurma yoksa ``None``).
    stop_reason: str | None = None
    #: "borcum yok" gibi itirazlarda insana aktarım.
    handoff_to_human: bool = False


def _decision_for_stage(stage: Stage) -> CollectionDecision:
    """Aşamaya karşılık gelen standart kanal/ton kararını üretir."""
    if stage == Stage.GENTLE_WHATSAPP:
        return CollectionDecision(
            stage=stage, channel="whatsapp", tone="nazik", touchpoints=["vade-3g"]
        )
    if stage == Stage.DUE_DAY_SMS:
        return CollectionDecision(
            stage=stage,
            channel="sms+whatsapp",
            tone="bilgilendirici",
            touchpoints=["vade_gunu"],
        )
    if stage == Stage.WARNING:
        return CollectionDecision(
            stage=stage, channel="whatsapp", tone="uyarıcı", touchpoints=["+3", "+7"]
        )
    if stage == Stage.AI_CALL_GENTLE:
        return CollectionDecision(
            stage=stage, channel="voice_ai", tone="nazik", touchpoints=["+14"]
        )
    if stage == Stage.AI_CALL_ESCALATED:
        return CollectionDecision(
            stage=stage,
            channel="voice_ai",
            tone="kararlı",
            touchpoints=["+30"],
            escalate_to_staff=True,
        )
    return CollectionDecision(stage=Stage.NONE)


def resolve_collection_stage(
    due_date: date,
    today: date,
    *,
    paid: bool = False,
    restructuring: bool = False,
    enrollment_deleted: bool = False,
    claims_no_debt: bool = False,
) -> CollectionDecision:
    """Borç kaydının bugünkü hedef aşamasını hesaplar (saf state machine).

    Args:
        due_date: Ödemenin vade tarihi.
        today: Karar günü.
        paid: Ödeme alındı mı (kesin durdurma).
        restructuring: Yeniden yapılandırma anlaşıldı mı (durdurma).
        enrollment_deleted: Öğrenci kaydı silindi mi (durdurma).
        claims_no_debt: Veli "borcum yok" dedi mi (durdurma + insana aktarım).

    Returns:
        Hedef aşama, kanal, ton ve durdurma bilgisi içeren karar.
    """
    # --- Durdurma koşulları (aşamadan bağımsız, öncelikli) ---
    if paid:
        return CollectionDecision(
            stage=Stage.NONE, stop_reason="odeme_alindi"
        )
    if restructuring:
        return CollectionDecision(
            stage=Stage.NONE, stop_reason="yeniden_yapilandirma"
        )
    if enrollment_deleted:
        return CollectionDecision(
            stage=Stage.NONE, stop_reason="kayit_silindi"
        )
    if claims_no_debt:
        return CollectionDecision(
            stage=Stage.NONE,
            stop_reason="borc_itirazi",
            handoff_to_human=True,
        )

    # --- Zamana göre aşama seçimi ---
    days_overdue = (today - due_date).days
    if days_overdue < -3:
        return _decision_for_stage(Stage.NONE)  # vadeye zaman var
    if days_overdue < 0:
        return _decision_for_stage(Stage.GENTLE_WHATSAPP)  # vade -3 .. -1
    if days_overdue == 0:
        return _decision_for_stage(Stage.DUE_DAY_SMS)
    if days_overdue < 14:
        # +3 ve +7 günlerde uyarı temas noktaları; 8-13. günlerde aşama korunur.
        return _decision_for_stage(Stage.WARNING)
    if days_overdue < 30:
        return _decision_for_stage(Stage.AI_CALL_GENTLE)
    return _decision_for_stage(Stage.AI_CALL_ESCALATED)
