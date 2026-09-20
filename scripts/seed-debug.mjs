import pg from "pg";
import { readFileSync } from "node:fs";

const url = `postgresql://postgres.${process.env.SUPABASE_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

// SQL'i statement'lara böl ($$ gövde ve tırnak içindeki ; korumalı — basit ayrıştırıcı yeterli değil,
// ancak seed dosyasında $$ yok; tırnak içi noktalı virgül için açık bağlam regex'i)
const raw = readFileSync("supabase/seed_demo.sql", "utf-8");
const statements = [];
let cur = "", inStr = false;
for (let i = 0; i < raw.length; i++) {
  const ch = raw[i];
  cur += ch;
  if (ch === "'") {
    if (raw[i + 1] === "'") { cur += "'"; i++; continue; } // kaçışlı apostrof — string devam
    inStr = !inStr;
    continue;
  }
  if (ch === ";" && !inStr) { statements.push(cur.trim()); cur = ""; }
}
if (cur.trim()) statements.push(cur.trim());

for (let i = 0; i < statements.length; i++) {
  // Baştaki yorum satırlarını soyup GERÇEK statement'ı çalıştır (atlama!)
  const st = statements[i]
    .replace(/^[ \t]*--[^\n]*\n+/g, "")
    .trim();
  if (!st) continue;
  const label = st.replace(/\s+/g, " ").slice(0, 70);
  try {
    await client.query(st);
    console.log(`✓ [#${i}] ${label}`);
  } catch (e) {
    console.log(`✗ [#${i}] ${label}`);
    console.log(`  HATA: ${String(e).slice(0, 200)}`);
    console.log("  --- SORUNLU STATEMENT (ilk 600 krk) ---");
    console.log(st.slice(0, 600));
    process.exitCode = 1;
  }
}
await client.end();
