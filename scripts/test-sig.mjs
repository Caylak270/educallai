import pg from "pg";
import { readFileSync } from "node:fs";
const url = `postgresql://postgres.${process.env.SUPABASE_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
await c.query("select set_config('app.current_dershane','11111111-1111-4111-8111-111111111111',false)");
try {
  await c.query(readFileSync("/tmp/sig-test.sql", "utf-8"));
  console.log("ISOLATED INSERT: OK");
} catch (e) {
  console.log("ISOLATED HATA:", String(e).slice(0, 300));
}
await c.end();
