// 0003_product_modules.sql → canlı Supabase (pooler, bölge otomatik)
import pg from "pg";
import { readFileSync } from "node:fs";

const password = process.env.SUPABASE_DB_PASSWORD;
const ref = process.env.SUPABASE_REF;
if (!password || !ref) {
  console.error("SUPABASE_DB_PASSWORD ve SUPABASE_REF gerekli (.env.local)");
  process.exit(1);
}

const REGIONS = [
  "ap-southeast-2", "ap-southeast-5", "ap-northeast-1", "ap-northeast-2",
  "ap-south-2", "eu-central-2", "ca-central-1", "sa-east-1", "us-west-1",
  "us-west-2", "af-south-1", "il-central-1", "ap-east-1",
];

const sql = readFileSync("supabase/migrations/0003_product_modules.sql", "utf-8");
let connected = null;

for (const region of REGIONS) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const url = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:5432/postgres`;
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    connected = { client, region };
    break;
  } catch {
    try { await client.end(); } catch {}
  }
}
if (!connected) { console.error("BAĞLANAMADI"); process.exit(1); }
console.log("bağlandı:", connected.region);

await connected.client.query(sql);
console.log("0003 uygulandı");

const { rows } = await connected.client.query(
  "select table_name from information_schema.tables where table_schema='public' and table_name in ('counselor_notes','exam_schedule')"
);
console.log("tablolar:", rows.map(r => r.table_name).join(", "));
const pol = await connected.client.query("select policyname from pg_policies where tablename in ('counselor_notes','exam_schedule')");
console.log("policyler:", pol.rows.map(r => r.policyname).join(", "));
await connected.client.end();
