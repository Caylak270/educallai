"""Pattern 8 — TTS Türkçe normalizasyon testleri.

Şartnamedeki TÜM dönüşüm tablosu örnekleri + uç durumlar kapsanır.
"""

import pytest

from agent.agent.tts_normalize import (
    date_to_words,
    decimal_to_words,
    money_to_words,
    normalize_for_tts,
    number_to_turkish_words,
    percent_to_words,
    phone_to_words,
    time_range_to_words,
    time_to_words,
)

# ---------------------------------------------------------------------------
# Şartname dönüşüm tablosu — her satır birebir hedef çıktıyla test edilir.
# ---------------------------------------------------------------------------

SPEC_TABLE: dict[str, str] = {
    "12000 TL": "on iki bin lira",
    "₺30.000": "otuz bin lira",
    "12.000-15.000 TL": "on iki bin ila on beş bin lira arası",
    "72 net": "yetmiş iki net",
    "%85.3": "yüzde seksen beş nokta üç",
    "15/09/2026": "on beş Eylül iki bin yirmi altı",
    "15:30": "on beş otuz",
    "09:00-18:00": "sabah dokuzdan akşam altıya kadar",
    "5x3.000": "beş taksit, her biri üç bin lira",
    "üst %5": "üst yüzde beş",
    "05551234567": "sıfır beş beş beş bir iki üç dört beş altı yedi",
}


@pytest.mark.parametrize("src,expected", sorted(SPEC_TABLE.items()))
def test_spec_table(src: str, expected: str) -> None:
    """Şartname tablosundaki her dönüşüm birebir gerçekleşmelidir."""
    assert normalize_for_tts(src) == expected


def test_score_with_unit() -> None:
    """'325.45 puan' — ondalık kısım hane hane okunur."""
    assert normalize_for_tts("325.45 puan") == (
        "üç yüz yirmi beş nokta dört beş puan"
    )


# ---------------------------------------------------------------------------
# Sayı → yazı dönüştürücü (0-9999+)
# ---------------------------------------------------------------------------

NUMBER_TABLE: dict[int, str] = {
    0: "sıfır",
    7: "yedi",
    10: "on",
    11: "on bir",
    15: "on beş",
    21: "yirmi bir",
    72: "yetmiş iki",
    85: "seksen beş",
    100: "yüz",
    101: "yüz bir",
    110: "yüz on",
    200: "iki yüz",
    325: "üç yüz yirmi beş",
    999: "dokuz yüz doksan dokuz",
    1000: "bin",
    1001: "bin bir",
    21000: "yirmi bir bin",
    30000: "otuz bin",
    100000: "yüz bin",
    120000: "yüz yirmi bin",
    1000000: "bir milyon",
    1250500: "bir milyon iki yüz elli bin beş yüz",
}


@pytest.mark.parametrize("n,expected", sorted(NUMBER_TABLE.items()))
def test_number_to_turkish_words(n: int, expected: str) -> None:
    assert number_to_turkish_words(n) == expected


def test_negative_number() -> None:
    assert number_to_turkish_words(-5) == "eksi beş"


# ---------------------------------------------------------------------------
# Binlik ayraç: nokta ve virgül her ikisi
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "src,expected",
    [
        ("12.000", "on iki bin"),
        ("12,000", "on iki bin"),
        ("1.250.500 aday", "bir milyon iki yüz elli bin beş yüz aday"),
        ("30.000", "otuz bin"),
        ("12000", "on iki bin"),
    ],
)
def test_thousands_separators(src: str, expected: str) -> None:
    assert normalize_for_tts(src) == expected


# ---------------------------------------------------------------------------
# Ondalık ayraç: nokta → 'nokta', virgül → 'virgül'
# ---------------------------------------------------------------------------


def test_decimal_comma() -> None:
    assert normalize_for_tts("85,3") == "seksen beş virgül üç"


def test_decimal_to_words_dot_and_comma() -> None:
    assert decimal_to_words("85.3") == "seksen beş nokta üç"
    assert decimal_to_words("85,3") == "seksen beş virgül üç"


# ---------------------------------------------------------------------------
# Para / kuruş / yüzde
# ---------------------------------------------------------------------------


def test_money_with_kurus() -> None:
    assert normalize_for_tts("1.500,50 TL") == "bin beş yüz lira elli kuruş"


def test_money_to_words_plain() -> None:
    assert money_to_words("30000") == "otuz bin lira"


def test_percent_comma_decimal() -> None:
    assert normalize_for_tts("%85,3") == "yüzde seksen beş virgül üç"


def test_percent_after_number() -> None:
    assert percent_to_words("85") == "yüzde seksen beş"
    assert normalize_for_tts("indirim oranı 20%") == "indirim oranı yüzde yirmi"


def test_sentence_with_money_and_percent() -> None:
    src = "Kurs ücreti 12.000 TL, %10 indirim var."
    expected = "Kurs ücreti on iki bin lira, yüzde on indirim var."
    assert normalize_for_tts(src) == expected


# ---------------------------------------------------------------------------
# Tarih / saat
# ---------------------------------------------------------------------------


def test_date_with_dots() -> None:
    assert normalize_for_tts("15.09.2026") == "on beş Eylül iki bin yirmi altı"


def test_time_with_single_digit_minute() -> None:
    assert normalize_for_tts("09:05") == "dokuz sıfır beş"


def test_time_range_with_minutes() -> None:
    src = "09:30-18:00"
    expected = "sabah dokuz otuzdan akşam altıya kadar"
    assert normalize_for_tts(src) == expected


def test_time_range_noon_to_evening() -> None:
    src = "12:00-17:00"
    expected = "öğlen on ikiden akşam beşe kadar"
    assert normalize_for_tts(src) == expected


def test_time_range_words() -> None:
    assert (
        time_range_to_words(9, 0, 18, 0) == "sabah dokuzdan akşam altıya kadar"
    )
    assert time_range_to_words(10, 0, 15, 0) == "sabah ondan öğlen üçe kadar"


def test_time_words_full_day() -> None:
    assert time_to_words(0, 0) == "sıfır"
    assert time_to_words(9, 0) == "dokuz"
    assert time_to_words(15, 30) == "on beş otuz"
    assert time_to_words(9, 5) == "dokuz sıfır beş"


def test_time_invalid_values_raise() -> None:
    with pytest.raises(ValueError):
        time_to_words(24, 0)
    with pytest.raises(ValueError):
        time_to_words(9, 61)


def test_date_invalid_month_raise_and_passthrough() -> None:
    with pytest.raises(ValueError):
        date_to_words(15, 13, 2026)
    # normalize_for_tts kural tutmayınca metni bozmamalı (ay adı üretilmemeli).
    result = normalize_for_tts("15/13/2026")
    assert "Aralık" not in result


def test_phone_with_country_code_and_spaces() -> None:
    assert normalize_for_tts("+90 555 123 45 67") == (
        "dokuz sıfır beş beş beş bir iki üç dört beş altı yedi"
    )


# ---------------------------------------------------------------------------
# Karışık / koruma senaryoları
# ---------------------------------------------------------------------------


def test_plain_text_unchanged() -> None:
    src = "Merhaba, size nasıl yardımcı olabilirim?"
    assert normalize_for_tts(src) == src


def test_mixed_sentence() -> None:
    src = "15:30'da 12.000 TL taksitle, %20 kapıyı gösterir."
    expected = "on beş otuz'da on iki bin lira taksitle, yüzde yirmi kapıyı gösterir."
    assert normalize_for_tts(src) == expected


def test_installment_with_currency_suffix() -> None:
    assert normalize_for_tts("5x3.000 TL") == "beş taksit, her biri üç bin lira"


def test_empty_input() -> None:
    assert normalize_for_tts("") == ""


def test_phone_to_words_ignores_separators() -> None:
    assert phone_to_words("0555-123-45-67") == (
        "sıfır beş beş beş bir iki üç dört beş altı yedi"
    )
