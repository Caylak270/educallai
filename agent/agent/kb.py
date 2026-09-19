"""Pattern 7 — KB Prefetch iskeleti (bilgi tabanı ön-çekme).

Amaç: Kullanıcı hâlâ konuşurken (STT **interim** transcript aşamasında)
olası soru için bilgi tabanında (KB) arama başlatmak ve LLM turuna
sonuç hazır şekilde gelmesini sağlamak — uçtan uca gecikme bütçesini
korumak için (hedef <600 ms).

Şema:
1. Interim transcript yeteri uzunlukta → debounce (0.3 sn) bekle.
2. ``embed(text)`` ile vektörleştir (canlıda embedding sağlayıcısı).
3. ``search_kb_pgvector`` ile en yakın k kaydı çek (Supabase pgvector).
4. Sonuç pipeline'daki LLM çağrısına bağlam olarak eklenir.

Bu iskelet, embedding ve pgvector sağlayıcıları **arayüz olarak** tutar;
canlıya çıkışta gerçek sağlayıcılar bağlanır. Kütüphane bağımlılığı yok.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Awaitable, Callable, Protocol, Sequence

#: Prefetch'in tetiklenmesi için interim metnin minimum uzunluğu.
DEFAULT_MIN_CHARS: int = 12
#: Interim durağanlaşması için beklenecek süre (sn).
DEFAULT_DEBOUNCE_S: float = 0.3
#: Çekilecek varsayılan kayıt sayısı.
DEFAULT_TOP_K: int = 3


@dataclass(frozen=True)
class KBSearchResult:
    """Bilgi tabanı arama sonucu."""

    #: Kaynağın kimliği (ör. belge/sayfa slug'ı).
    source: str
    #: Kayıt metni (LLM bağlamına giden parça).
    content: str
    #: Benzerlik skoru (0-1; sağlayıcıya bağlı olarak cosine benzerliği).
    score: float


class EmbedFn(Protocol):
    """Embedding arayüzü: metin → vektör (asenkron)."""

    def __call__(self, text: str) -> Awaitable[list[float]]:
        ...  # pragma: no cover - Protocol gövdesi


async def embed(text: str) -> list[float]:
    """Varsayılan embedding arayüzü — stub.

    Canlıda Supabase entegrasyonu üzerinden gerçek embedding sağlayıcısı
    (ör. OpenAI ``text-embedding-3-small``) bağlanır. Bu stub çağrılırsa
    ``NotImplementedError`` fırlatır; pipeline bunu sessizce yutarak
    KB'siz çalışmaya devam eder.
    """
    raise NotImplementedError(
        "Embedding sağlayıcısı bağlı değil — canlıya çıkışta "
        "kb.embed üzerine gerçek sağlayıcı takılmalı (bkz. README)."
    )


async def search_kb_pgvector(
    query_vector: Sequence[float], top_k: int = DEFAULT_TOP_K
) -> list[KBSearchResult]:
    """pgvector yakın-arama stub'u.

    Canlıdaki karşılığı (Supabase pgvector)::

        SELECT source, content, 1 - (embedding <=> $1) AS score
        FROM dershane_kb
        WHERE dershane_id = $3
        ORDER BY embedding <=> $1
        LIMIT $2;

    Bu stub çağrılırsa ``NotImplementedError`` fırlatır.
    """
    raise NotImplementedError(
        "pgvector arama bağlı değil — canlıda search_kb_pgvector üzerine "
        "Supabase RPC/SQL katmanı takılmalı."
    )


async def prefetch_from_interim(
    interim_transcript: str,
    *,
    min_chars: int = DEFAULT_MIN_CHARS,
    debounce_s: float = DEFAULT_DEBOUNCE_S,
    embed_fn: Callable[[str], Awaitable[list[float]]] = embed,
    search_fn: Callable[..., Awaitable[list[KBSearchResult]]] = search_kb_pgvector,
) -> list[KBSearchResult] | None:
    """Interim transcript'ten KB ön-çekme görevi (asyncio şeması).

    Akış: uzunluk eşiği → debounce bekleme → embed → arama. Debounce
    sırasında görev iptal edilirse (yeni interim geldi) hiçbir servis
    çağrısı yapılmamış olur — gereksiz embedding maliyetini önler.

    Args:
        interim_transcript: STT'nin henüz tamamlanmamış metni.
        min_chars: Tetikleme için minimum karakter sayısı.
        debounce_s: Interim durağanlaşma bekleme süresi.
        embed_fn: Testlerde takılabilen embedding fonksiyonu.
        search_fn: Testlerde takılabilen arama fonksiyonu.

    Returns:
        Arama sonuçları; eşik altı metinde ``None``.
    """
    if len((interim_transcript or "").strip()) < min_chars:
        return None
    await asyncio.sleep(debounce_s)
    vector = await embed_fn(interim_transcript)
    return await search_fn(vector, DEFAULT_TOP_K)


class KBPrefetchHook:
    """Pipeline'a takılan prefetch kancası (Pattern 7 hook'u).

    Her yeni interim transcript için önceki görevi iptal eder ve yenisini
    başlatır; böylece aynı konuşma turu için gereksiz aramalar birikmez.
    """

    def __init__(
        self,
        embed_fn: Callable[[str], Awaitable[list[float]]] = embed,
        search_fn: Callable[..., Awaitable[list[KBSearchResult]]] = search_kb_pgvector,
    ) -> None:
        self._embed_fn = embed_fn
        self._search_fn = search_fn
        self._task: asyncio.Task[list[KBSearchResult] | None] | None = None
        self._last_result: list[KBSearchResult] | None = None

    def schedule(self, interim_transcript: str) -> "asyncio.Task[list[KBSearchResult] | None] | None":
        """Yeni interim için prefetch görevi başlatır (öncekini iptal eder).

        Olay döngüsü (event loop) yoksa ``None`` döndürür — canlı oturum
        dışında (ör. test/saf kullanım) güvenli çağrı.
        """
        self.cancel()
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return None
        self._task = loop.create_task(
            prefetch_from_interim(
                interim_transcript,
                embed_fn=self._embed_fn,
                search_fn=self._search_fn,
            )
        )
        return self._task

    def cancel(self) -> None:
        """Devam eden prefetch görevini iptal eder (varsa)."""
        if self._task is not None and not self._task.done():
            self._task.cancel()
        self._task = None

    async def latest(self) -> list[KBSearchResult] | None:
        """Son tamamlanan prefetch sonucunu bekleyip döndürür (varsa)."""
        if self._task is None:
            return self._last_result
        try:
            self._last_result = await self._task
        except (asyncio.CancelledError, NotImplementedError):
            # Sağlayıcı bağlı değil ya da yeni interim geldi → sessiz geç.
            if self._task.cancelled():
                raise
        finally:
            self._task = None
        return self._last_result

    @property
    def result(self) -> list[KBSearchResult] | None:
        """Zaten tamamlanmış son sonuç (beklemeden)."""
        return self._last_result
