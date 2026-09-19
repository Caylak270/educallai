"""Pattern 3 — Lag Recovery: veri akışı kopukluklarını yakalayan 4 senaryo.

AI asistanı bir şeyi "yaptı" der ama arka ofis akışı tamamlanmamış
olabilir (apinode lag, webhook kaçması vb.). Bu modül, seans bitiminde
düzenlenen state sözlüğünden kopuklukları saf kurallarla tespit eder ve
telafi aksiyon listesi üretir:

1. ``appointment``       : AI randevuyu onayladı ama takvime işlenmedi
                           → takvim senkronizasyonunu zorla.
2. ``payment_reported``  : Veli ödedi dedi ama ödeme doğrulanmadı
                           → ödeme akışını durdur, doğrulamaya işaretle.
3. ``enrollment_intent`` : Kayıt niyeti var ama handoff açılmamış
                           → handoff oluştur.
4. ``exam_registration`` : Deneme sınavına kayıt istendi ama listeye
                           eklenmedi → listeye ekle + WhatsApp onayı.

Saf modüldür: ``dict`` alır, ``RecoveryAction`` listesi döndürür.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class RecoveryAction:
    """Tek bir senaryo için telafi kararı."""

    #: Senaryo adı: "appointment" | "payment_reported" |
    #: "enrollment_intent" | "exam_registration"
    scenario: str
    #: Uygulanacak aksiyon kodları (sıralı).
    actions: list[str] = field(default_factory=list)
    #: İnsan tarafından okunur açıklama (log/dashboard için).
    description: str = ""
    #: "low" | "medium" | "high" — izleme paneli önceliği.
    severity: str = "medium"


def _has_flag(state: dict, key: str) -> bool:
    """Bayrak gerçekten doğru mu? (None/False/eksik → False)"""
    return bool(state.get(key))


def detect_gaps(state: dict) -> list[RecoveryAction]:
    """Verilen seans state'inden telafi gerektiren kopuklukları bulur.

    Args:
        state: Seans kaydından türetilen düz sözlük. Tanınan anahtarlar::

            appointment_confirmed_by_ai, calendar_synced,
            payment_reported_paid, payment_verified,
            enrollment_intent ("enroll"), handoff_created,
            exam_registration_requested, added_to_exam_list

    Returns:
        Tespit edilen senaryolar için ``RecoveryAction`` listesi
        (senaryo sırasına göre; kopukluk yoksa boş liste).
    """
    actions: list[RecoveryAction] = []

    # 1) Randevu: AI onayladı, takvim senkronu eksik.
    if _has_flag(state, "appointment_confirmed_by_ai") and not _has_flag(
        state, "calendar_synced"
    ):
        actions.append(
            RecoveryAction(
                scenario="appointment",
                actions=["force_calendar_sync"],
                description=(
                    "AI randevuyu onayladı ancak takvim kaydı oluşmamış; "
                    "senkronizasyon zorlanmalı."
                ),
                severity="high",
            )
        )

    # 2) Ödeme bildirimi: veli ödedi dedi, doğrulama yok.
    if _has_flag(state, "payment_reported_paid") and not _has_flag(
        state, "payment_verified"
    ):
        actions.append(
            RecoveryAction(
                scenario="payment_reported",
                actions=["halt_payment_flow", "mark_for_verification"],
                description=(
                    "Veli ödeme yaptığını söyledi fakat ödeme doğrulanmadı; "
                    "ödeme akışı durdurulup incelemeye alınmalı."
                ),
                severity="high",
            )
        )

    # 3) Kayıt niyeti: handoff açılmamış.
    if state.get("enrollment_intent") == "enroll" and not _has_flag(
        state, "handoff_created"
    ):
        actions.append(
            RecoveryAction(
                scenario="enrollment_intent",
                actions=["create_handoff"],
                description=(
                    "Kayıt niyeti tespit edildi ancak insana aktarım "
                    "(handoff) kaydı açılmamış."
                ),
                severity="medium",
            )
        )

    # 4) Deneme sınavı kaydı: listeye eklenmemiş + WhatsApp onayı.
    if _has_flag(state, "exam_registration_requested") and not _has_flag(
        state, "added_to_exam_list"
    ):
        actions.append(
            RecoveryAction(
                scenario="exam_registration",
                actions=["add_to_exam_list", "send_whatsapp_confirmation"],
                description=(
                    "Deneme sınavı kaydı istendi ancak öğrenci listeye "
                    "eklenmemiş; ekleme ve WhatsApp onayı gerekli."
                ),
                severity="medium",
            )
        )

    return actions
