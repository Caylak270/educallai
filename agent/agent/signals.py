"""Pattern 1 — record_signals: yapılandırılmış görüşme sinyalleri.

LLM'in görüşme sırasında çağıracağı ``record_signals`` fonksiyon aracının
pydantic modeli ve JSON tool şeması üreticisi. Model, LLM'in yalnızca
**duyduğu** alanları kısmi olarak doldurabilmesi için tüm alanlarda
``None`` varsayılanı kullanır; eksik alanlar ``merge_signals`` ile
birleştirilir.

Bu modül safdır (pydantic hariç bağımlılık yok) ve LiveKit'e ait hiçbir
şey import etmez; üretilen şema ``pipeline.py`` içinde tool olarak
bağlanır (Pattern B: yanıt akışını bloklamayan paralel kayıt).
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

#: Duygu durumu.
Sentiment = Literal["positive", "neutral", "negative"]
#: Lead sıcaklığı (satış olgunluğu).
LeadTemperature = Literal["hot", "warm", "cold"]
#: Fiyat hassasiyeti.
PriceSensitivity = Literal["low", "medium", "high"]
#: Görüşmenin ana niyeti.
Intent = Literal[
    "pricing",
    "appointment",
    "exam_results",
    "payment",
    "enrollment",
    "schedule",
    "trial_exam",
    "location",
    "complaint",
    "other",
]
#: Takip zamanlaması.
FollowUpTiming = Literal["today", "this_week", "next_week", "unsure"]


class Signals(BaseModel):
    """Bir görüşmeden toplanan tüm sinyaller (hepsi kısmi/opsiyonel).

    LLM kuralı: sadece konuşmada **açıkça duyulan** alanları doldur;
    tahmin yürütme. ``None`` bırakılan alanlar mevcut kaydı bozmaz.
    """

    #: Genel duygu tonu.
    sentiment: Optional[Sentiment] = None
    #: Görüşmenin ana niyeti.
    intent: Optional[Intent] = None
    #: Lead sıcaklığı.
    lead_temperature: Optional[LeadTemperature] = None
    #: Kayıt olgunluğu (0=hiç sıcak bakmıyor, 10=kaydolmaya hazır).
    enrollment_readiness: Optional[int] = Field(None, ge=0, le=10)
    #: Fiyat hassasiyeti.
    price_sensitivity: Optional[PriceSensitivity] = None
    #: Söylenen öğrenci sınıfı (ör. "8", "11. sınıf").
    student_grade_mentioned: Optional[str] = None
    #: Söylenen sınav türü (ör. "LGS", "TYT").
    exam_type_mentioned: Optional[str] = None
    #: Kardeş/kardeşler de kayıt dikkate alınacak mı.
    sibling_mentioned: Optional[bool] = None
    #: Rakip kurum adı geçti mi.
    competitor_mentioned: Optional[bool] = None
    #: Asistan bir yetki sınırına takıldı mı (fiyat, randevu vb.).
    capability_limit_reached: Optional[bool] = None
    #: Asistan insana aktarımı öneriyor mu.
    recommend_handoff: Optional[bool] = None
    #: Aktarım gerekçesi (``recommend_handoff=True`` ise).
    handoff_reason: Optional[str] = None
    #: Takip araması gerekli mi.
    follow_up_needed: Optional[bool] = None
    #: Takip zamanlaması.
    follow_up_timing: Optional[FollowUpTiming] = None
    #: İtiraz edilen ödeme konusu (ör. "taksitler yüksek").
    payment_objection: Optional[str] = None
    #: Ödeme sözü alındı mı.
    payment_promise: Optional[bool] = None
    #: Yapılandırılmış risk sinyali (ör. "iptal_sinyali", "şikayet").
    risk_signal: Optional[str] = None
    #: Veli aramamayı rica etti mi (DNC listesi zorunlu).
    do_not_call_requested: Optional[bool] = None


def merge_signals(base: Signals, update: Signals) -> Signals:
    """İki kısmi sinyal kümesini birleştirir (``update`` boş olmayanları kazanır)."""
    data = base.model_dump()
    data.update(update.model_dump(exclude_none=True))
    return Signals(**data)


def build_record_signals_tool() -> dict[str, Any]:
    """LiveKit/OpenAI fonksiyon-tool biçiminde ``record_signals`` şeması üretir.

    Dönen sözlük, ``llm.FunctionTool``/function-calling ``tools`` listesine
    doğrudan eklenebilir (Pattern B: paralel çağrı, konuşma akışını
    bloklamaz).
    """
    schema = Signals.model_json_schema()
    # Kök şemadan başlık/örnek meta verilerini temizle.
    schema.pop("title", None)
    return {
        "type": "function",
        "name": "record_signals",
        "description": (
            "Görüşmede duyduğun yapılandırılmış sinyalleri kaydet. "
            "Sadece açıkça duyduğun alanları doldur; tahmin etme. "
            "Görüşme boyunca yeni bilgi öğrendikçe tekrar çağırabilirsin."
        ),
        "parameters": schema,
    }
