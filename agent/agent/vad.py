"""Pattern 5 — Türkçe konuşma için Silero VAD kalibrasyon sabitleri.

Türkçenin prozodi özellikleri İngilizce varsayılanlarından farklıdır:

* Kısa cevap kelimeleri ("evet", "hayır", "tamam", "olur") tek heceli ya da
  iki hecelidir ve varsayılan ``min_speech_duration`` ile yutulabilir.
* "ııı...", "şey...", "hm..." gibi doldurma sesleri (filler) düşünme
  anını işaret eder; cümle sonu sanılıp asistan erken konuşmaya
  başlamamalıdır (bu yüzden ``max_endpointing_delay`` yüksektir).
* Telefon hattının arka plan gürültüsü yanlış konuşma aktivasyonu
  üretebildiği için ``activation_threshold`` hafif yükseltilmiştir.

Tüm değerler saniye/sayı birimindedir ve saf veridir — harici servis
çağrısı içermez. Canlı bağlam (Silero eklentisi) yalnızca
``pipeline.py`` içinde kurulur.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TurkishVADConfig:
    """Türkçe aramalar için VAD/barge-in kalibrasyonu.

    Alanlar, LiveKit Silero eklentisinin ``VAD.load(...)`` parametreleriyle
    birebir eşleşecek şekilde seçilmiştir (bkz. ``to_livekit_vad_kwargs``).
    """

    #: Bir sesin "konuşma" sayılması için en kısa süre (sn).
    #: 0.3 sn, "evet"/"hayır" gibi kısa Türkçe onayları korur.
    min_speech_duration: float = 0.3

    #: Konuşma aktivasyon eşiği (0-1). 0.55, telefon hattı gürültüsü ile
    #: gerçek konuşmayı dengeler (varsayılan 0.5'ten hafif yüksek).
    activation_threshold: float = 0.55

    #: Kullanıcının asistanı kesmesi (barge-in) için gereken en az kelime
    #: sayısı. Tek kelimelik televizyon/trafik sesi kesinti tetiklemesin.
    min_interruption_words: int = 2

    #: Kullanıcı durduktan sonra asistanın yanıt vermeden önce bekleyeceği
    #: en uzun süre (sn). Türkçe doldurma sesleri ("ııı", "şey") nedeniyle
    #: 6.0 sn'e kadar sabırlı olunur; streaming overlap ile toplam gecikme
    #: yine de <600 ms hedefini korur.
    max_endpointing_delay: float = 6.0

    #: Turn sonunu (endpointing) varsaymak için gereken sessizlik (sn).
    #: 0.55 sn; Türkçe kelime aralarındaki doğal duraklamalardan ayrışır.
    min_silence_duration: float = 0.55

    #: Konuşma başlangıcından önce tutulacak tampon (sn) — ilk hecenin
    #: STT'ye eksik gitmesini engeller.
    prefix_padding_duration: float = 0.2

    def to_livekit_vad_kwargs(self) -> dict[str, float]:
        """Silero eklentisine (``VAD.load``) geçirilecek kwargs sözlüğü."""
        return {
            "min_speech_duration_ms": int(self.min_speech_duration * 1000),
            "min_silence_duration_ms": int(self.min_silence_duration * 1000),
            "prefix_padding_duration_ms": int(self.prefix_padding_duration * 1000),
            "activation_threshold": self.activation_threshold,
        }

    def allows_interruption(self, transcribed_word_count: int) -> bool:
        """Pattern 6 speech gating: kesinti yeterli kelime sayısına ulaştı mı?

        Args:
            transcribed_word_count: Kullanıcının yeni konuşma turunda
                şimdiye kadar üretilen kelime sayısı (STT interim'ından).

        Returns:
            ``True`` ise asistanın konuşması kesilebilir.
        """
        return transcribed_word_count >= self.min_interruption_words


#: Modül genelinde kullanılan tek kalibrasyon örneği.
DEFAULT_TURKISH_VAD = TurkishVADConfig()
