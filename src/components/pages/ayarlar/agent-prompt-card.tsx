"use client";

import { useCallback, useEffect, useState } from "react";
import { CardHeader } from "./card-header";
import { clsx } from "@/lib/clsx";

type VoiceTestLike = { showToast: (message: string) => void };

interface CollectField {
  label: string;
  key: string;
  required: boolean;
}
interface AvoidRule {
  keywords: string;
  response: string;
}
interface Example {
  user: string;
  assistant: string;
}

interface PromptPayload {
  assistant_name?: string | null;
  greeting?: string | null;
  tone?: string | null;
  instructions?: string | null;
  collect_fields?: CollectField[];
  avoid_rules?: AvoidRule[];
  fallback_reply?: string | null;
  examples?: Example[];
  kvkk_enabled?: boolean | null;
  kvkk_text?: string | null;
}

const TONE_OPTIONS = [
  { value: "sıcak_profesyonel", label: "Sıcak & Profesyonel" },
  { value: "enerjik_samimi", label: "Enerjik & Samimi" },
  { value: "sakin_resmi", label: "Sakin & Resmi" },
] as const;

const inputClass =
  "w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30";
const sectionTitleClass =
  "font-title-sm text-title-sm font-semibold text-on-surface";
const sectionDescClass = "font-body-sm text-body-sm text-on-surface-variant";
const labelClass = "font-label-md text-label-md font-medium text-on-surface-variant";
const delBtnClass =
  "shrink-0 rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container";
const addBtnClass =
  "flex items-center gap-1 font-label-md text-label-md font-semibold text-primary transition-colors hover:text-tertiary";

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-outline-variant/40 pt-4 first:border-t-0 first:pt-0">
      <div>
        <p className={sectionTitleClass}>{title}</p>
        <p className={sectionDescClass}>{desc}</p>
      </div>
      {children}
    </div>
  );
}

/** Ajan Promptu kartı — agent-prompt.json'a yazar; ajan her görüşmede
 *  taze okuyup system prompt'unun sonuna "KURUMA ÖZEL TALİMATLAR" bloğu
 *  olarak ekler. Persona ve güvenlik kuralları karttan bağımsız korunur. */
export function AgentPromptCard({ showToast }: VoiceTestLike) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [name, setName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [tone, setTone] = useState<string>("sıcak_profesyonel");
  const [instructions, setInstructions] = useState("");
  const [fields, setFields] = useState<CollectField[]>([]);
  const [rules, setRules] = useState<AvoidRule[]>([]);
  const [fallback, setFallback] = useState("");
  const [examples, setExamples] = useState<Example[]>([]);
  const [kvkkOn, setKvkkOn] = useState(true);
  const [kvkkText, setKvkkText] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/agent-prompt", { cache: "no-store" });
        const data = (await res.json()) as { prompt: Partial<PromptPayload> };
        if (!alive) return;
        const p = data.prompt ?? {};
        setName(p.assistant_name ?? "");
        setGreeting(p.greeting ?? "");
        setTone(p.tone ?? "sıcak_profesyonel");
        setInstructions(p.instructions ?? "");
        setFields(p.collect_fields ?? []);
        setRules(p.avoid_rules ?? []);
        setFallback(p.fallback_reply ?? "");
        setExamples(p.examples ?? []);
        setKvkkOn(p.kvkk_enabled !== false); // null/true → açık (yasal varsayılan)
        setKvkkText(p.kvkk_text ?? "");
      } catch {
        // dosya yoksa varsayılan boş form
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleApply = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/agent-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistant_name: name || null,
          greeting: greeting || null,
          tone,
          instructions: instructions || null,
          collect_fields: fields,
          avoid_rules: rules,
          fallback_reply: fallback || null,
          examples,
          kvkk_enabled: kvkkOn,
          kvkk_text: kvkkOn ? kvkkText || null : null,
        }),
      });
      if (!res.ok) {
        showToast("Prompt kaydedilemedi — tekrar deneyin.");
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 4000);
      showToast("Ajan promptu kaydedildi — bir sonraki görüşmede geçerli.");
    } catch {
      showToast("Prompt kaydedilemedi — bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }, [name, greeting, tone, instructions, fields, rules, fallback, examples, kvkkOn, kvkkText, showToast]);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
      <CardHeader
        icon="edit_note"
        className="pb-space-xs"
        title="Ajan Promptu"
        description="Ajanın kimliği, konuşma tarzı ve özel kuralları — kaydettiğinde bir sonraki görüşmede geçerli."
        right={
          <span className="inline-flex items-center gap-1 rounded-lg bg-secondary-container/40 px-space-sm py-space-xs font-label-sm text-label-sm font-medium text-on-secondary-container">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
            Canlı Ajan
          </span>
        }
      />

      {loading ? (
        <p className="py-6 text-center font-body-md text-body-md text-on-surface-variant">
          Yükleniyor…
        </p>
      ) : (
        <>
          {/* Kimlik */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Asistan adı</span>
              <input
                className={inputClass}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder="VeliPilot"
                type="text"
                value={name}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Konuşma tonu</span>
              <select
                className={inputClass}
                onChange={(e) => setTone(e.target.value)}
                value={tone}
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>İlk Karşılama Mesajı</span>
            <input
              className={inputClass}
              maxLength={200}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Merhaba iyi günler."
              type="text"
              value={greeting}
            />
            <span className="font-body-sm text-body-sm text-[11px] text-on-surface-variant">
              Çağrı bağlandığında asistanın söyleyeceği ilk cümle. Boş bırakılırsa
              varsayılan açılış kullanılır.
            </span>
          </label>

          <Section
            desc="Bu alanı doldurduğunuzda ajan yerleşik davranışını BIRAKIR ve sizin talimatlarınıza göre konuşur (yalnızca KVKK, yetki ve kayıt kuralları korunur). Boş bırakırsanız yerleşik danışman kişiliği kullanılır."
            title="Asistan Talimatları"
          >
            <textarea
              className={clsx(inputClass, "min-h-36 font-mono text-[13px] leading-relaxed")}
              maxLength={4000}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={"# ROL\nSen {dershane} öğrenci kayıt asistanısın. Velileri ziyaret randevusuna hazırlarsın.\n\n# ÖNEMLİ KURALLAR\n- Önce velinin hedefini sor\n- Telefon bilgisini konuşmanın sonunda al"}
              value={instructions}
            />
            <p className="text-right font-body-sm text-body-sm text-[11px] text-on-surface-variant">
              {instructions.length} / 4000
            </p>
          </Section>

          {/* Toplanacak bilgiler */}
          <Section
            desc="Ajanın görüşme sırasında doğal akışta toplamaya çalışacağı bilgiler."
            title="Veri Toplama Alanları"
          >
            {fields.map((f, i) => (
              <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-2.5 sm:flex-row sm:items-center" key={i}>
                <input
                  aria-label="Alan etiketi"
                  className={clsx(inputClass, "sm:flex-1")}
                  maxLength={80}
                  onChange={(e) =>
                    setFields(fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                  }
                  placeholder="Etiket (ör. Ad Soyad)"
                  type="text"
                  value={f.label}
                />
                <input
                  aria-label="Alan anahtarı"
                  className={clsx(inputClass, "sm:w-40")}
                  maxLength={40}
                  onChange={(e) =>
                    setFields(fields.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                  }
                  placeholder="anahtar"
                  type="text"
                  value={f.key}
                />
                <label className="flex shrink-0 items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
                  <input
                    checked={f.required}
                    className="accent-primary"
                    onChange={(e) =>
                      setFields(
                        fields.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x))
                      )
                    }
                    type="checkbox"
                  />
                  Zorunlu
                </label>
                <button
                  aria-label="Alanı sil"
                  className={delBtnClass}
                  onClick={() => setFields(fields.filter((_, j) => j !== i))}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
            {fields.length < 8 ? (
              <button
                className={addBtnClass}
                onClick={() =>
                  setFields([...fields, { label: "", key: "", required: false }])
                }
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Alan Ekle ({fields.length}/8)
              </button>
            ) : null}
          </Section>

          {/* Kaçınma kuralları */}
          <Section
            desc="Bu kelimeler duyulduğunda ajan hazırlanmış yanıtı söyler, konuyu tartışmaz."
            title="Konuşulmaması Gereken Konular"
          >
            {rules.map((r, i) => (
              <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-2.5" key={i}>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Tetikleyen kelimeler"
                    className={clsx(inputClass, "flex-1")}
                    maxLength={160}
                    onChange={(e) =>
                      setRules(rules.map((x, j) => (j === i ? { ...x, keywords: e.target.value } : x)))
                    }
                    placeholder="Tetikleyen kelimeler (virgülle ayrı)"
                    type="text"
                    value={r.keywords}
                  />
                  <button
                    aria-label="Kuralı sil"
                    className={delBtnClass}
                    onClick={() => setRules(rules.filter((_, j) => j !== i))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <input
                  aria-label="Verilecek yanıt"
                  className={inputClass}
                  maxLength={400}
                  onChange={(e) =>
                    setRules(rules.map((x, j) => (j === i ? { ...x, response: e.target.value } : x)))
                  }
                  placeholder="Verilecek yanıt"
                  type="text"
                  value={r.response}
                />
              </div>
            ))}
            {rules.length < 8 ? (
              <button
                className={addBtnClass}
                onClick={() => setRules([...rules, { keywords: "", response: "" }])}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Kural Ekle ({rules.length}/8)
              </button>
            ) : null}
          </Section>

          {/* Kayıt bildirimi (KVKK) */}
          <Section
            desc="Ajan, selamlaşmadan hemen sonra görüşmenin kayıt altında olduğunu bildirir. Yasal güvence için AÇIK tutulması önerilir; kapatırsanız ajan hiçbir kayıt bildirimi yapmaz."
            title="Kayıt Bildirimi (KVKK)"
          >
            <label className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
              <input
                checked={kvkkOn}
                className="accent-primary"
                onChange={(e) => setKvkkOn(e.target.checked)}
                type="checkbox"
              />
              Ajan kayıt bildirimi yapsın
            </label>
            {kvkkOn ? (
              <input
                className={inputClass}
                maxLength={400}
                onChange={(e) => setKvkkText(e.target.value)}
                placeholder="Bu arada söyleyeyim, ben yapay zekayım — konuşmamız eğitim kalitesi için kayıt altında, tamam mı?"
                type="text"
                value={kvkkText}
              />
            ) : null}
          </Section>

          {/* Bilgi yok yanıtı */}
          <Section
            desc="Bilgi tabanında karşılık bulunmayan sorularda ajanın kullanacağı çerçeve."
            title="Bilgi Bulunamadığında Yanıt"
          >
            <input
              className={inputClass}
              maxLength={400}
              onChange={(e) => setFallback(e.target.value)}
              placeholder="Bu konuda en doğru bilgiyi uzmanımız verebilir. Danışmanımızı bağlayayım mı?"
              type="text"
              value={fallback}
            />
          </Section>

          {/* Örnek diyaloglar */}
          <Section
            desc="Ajanın tonunu referans alacağı ideal konuşma örnekleri (en fazla 5)."
            title="Örnek Diyaloglar"
          >
            {examples.map((e, i) => (
              <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-2.5" key={i}>
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 font-label-md text-label-md font-semibold text-primary">
                    Veli
                  </span>
                  <input
                    aria-label="Veli örneği"
                    className={inputClass}
                    maxLength={200}
                    onChange={(ev) =>
                      setExamples(
                        examples.map((x, j) => (j === i ? { ...x, user: ev.target.value } : x))
                      )
                    }
                    placeholder="Fiyatlarınız ne kadar?"
                    type="text"
                    value={e.user}
                  />
                  <button
                    aria-label="Örneği sil"
                    className={delBtnClass}
                    onClick={() => setExamples(examples.filter((_, j) => j !== i))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 font-label-md text-label-md font-semibold text-secondary">
                    Ajan
                  </span>
                  <input
                    aria-label="Ajan örneği"
                    className={inputClass}
                    maxLength={400}
                    onChange={(ev) =>
                      setExamples(
                        examples.map((x, j) => (j === i ? { ...x, assistant: ev.target.value } : x))
                      )
                    }
                    placeholder="Hangi programla ilgileniyorsunuz?"
                    type="text"
                    value={e.assistant}
                  />
                </div>
              </div>
            ))}
            {examples.length < 5 ? (
              <button
                className={addBtnClass}
                onClick={() => setExamples([...examples, { user: "", assistant: "" }])}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Örnek Ekle ({examples.length}/5)
              </button>
            ) : null}
          </Section>

          {/* Uygula */}
          <button
            className="mt-space-xs flex items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-lg py-space-sm font-title-sm text-title-sm font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98] disabled:opacity-50"
            disabled={loading || saving}
            onClick={() => void handleApply()}
            type="button"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {savedFlash ? "check_circle" : "save"}
            </span>
            <span>{saving ? "Uygulanıyor…" : savedFlash ? "Uygulandı" : "Promptu Ajan'a Uygula"}</span>
          </button>
          <p className="text-center font-body-sm text-body-sm text-[11px] text-on-surface-variant">
            Prompt ajan dosyasına yazılır ve <strong>bir sonraki görüşmede</strong>{" "}
            otomatik geçerli olur. Persona, KVKK ve yetki kuralları karttan bağımsız korunur.
          </p>
        </>
      )}
    </section>
  );
}
