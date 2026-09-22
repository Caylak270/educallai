export const WA_PHONE = "905309929505";

export function waLink(text: string) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

/* Tüm satış CTA'ları çevrimiçi ödeme yerine WhatsApp randevusuna yönlendirir:
   paket/görüşme seçimi randevuda netleşir. */
export const WA_START_TRIAL = waLink(
  "Merhaba, educallai için ücretsiz görüşme randevusu planlamak istiyorum."
);
export const WA_DEMO_CALL = waLink(
  "Merhaba, kokpiti inceledim. Kendi kursum için görüşme randevusu planlamak istiyorum."
);
export const WA_BOOK_MEETING = waLink(
  "Merhaba, canlı demo görüşmesi planlamak istiyorum."
);
export const WA_LOSS_CALCULATOR = waLink(
  "Merhaba, kayıp gelir hesaplayıcıyı kullandım. Kursumuzun kayıplarını konuşmak için randevu almak istiyorum."
);
export const WA_INFO = waLink(
  "Merhaba, educallai hakkında bilgi almak istiyorum."
);
