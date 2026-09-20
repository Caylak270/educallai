// Pooler üzerinden şema push — bölge otomatik bulunur (SUPABASE_DB_URL env ile)
import pg from "pg";
import { readFileSync } from "node:fs";

const password = process.env.SUPABASE_DB_PASSWORD;
const ref = process.env.SUPABASE_REF;
if (!password || !ref) {
  console.error("SUPABASE_DB_PASSWORD ve SUPABASE_REF gerekli");
  process.exit(1);
}

const REGIONS = [
  "ap-southeast-2", "ap-southeast-5", "ap-northeast-1", "ap-northeast-2",
  "ap-south-2", "eu-central-2", "ca-central-1", "sa-east-1", "us-west-1",
  "us-west-2", "af-south-1", "il-central-1", "ap-east-1",
];

const sql = readFileSync("supabase/apply-all.sql", "utf-8");
let connected = null;

for (const region of REGIONS) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const url = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:5432/postgres`;
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    const who = await client.query("SELECT current_user, inet_server_addr()::text AS addr");
    console.log(`BAĞLANDI: ${region} — user=${who.rows[0].current_user} addr=${who.rows[0].addr}`);
    connected = { client, region };
    break;
  } catch (e) {
    const msg = String(e).slice(0, 90).replace(/\n/g, " ");
    console.log(`  ${region}: ${msg.includes("password") ? "şifre reddi (proje burada değil)" : msg}`);
    try { await client.end(); } catch {}
  }
}

if (!connected) {
  console.error("HİÇBİR BÖLGEDE BAĞLANAMADI");
  process.exit(1);
}

const { client, region } = connected;
try {
  await client.query(sql);
  console.log(`ŞEMA UYGULANDI (${region})`);
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1");
  console.log("TABLOLAR:", tables.rows.map((r) => r.table_name).join(", "));
  const pol = await client.query("SELECT COUNT(*)::int AS n FROM pg_policies WHERE schemaname='public'");
  console.log("RLS POLICY:", pol.rows[0].n);
} catch (e) {
  console.error("ŞEMA HATASI:", String(e).slice(0, 400));
  process.exit(1);
} finally {
  await client.end();
}
