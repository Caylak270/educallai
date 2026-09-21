import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * GET/POST /api/agent-prompt — sesli ajanın yönetici tanımlı prompt tercihleri.
 * Dosya: agent/agent-prompt.json. Ajan bu dosyayı HER GÖRÜŞME BAŞINDA taze
 * okur ve system prompt'unun sonuna "KURUMA ÖZEL TALİMATLAR" bloğu olarak ekler.
 */

const PROMPT_PATH = path.join(process.cwd(), "agent", "agent-prompt.json");

const TONES = ["sıcak_profesyonel", "enerjik_samimi", "sakin_resmi"] as const;
const MAX = {
  name: 60,
  instructions: 4000,
  fields: 8,
  rules: 8,
  examples: 5,
  text: 400,
} as const;

type Field = { label: string; key: string; required: boolean };
type Rule = { keywords: string; response: string };
type Example = { user: string; assistant: string };
type PromptPayload = {
  assistant_name: string | null;
  tone: (typeof TONES)[number] | null;
  instructions: string | null;
  collect_fields: Field[];
  avoid_rules: Rule[];
  fallback_reply: string | null;
  examples: Example[];
};

function clampText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length > 0 ? t : null;
}

function arr(v: unknown, max: number): Record<string, unknown>[] {
  return Array.isArray(v) ? (v.slice(0, max) as Record<string, unknown>[]) : [];
}

function sanitize(body: Record<string, unknown>): PromptPayload {
  const tone = TONES.includes(body.tone as (typeof TONES)[number])
    ? (body.tone as PromptPayload["tone"])
    : null;

  const collect_fields: Field[] = [];
  for (const item of arr(body.collect_fields, MAX.fields)) {
    const label = clampText(item.label, 80);
    const key = clampText(item.key, 40);
    if (label && key) {
      collect_fields.push({ label, key: key.replace(/\s+/g, "_"), required: Boolean(item.required) });
    }
  }
  const avoid_rules: Rule[] = [];
  for (const item of arr(body.avoid_rules, MAX.rules)) {
    const keywords = clampText(item.keywords, 160);
    const response = clampText(item.response, MAX.text);
    if (keywords && response) avoid_rules.push({ keywords, response });
  }
  const examples: Example[] = [];
  for (const item of arr(body.examples, MAX.examples)) {
    const user = clampText(item.user, 200);
    const assistant = clampText(item.assistant, MAX.text);
    if (user && assistant) examples.push({ user, assistant });
  }

  return {
    assistant_name: clampText(body.assistant_name, MAX.name),
    tone,
    instructions: clampText(body.instructions, MAX.instructions),
    collect_fields,
    avoid_rules,
    fallback_reply: clampText(body.fallback_reply, MAX.text),
    examples,
  };
}

async function readSettings(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(PROMPT_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export async function GET() {
  const raw = await readSettings();
  return NextResponse.json({
    prompt: sanitize(raw),
    defaults: Object.keys(raw).length === 0,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const clean = sanitize(body);
  try {
    await mkdir(path.dirname(PROMPT_PATH), { recursive: true });
    await writeFile(PROMPT_PATH, JSON.stringify(clean, null, 2), "utf-8");
  } catch (err) {
    return NextResponse.json(
      {
        error: "Prompt dosyasına yazılamadı",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    prompt: clean,
    note: "Prompt bir sonraki görüşmede otomatik geçerli olur.",
  });
}
