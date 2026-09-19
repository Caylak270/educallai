"""Pattern 8 — TTS öncesi Türkçe metin normalizasyonu (en kapsamlı saf modül).

Cartesia Sonic gibi TTS motorları sayı, para, yüzde, tarih ve saat
birleşimlerini Türkçede hatalı okuyabilir. Bu modül, LLM çıktısının
sentezlenmesinden **önce** deterministik kurallarla okunuşa çevirir.

Normalizasyon boru hattı (sıra önemlidir):

1. Taksit          ``5x3.000``            → ``beş taksit, her biri üç bin lira``
2. Tarih           ``15/09/2026``         → ``on beş Eylül iki bin yirmi altı``
3. Saat aralığı    ``09:00-18:00``        → ``sabah dokuzdan akşam altıya kadar``
4. Tek saat        ``15:30``              → ``on beş otuz``
5. Para aralığı    ``12.000-15.000 TL``   → ``on iki bin ila on beş bin lira arası``
6. Para            ``₺30.000`` / ``12000 TL`` → ``otuz bin lira`` / ``on iki bin lira``
7. Yüzde           ``%85.3`` / ``üst %5`` → ``yüzde seksen beş nokta üç`` / ``üst yüzde beş``
8. Telefon         ``05551234567``        → rakam rakam okuma
9. Kalan sayılar   ``72 net``, ``325.45`` → ``yetmiş iki net``, ``üç yüz yirmi beş nokta dört beş``

Tasarım kararları (determinizim için sabitlenmiştir):

* Binlik ayraç olarak **nokta ve virgül her ikisi** desteklenir
  (``12.000`` = ``12,000`` = on iki bin). Ardından 3 hane gelen ayraç
  binlik ayracı, 1-2 hane gelen ayraç ondalık ayracı sayılır.
* Ondalık kısım **her zaman hane hane** okunur: ``325.45`` →
  "nokta dört beş" (yanlış gruplama riskine karşı).
* Para biriminde tam olarak 2 haneli kuruş kısmı varsa "kuruş" olarak
  okunur: ``1.500,50 TL`` → "bin beş yüz lira elli kuruş".
* Saat aralıklarında dönem eki kullanılır (sabah/öğlen/akşam); tek saatte
  24 saat biçimi korunur (``15:30`` → "on beş otuz").

Tüm fonksiyonlar **saf ve deterministik**tir; harici servis çağrısı yoktur.
"""

from __future__ import annotations

import re

# --------------------------------------------------------------------------
# Sözlükler
# --------------------------------------------------------------------------

#: 0-9 birler basamağı.
ONES: list[str] = [
    "", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"
]
#: 10-90 onlar basamağı.
TENS: list[str] = [
    "", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"
]
#: Binlik ve üzeri ölçekler (index = 10**n).
SCALES: list[str] = ["", "bin", "milyon", "milyar"]
#: Telefon ve ondalık hane okuması için 0-9.
DIGITS: list[str] = [
    "sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"
]
#: Ay isimleri (1-indexed; okunurken büyük harfle yazılır).
MONTHS: list[str] = [
    "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]

BACK_VOWELS = frozenset("aıou")
FRONT_VOWELS = frozenset("eiöü")
VOWELS = BACK_VOWELS | FRONT_VOWELS
#: Sessiz harf sertleşmesi (sert ünsüzler) — ablative ek seçimi için.
VOICELESS_CONSONANTS = frozenset("fstkçşhp")

# --------------------------------------------------------------------------
# Sayı → yazı
# --------------------------------------------------------------------------


def _three_digit_words(n: int) -> str:
    """0-999 arası tam sayıyı yazıya çevirir (ör. 213 → 'iki yüz on üç')."""
    parts: list[str] = []
    hundreds, rest = divmod(n, 100)
    tens, ones = divmod(rest, 10)
    if hundreds:
        # Kural: 100 tek başına 'yüz'dür ('biryüz' denmez).
        parts.append("yüz" if hundreds == 1 else f"{ONES[hundreds]} yüz")
    if tens:
        parts.append(TENS[tens])
    if ones:
        parts.append(ONES[ones])
    return " ".join(parts)


def number_to_turkish_words(n: int) -> str:
    """Tam sayıyı Türkçe yazıya çevirir (0-999.999.999.999 aralığı destekli).

    Örnekler: ``0`` → "sıfır", ``1000`` → "bin", ``21000`` → "yirmi bir bin".

    Args:
        n: Çevrilecek tam sayı (negatif sayılar "eksi" önekiyle okunur).

    Raises:
        TypeError: ``n`` bir tam sayı değilse.
    """
    if not isinstance(n, int) or isinstance(n, bool):
        raise TypeError(f"Tam sayı bekleniyor, gelen: {type(n).__name__}")
    if n < 0:
        return "eksi " + number_to_turkish_words(-n)
    if n == 0:
        return "sıfır"

    parts: list[str] = []
    scale_index = 0
    while n > 0:
        group = n % 1000
        if group:
            if scale_index == 1 and group == 1:
                # Kural: 1000 tek başına 'bin'dir ('birbin' denmez).
                parts.append("bin")
            else:
                words = _three_digit_words(group)
                scale = SCALES[scale_index]
                parts.append(f"{words} {scale}".strip())
        n //= 1000
        scale_index += 1
    return " ".join(reversed(parts))


# --------------------------------------------------------------------------
# Ayraç / ondalık ayrıştırma
# --------------------------------------------------------------------------


def _parse_amount(text: str) -> tuple[int, str | None, str]:
    """Sayı metnini (tam kısım, ondalık haneler, ayraç sözcüğü) üçlüsüne ayırır.

    Binlik ve ondalık ayraç olarak hem nokta hem virgül kabul edilir:
    ``'12.000'`` → ``(12000, None, '')``; ``'325,45'`` → ``(325, '45', 'virgül')``.
    """
    t = text.strip().strip(".,")
    # 1) Binlik ayraçlı biçim: 12.000 / 1.250.500 / 1.500,50
    m = re.fullmatch(r"(\d{1,3}(?:[.,]\d{3})+)(?:([.,])(\d{1,2}))?", t)
    if m:
        whole = int(re.sub(r"[.,]", "", m.group(1)))
        if m.group(3):
            sep_word = "virgül" if m.group(2) == "," else "nokta"
            return whole, m.group(3), sep_word
        return whole, None, ""
    # 2) Düz ondalık: 325.45 / 85,3
    m = re.fullmatch(r"(\d+)([.,])(\d+)", t)
    if m:
        sep_word = "virgül" if m.group(2) == "," else "nokta"
        return int(m.group(1)), m.group(3), sep_word
    # 3) Düz tam sayı
    return int(t), None, ""


def _fraction_words(frac: str, sep_word: str) -> str:
    """Ondalık kısmı hane hane okur: ('45', 'nokta') → 'nokta dört beş'."""
    digits = " ".join(DIGITS[int(d)] for d in frac if d.isdigit())
    return f"{sep_word} {digits}".strip()


def decimal_to_words(text: str) -> str:
    """Ondalık sayı metnini okunuşa çevirir: ``'325.45'`` →
    ``'üç yüz yirmi beş nokta dört beş'`` (nokta/virgül korunur)."""
    whole, frac, sep = _parse_amount(text)
    words = number_to_turkish_words(whole)
    if frac:
        return f"{words} {_fraction_words(frac, sep)}"
    return words


# --------------------------------------------------------------------------
# Para / yüzde / tarih / saat / telefon
# --------------------------------------------------------------------------


def money_to_words(amount_text: str) -> str:
    """Para tutarını okunuşa çevirir: ``'30.000'`` → ``'otuz bin lira'``.

    2 haneli kuruş kısmı "kuruş" olarak okunur: ``'1.500,50'`` →
    ``'bin beş yüz lira elli kuruş'``.
    """
    whole, frac, sep = _parse_amount(amount_text)
    words = number_to_turkish_words(whole)
    if frac and len(frac) == 2:
        return f"{words} lira {number_to_turkish_words(int(frac))} kuruş"
    if frac:
        return f"{words} lira {_fraction_words(frac, sep)}"
    return f"{words} lira"


def _amount_words_without_currency(amount_text: str) -> str:
    """Para aralıklarında kullanılan, 'lira' eki içermeyen tutar okunuşu."""
    whole, frac, sep = _parse_amount(amount_text)
    words = number_to_turkish_words(whole)
    if frac:
        return f"{words} {_fraction_words(frac, sep)}"
    return words


def percent_to_words(percent_text: str) -> str:
    """Yüzde değerini okunuşa çevirir: ``'85.3'`` → ``'seksen beş nokta üç'``."""
    whole, frac, sep = _parse_amount(percent_text)
    words = number_to_turkish_words(whole)
    if frac:
        return f"yüzde {words} {_fraction_words(frac, sep)}"
    return f"yüzde {words}"


def date_to_words(day: int, month: int, year: int) -> str:
    """Tarihi okunuşa çevirir: ``(15, 9, 2026)`` → ``'on beş Eylül iki bin yirmi altı'``.

    Raises:
        ValueError: Ay 1-12 veya gün 1-31 dışındaysa.
    """
    if not 1 <= month <= 12:
        raise ValueError(f"Geçersiz ay: {month}")
    if not 1 <= day <= 31:
        raise ValueError(f"Geçersiz gün: {day}")
    return (
        f"{number_to_turkish_words(day)} {MONTHS[month]} "
        f"{number_to_turkish_words(year)}"
    )


def time_to_words(hour: int, minute: int) -> str:
    """Tek saati 24 saat biçiminde okur: ``(15, 30)`` → ``'on beş otuz'``.

    Tam saatlerde dakika söylenmez (``09:00`` → "dokuz"); 10'dan küçük
    dakikalar 'sıfır' ile okunur (``09:05`` → "dokuz sıfır beş").
    """
    if not 0 <= hour <= 23:
        raise ValueError(f"Geçersiz saat: {hour}")
    if not 0 <= minute <= 59:
        raise ValueError(f"Geçersiz dakika: {minute}")
    hour_words = number_to_turkish_words(hour)
    if minute == 0:
        return hour_words
    if minute < 10:
        return f"{hour_words} sıfır {number_to_turkish_words(minute)}"
    return f"{hour_words} {number_to_turkish_words(minute)}"


#: Saatlerin ablative ( '-dan/-den' ) halleri — 0-23 için sabit tablo.
HOUR_ABLATIVE: dict[int, str] = {
    0: "sıfırdan", 1: "birden", 2: "ikiden", 3: "üçten", 4: "dörtten",
    5: "beşten", 6: "altıdan", 7: "yediden", 8: "sekizden", 9: "dokuzdan",
    10: "ondan", 11: "on birden", 12: "on ikiden", 13: "on üçten",
    14: "on dörtten", 15: "on beşten", 16: "on altıdan", 17: "on yediden",
    18: "on sekizden", 19: "on dokuzdan", 20: "yirmiden", 21: "yirmi birden",
    22: "yirmi ikiden", 23: "yirmi üçten",
}

#: Saatlerin dative ( '-a/-e/-ya/-ye' ) halleri — 0-23 için sabit tablo.
HOUR_DATIVE: dict[int, str] = {
    0: "sıfıra", 1: "bire", 2: "ikiye", 3: "üçe", 4: "dörde",
    5: "beşe", 6: "altıya", 7: "yediye", 8: "sekize", 9: "dokuza",
    10: "ona", 11: "on bire", 12: "on ikiye", 13: "on üçe", 14: "on dörde",
    15: "on beşe", 16: "on altıya", 17: "on yediye", 18: "on sekize",
    19: "on dokuza", 20: "yirmiye", 21: "yirmi bire", 22: "yirmi ikiye",
    23: "yirmi üçe",
}


def _period_of_hour(hour: int) -> tuple[str, int]:
    """Saati dönem önekiyle eşler: 9 → ('sabah', 9), 18 → ('akşam', 6)."""
    if hour < 12:
        return "sabah", hour
    if hour <= 16:
        return "öğlen", 12 if hour == 12 else hour - 12
    return "akşam", hour - 12


def time_range_to_words(h1: int, m1: int, h2: int, m2: int) -> str:
    """Saat aralığını dönem önekleriyle okur:
    ``(9, 0, 18, 0)`` → ``'sabah dokuzdan akşam altıya kadar'``."""
    p1, hh1 = _period_of_hour(h1)
    p2, hh2 = _period_of_hour(h2)
    if m1 == 0:
        start = f"{p1} {HOUR_ABLATIVE[hh1]}"
    else:
        phrase = f"{p1} {time_to_words(hh1, m1)}"
        start = phrase + _ablative(phrase)
    if m2 == 0:
        end = f"{p2} {HOUR_DATIVE[hh2]}"
    else:
        phrase = f"{p2} {time_to_words(hh2, m2)}"
        end = phrase + _dative(phrase)
    return f"{start} {end} kadar"


def phone_to_words(digits_text: str) -> str:
    """Telefonu rakam rakam okur: ``'05551234567'`` →
    ``'sıfır beş beş beş bir iki üç dört beş altı yedi'`` (boşluk/ayraç yoksayılır)."""
    return " ".join(DIGITS[int(ch)] for ch in digits_text if ch.isdigit())


# --------------------------------------------------------------------------
# Türkçe ek yardımcıları (birleşik "saat dakika" ifadeleri için)
# --------------------------------------------------------------------------


def _last_vowel(word: str) -> str:
    """Kelimedeki son ünlüyü döndürür; ünlü yoksa 'a' varsayar."""
    for ch in reversed(word):
        if ch in VOWELS:
            return ch
    return "a"


def _ablative(word: str) -> str:
    """Ablative ek ('dan/den/tan/ten') seçer: 'dokuz otuz' → 'dan'."""
    back = _last_vowel(word) in BACK_VOWELS
    low = word[-1] if word else "a"
    if low in VOWELS:
        return "dan" if back else "den"
    if low in VOICELESS_CONSONANTS:
        return "tan" if back else "ten"
    return "dan" if back else "den"


def _dative(word: str) -> str:
    """Dative ek ('a/e/ya/ye') seçer: 'altı otuz' → 'a'."""
    back = _last_vowel(word) in BACK_VOWELS
    if word and word[-1] in VOWELS:
        return "ya" if back else "ye"
    return "a" if back else "e"


# --------------------------------------------------------------------------
# Regex kuralları (sıralı uygulanır)
# --------------------------------------------------------------------------

# 1) Taksit: 5x3.000 / 5 x 3000 TL / 5x3.000₺ (para birimi eki varsa yutulur)
_INSTALLMENT_RE = re.compile(
    r"(?<![\d])(\d{1,2})\s*[xX×]\s*(\d[\d.,]*)"
    r"(?:\s*(?:(?i:TL|lira)\b|₺))?(?![\d])"
)
# 2) Tarih: 15/09/2026 | 15.09.2026 | 15-09-2026
_DATE_RE = re.compile(
    r"(?<![\d])(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?![\d])"
)
# 3) Saat aralığı: 09:00-18:00
_TIME_RANGE_RE = re.compile(
    r"(?<![\d])(\d{1,2}):(\d{2})\s*(?:-|–|—)\s*(\d{1,2}):(\d{2})(?![\d])"
)
# 4) Tek saat: 15:30
_TIME_RE = re.compile(r"(?<![\d])(\d{1,2}):(\d{2})(?![\d])")
# 5) Para aralığı: 12.000-15.000 TL | 12000 ile 15000 TL
_MONEY_RANGE_RE = re.compile(
    r"(?<![\d])(\d[\d.,]*)\s*(?:-|–|—|\bile\b)\s*(\d[\d.,]*)\s*(?:(?i:TL|lira)\b|₺)"
)
# 6) Para: ₺30.000 | 12000 TL | 30.000₺ | 1.500,50 TL
_MONEY_RE = re.compile(
    r"₺\s*(\d[\d.,]*)|(?<![\d])(\d[\d.,]*)\s*(?:(?i:TL|lira)\b|₺)"
)
# 7) Yüzde: %85.3 | % 5 | %85,3 | 85%
_PERCENT_RE = re.compile(
    r"%\s*(\d[\d.,]*)|(?<![\d])(\d[\d.,]*)\s*%"
)
# 8) Telefon: 05551234567 | +905551234567 | 0555 123 45 67 | +90 555 123 45 67
_PHONE_RE = re.compile(
    r"(?<![\d])(?:\+?90[\s-]?)?0?\d{10}(?![\d])"
    r"|(?<![\d])(?:\+?90[\s-]?)?0?\d{3}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}(?![\d])"
)
# 9) Kalan sayılar: binlik ayraçlı | ondalıklı | düz tam sayı
_NUM_RE = re.compile(
    r"(?<![\d])\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?(?![\d])"
    r"|(?<![\d])\d+[.,]\d{1,2}(?![\d])"
    r"|(?<![\d])\d+(?![\d])"
)


def normalize_for_tts(text: str) -> str:
    """Metni TTS sentezine uygun Türkçe okunuşa çevirir.

    Yukarıdaki 9 adımlı boru hattını sırayla uygular; kural dışı metin
    (geçersiz tarih gibi) olduğu gibi korunur. Fonksiyon saf ve
    deterministiktir.
    """
    if not text:
        return text

    def _safe(repl):  # type: ignore[no-untyped-def]
        def handler(match: re.Match[str]) -> str:
            try:
                return repl(match)
            except (ValueError, TypeError, IndexError):
                return match.group(0)  # kural tutmadı → orijinali koru

        return handler

    def _inst(m: re.Match[str]) -> str:
        count = int(m.group(1))
        amount = m.group(2)
        return f"{number_to_turkish_words(count)} taksit, her biri {money_to_words(amount)}"

    def _date(m: re.Match[str]) -> str:
        return date_to_words(int(m.group(1)), int(m.group(2)), int(m.group(3)))

    def _time_range(m: re.Match[str]) -> str:
        return time_range_to_words(
            int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
        )

    def _time(m: re.Match[str]) -> str:
        return time_to_words(int(m.group(1)), int(m.group(2)))

    def _money_range(m: re.Match[str]) -> str:
        a = _amount_words_without_currency(m.group(1))
        b = _amount_words_without_currency(m.group(2))
        return f"{a} ila {b} lira arası"

    def _money(m: re.Match[str]) -> str:
        amount = m.group(1) if m.group(1) else m.group(2)
        return money_to_words(amount)

    def _percent(m: re.Match[str]) -> str:
        value = m.group(1) if m.group(1) else m.group(2)
        return percent_to_words(value)

    def _phone(m: re.Match[str]) -> str:
        return phone_to_words(m.group(0))

    def _num(m: re.Match[str]) -> str:
        return decimal_to_words(m.group(0))

    result = text
    for pattern, repl in (
        (_INSTALLMENT_RE, _inst),
        (_DATE_RE, _date),
        (_TIME_RANGE_RE, _time_range),
        (_TIME_RE, _time),
        (_MONEY_RANGE_RE, _money_range),
        (_MONEY_RE, _money),
        (_PERCENT_RE, _percent),
        (_PHONE_RE, _phone),
        (_NUM_RE, _num),
    ):
        result = pattern.sub(_safe(repl), result)
    return result
