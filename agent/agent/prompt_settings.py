"""Dashboard-canlı ajan promptu — ``agent/agent-prompt.json``.

Ayarlar sayfasındaki "Ajan Promptu" kartı bu dosyayı yazar; ajan her
görüşme başında TAZE okur (restart gerekmez). Yöneticinin tanımladığı
bölümler ``build_prompt_block`` ile Türkçe system prompt bloğuna çevrilir
ve kişisel/kurumsal talimatlar olarak promptun sonuna eklenir.

Şema::

    {
      "assistant_name": "VeliPilot",
      "greeting": "Merhaba iyi günler.",    # çağrı bağlanınca söylenecek ilk cümle
      "tone": "sıcak_profesyonel",          # TONES anahtarlarından biri
      "instructions": "# ROL\\n...",         # serbest talimat (≤ 6000 kr)
      "collect_fields": [                    # görüşmede toplanacak bilgiler
        {"label": "Ad Soyad", "key": "full_name", "required": true}
      ],
      "avoid_rules": [                       # konuşulmayacak konular
        {"keywords": "garanti, kesin sonuç", "response": "..."}
      ],
      "fallback_reply": "...",               # bilgi bulunamadığında çerçeve
      "examples": [{"user": "...", "assistant": "..."}]
    }
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

DEFAULT_PROMPT_PATH = Path(__file__).resolve().parents[1] / "agent-prompt.json"

MAX_INSTRUCTIONS_CHARS = 6000
MAX_FIELDS = 8
MAX_RULES = 8
MAX_EXAMPLES = 5
MAX_TEXT_CHARS = 400

#: Varsayılan kayıt bildirimi (prompts.KVKK_DISCLOSURE_SHORT ile aynı metin;
#: ayrı tanımlı — modüller arası import döngüsü olmasın).
DEFAULT_KVKK_TEXT = (
    "Bu arada söyleyeyim, ben yapay zekayım — konuşmamız eğitim kalitesi "
    "için kayıt altında, tamam mı?"
)

#: Konuşma tonu anahtarı → veliye hitap cümlesi (system prompt'a girer).
TONES: dict[str, str] = {
    "sıcak_profesyonel": "Sıcak ve profesyonel bir üslupla, veliye güven veren bir ton kullan.",
    "enerjik_samimi": "Enerjik ve samimi bir tonla konuş; yine de saygı çerçevesini koru.",
    "sakin_resmi": "Sakin, ölçülü ve resmi bir ton kullan; abartılı ifadelerden kaçın.",
}
DEFAULT_TONE = "sıcak_profesyonel"


@dataclass(frozen=True)
class CollectField:
    label: str
    key: str
    required: bool = False


@dataclass(frozen=True)
class AvoidRule:
    keywords: str
    response: str


@dataclass(frozen=True)
class ExampleDialogue:
    user: str
    assistant: str


@dataclass(frozen=True)
class AgentPrompt:
    assistant_name: str | None = None
    greeting: str | None = None
    tone: str | None = None
    instructions: str | None = None
    collect_fields: list[CollectField] = field(default_factory=list)
    avoid_rules: list[AvoidRule] = field(default_factory=list)
    fallback_reply: str | None = None
    examples: list[ExampleDialogue] = field(default_factory=list)
    #: True/False = yönetici kararı; None = varsayılan (bildirim AÇIK — yasal güvence)
    kvkk_enabled: bool | None = None
    kvkk_text: str | None = None

    def is_empty(self) -> bool:
        return not (
            self.assistant_name
            or self.greeting
            or self.tone
            or self.instructions
            or self.collect_fields
            or self.avoid_rules
            or self.fallback_reply
            or self.examples
            or self.kvkk_enabled is not None
            or self.kvkk_text
        )


def _clean_text(val) -> str:  # type: ignore[no-untyped-def]
    return str(val).strip() if val is not None else ""


def load_agent_prompt(path: Path | str = DEFAULT_PROMPT_PATH) -> AgentPrompt:
    """Prompt tercih dosyasını güvenli oku; bozuk/eksik alanlar sessizce atlanır."""
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return AgentPrompt()
    if not isinstance(data, dict):
        return AgentPrompt()

    tone = _clean_text(data.get("tone"))
    fields: list[CollectField] = []
    for item in (data.get("collect_fields") or [])[:MAX_FIELDS]:
        if not isinstance(item, dict):
            continue
        label = _clean_text(item.get("label"))
        key = _clean_text(item.get("key"))
        if label and key:
            fields.append(
                CollectField(label=label[:80], key=key[:40], required=bool(item.get("required")))
            )
    rules: list[AvoidRule] = []
    for item in (data.get("avoid_rules") or [])[:MAX_RULES]:
        if not isinstance(item, dict):
            continue
        kw = _clean_text(item.get("keywords"))
        resp = _clean_text(item.get("response"))
        if kw and resp:
            rules.append(
                AvoidRule(keywords=kw[:160], response=resp[:MAX_TEXT_CHARS])
            )
    examples: list[ExampleDialogue] = []
    for item in (data.get("examples") or [])[:MAX_EXAMPLES]:
        if not isinstance(item, dict):
            continue
        user = _clean_text(item.get("user"))
        assistant = _clean_text(item.get("assistant"))
        if user and assistant:
            examples.append(
                ExampleDialogue(
                    user=user[:200], assistant=assistant[:MAX_TEXT_CHARS]
                )
            )

    return AgentPrompt(
        assistant_name=_clean_text(data.get("assistant_name"))[:60] or None,
        greeting=_clean_text(data.get("greeting"))[:200] or None,
        tone=tone if tone in TONES else None,
        instructions=_clean_text(data.get("instructions"))[:MAX_INSTRUCTIONS_CHARS] or None,
        collect_fields=fields,
        avoid_rules=rules,
        fallback_reply=_clean_text(data.get("fallback_reply"))[:MAX_TEXT_CHARS] or None,
        examples=examples,
        kvkk_enabled=(
            bool(data["kvkk_enabled"]) if isinstance(data.get("kvkk_enabled"), bool) else None
        ),
        kvkk_text=_clean_text(data.get("kvkk_text"))[:MAX_TEXT_CHARS] or None,
    )


def build_mandatory_rules(
    allowed_text: str,
    kvkk_enabled: bool | None = True,
    kvkk_text: str | None = None,
) -> str:
    """Değiştirilemez sistem kuralları bloğu — TALİMAT GİRİLMİŞ (tam denetim)
    modunda yönetici bloğunun sonuna eklenir.

    Args:
        allowed_text: İzinli araç listesi metni (virgülle).
        kvkk_enabled: None/True = standart kayıt bildirimi; False = bildirim YOK
            (yönetici açıkça kapatmış); kvkk_text verilirse onu kullanır.
        kvkk_text: Yöneticinin özel kayıt bildirimi metni.
    """
    use_default = kvkk_enabled is not False
    custom_text = (kvkk_text or "").strip()
    if custom_text:
        kvkk_line = (
            f'1. Kayıt bildirimi: selamlaşmadan hemen sonra şu cümleyi doğal biçimde '
            f'söyle: "{custom_text}"'
        )
    elif use_default:
        kvkk_line = (
            '1. KVKK bildirimi: selamlaşmadan hemen sonra şu cümleyi doğal biçimde söyle:\n'
            '   "' + DEFAULT_KVKK_TEXT + '"'
        )
    else:
        kvkk_line = (
            "1. Kayıt bildirimi YAPMA — veliye \"kayıt altındasınız\", \"KVKK\" gibi "
            "ifadeler söyleme; doğrudan selamla ve konuya gir."
        )
    return f"""\
# ZORUNLU SİSTEM KURALLARI (DEĞİŞTİRİLEMEZ)
{kvkk_line}
2. İzinli araçların: {allowed_text}. Bir araç soruya uyuyorsa cevabı MUTLAKA
   aracı çağırarak ver; listede olmayan bir işlemi yapamazsın ve yapmış gibi
   davranamazsın — gerekirse insana aktarım öner.
3. Görüşme boyunca en az bir kez `record_signals` aracıyla velinin duygu,
   niyet ve kayda hazırlık sinyallerini kaydet.
4. Kısaltmaları seslendirirken Türkçe harf adlarıyla oku: TYT→"te ye te",
   AYT→"a ye te", YKS→"ye ke se", LGS→"le ge se"; educallai→"Edukallay".
5. Yetkin olmayan indirim, taviz veya sonuç vaadi ASLA verme."""


def build_prompt_block(prompt: AgentPrompt) -> str | None:
    """Yönetici tercihlerini tek Türkçe system prompt bloğuna çevirir.

    Boş tercihte ``None`` döner — prompt'a hiçbir şey eklenmez.
    """
    if prompt.is_empty():
        return None

    lines: list[str] = ["# KURUMA ÖZEL TALİMATLAR (YÖNETİCİ TARAFINDAN TANIMLANDI)"]

    if prompt.assistant_name:
        lines.append(f"Kimlik adın: **{prompt.assistant_name}**.")
    if prompt.greeting:
        lines.append(
            f"AÇILIŞ CÜMLEN: \"{prompt.greeting}\" — çağrı bağlandığında İLK bu cümleyi "
            "söyle; aşağıdaki genel açılış kuralını bu tercih geçersiz kılar."
        )
    if prompt.tone:
        lines.append(TONES.get(prompt.tone, TONES[DEFAULT_TONE]))
    if prompt.instructions:
        lines.append(prompt.instructions.strip())

    if prompt.collect_fields:
        lines.append("\n# GÖRÜŞMEDE TOPLANACAK BİLGİLER")
        lines.append(
            "Doğal akışın içinde öğrenmeye çalış — hepsini tek seferde sorma, "
            "veli rahatsız olursa üsteleme yapma ve öğrendiklerini `record_signals` "
            "ile kaydet:"
        )
        for f in prompt.collect_fields:
            zor = " (ZORUNLU — alamazsan görüşme sonuna dek nazikçe bir kez daha dene)" if f.required else ""
            lines.append(f"- {f.label} [{f.key}]{zor}")

    if prompt.avoid_rules:
        lines.append("\n# KONUŞULMAYACAK KONULAR")
        lines.append(
            "Şu tetikleyicileri duyduğunda hazırlanmış yanıtı SÖYLE, tartışmaya girme "
            "ve konuyu kurum konusuna (program, fiyat, randevu) nazikçe döndür:"
        )
        for r in prompt.avoid_rules:
            lines.append(f'- Tetikleyici: "{r.keywords}" → Yanıt: "{r.response}"')

    if prompt.fallback_reply:
        lines.append("\n# BİLGİ BULUNAMADIĞINDA")
        lines.append(
            f"Bilgi tabanında olmayan sorularda şu çerçeveyi temel al: "
            f"\"{prompt.fallback_reply}\" — gerekirse kendi cümlelerinle yumuşat."
        )

    if prompt.examples:
        lines.append("\n# ÖRNEK DİYALOGLAR (TON REFERANSI — kelimesi kelimesine kullanma)")
        for e in prompt.examples:
            lines.append(f'VELİ: "{e.user}"\nSEN: "{e.assistant}"\n')

    return "\n".join(lines).strip()
