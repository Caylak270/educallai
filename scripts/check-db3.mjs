import pg from "pg";
const url = `postgresql://postgres.${process.env.SUPABASE_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const t = await c.query(`
  SELECT
    (SELECT COUNT(*)::int FROM dershaneler) ders,
    (SELECT COUNT(*)::int FROM staff) staff,
    (SELECT COUNT(*)::int FROM contacts) contacts,
    (SELECT COUNT(*)::int FROM leads) leads,
    (SELECT COUNT(*)::int FROM conversation_signals) signals,
    (SELECT COUNT(*)::int FROM installment_tracker) taksit,
    (SELECT COUNT(*)::int FROM exam_results) deneme,
    (SELECT COUNT(*)::int FROM appointments) randevu,
    (SELECT COUNT(*)::int FROM campaigns) kampanya`);
console.log("DOLULUK:", JSON.stringify(t.rows[0]));
const ids = await c.query("SELECT id FROM contacts ORDER BY id LIMIT 10");
console.log("CONTACT IDS:", ids.rows.map(r => r.id.slice(0,8)).join(","));
const lids = await c.query("SELECT id FROM leads ORDER BY id LIMIT 10");
console.log("LEAD IDS:", lids.rows.map(r => r.id.slice(0,8)).join(","));
await c.end();
