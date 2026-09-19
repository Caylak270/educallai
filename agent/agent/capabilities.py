"""Pattern 2 — Capability Matrix: dershane başına yetenek matrisi.

Her kiracı (dershane) için asistanın hangi işlemleri **yapmasına
izin verildiğini** taşır. Araç (tool) listesi bu matrise göre dinamik
olarak filtrelenir; izin olmayan yeteneğin aracı LLM'e hiç sunulmaz.

Özel kural: ``can_enroll_student`` **sistem gereği her zaman False**
kalır — AI tek başına kayıt işlemi gerçekleştiremez (KVKK ve süreç
kuralı); kayıt niyeti daima insana aktarım (handoff) ile sonuçlanır.

Saf modüldür; girdi olarak JSON (metin, dosya ya da sözlük) alır.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, fields
from pathlib import Path
from typing import Any, Iterable, Mapping

logger = logging.getLogger(__name__)

#: Araç adı → yetenek alanı eşlemesi. Filtreleme bu tablo üzerinden yapılır.
TOOL_CAPABILITY_MAP: dict[str, str] = {
    "quote_pricing": "can_share_pricing",
    "create_appointment": "can_create_appointment",
    "reschedule_appointment": "can_reschedule_appointment",
    "check_exam_results": "can_check_exam_results",
    "check_payment_status": "can_check_payment_status",
    "accept_online_payment": "can_accept_online_payment",
    "enroll_student": "can_enroll_student",
    "share_schedule": "can_share_schedule",
    "send_location": "can_send_location",
    "transfer_to_human": "can_transfer_to_human",
    "schedule_trial_exam": "has_trial_exam",
}


@dataclass
class DershaneCapabilities:
    """Bir dershane için asistan yetenek matrisi.

    Varsayılan: **her şey kapalı** (``can_transfer_to_human`` hariç —
    güvenlik gereği insan aktarımı her zaman açıktır).
    """

    #: Fiyat bilgisi paylaşabilir mi.
    can_share_pricing: bool = False
    #: Yeni randevu oluşturabilir mi.
    can_create_appointment: bool = False
    #: Mevcut randevuyu değiştirebilir mi.
    can_reschedule_appointment: bool = False
    #: Deneme sınavı sonuçlarını okuyabilir mi.
    can_check_exam_results: bool = False
    #: Ödeme durumunu sorgulayabilir mi.
    can_check_payment_status: bool = False
    #: Online ödeme kabul edebilir mi.
    can_accept_online_payment: bool = False
    #: Öğrenci kaydı yapabilir mi — HER ZAMAN False (sistem kuralı).
    can_enroll_student: bool = False
    #: Ders programını paylaşabilir mi.
    can_share_schedule: bool = False
    #: Konum/kroki gönderebilir mi.
    can_send_location: bool = False
    #: İnsan temsilciye aktarım yapabilir mi (varsayılan açık).
    can_transfer_to_human: bool = True
    #: Deneme sınavına davet/planlama yapabilir mi.
    has_trial_exam: bool = False

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> "DershaneCapabilities":
        """Sözlükten yükler; bilinmeyen anahtarları yoksayar.

        ``can_enroll_student=True`` gelse bile sistem kuralı gereği
        ``False``'a zorlanır ve uyarı loglanır.
        """
        known = {f.name for f in fields(cls)}
        kwargs = {k: bool(v) for k, v in data.items() if k in known}
        caps = cls(**kwargs)
        if caps.can_enroll_student:
            logger.warning(
                "can_enroll_student JSON'da 'true' geldi; sistem kuralı "
                "gereği False'a zorlandı (AI kayıt işlemi yapamaz)."
            )
        caps.can_enroll_student = False
        return caps

    def to_dict(self) -> dict[str, bool]:
        """Yetenek matrisinin sözlük karşılığı."""
        return asdict(self)


def load_capabilities(
    source: Mapping[str, Any] | str | Path,
) -> DershaneCapabilities:
    """Yetenek matrisini sözlük, JSON metni ya da JSON dosya yolundan yükler.

    Raises:
        ValueError: Kaynak ayrıştırılamazsa.
    """
    if isinstance(source, Mapping):
        return DershaneCapabilities.from_dict(source)
    text = str(source)
    if "\n" not in text and "{" not in text:
        # Dosya yolu gibi görünüyor.
        text = Path(text).read_text(encoding="utf-8")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Yetenek JSON'u ayrıştırılamadı: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("Yetenek kaynağı bir JSON nesnesi olmalı.")
    return DershaneCapabilities.from_dict(data)


def filter_tools(
    tool_names: Iterable[str], caps: DershaneCapabilities
) -> list[str]:
    """Araç adlarını yetenek matrisine göre filtreler.

    İzin karşılığı olmayan bir araç (eşleşme yok) olduğu gibi korunur;
    eşleşmesi olan araç yalnızca ilgili yetenek ``True`` ise listede kalır.
    ``enroll_student`` ise her koşulda elenir.
    """
    result: list[str] = []
    for name in tool_names:
        capability_key = TOOL_CAPABILITY_MAP.get(name)
        if capability_key is None:
            result.append(name)  # eşleşme yok → kısıt yok
            continue
        if getattr(caps, capability_key, False):
            result.append(name)
    return result


def allowed_tool_names(caps: DershaneCapabilities) -> list[str]:
    """Bilinen tüm araçlardan izinli olanların listesini döndürür."""
    return filter_tools(TOOL_CAPABILITY_MAP.keys(), caps)
