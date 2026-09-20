// Tek seferlik şema push aracı — SUPABASE_DB_URL env ile çalıştır (commit etme)
import pg from "pg";
import { readFileSync } from "node:fs";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL gerekli");
  process.exit(1);
}
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("BAĞLANTI: OK");
  const sql = readFileSync("supabase/apply-all.sql", "utf-8");
  await client.query(sql);
  console.log("ŞEMA: uygulandı (0001 + 0002)");
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"
  );
  console.log("TABLOLAR:", tables.rows.map((r) => r.table_name).join(", "));
  const policies = await client.query("SELECT COUNT(*)::int AS n FROM pg_policies WHERE schemaname='public'");
  console.log("RLS POLICY SAYISI:", policies.rows[0].n);
} catch (e) {
  console.error("HATA:", String(e).slice(0, 500));
  process.exit(1);
} finally {
  await client.end();
}
