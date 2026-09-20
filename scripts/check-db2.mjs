import pg from "pg";
const url = `postgresql://postgres.${process.env.SUPABASE_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = await c.query(`
  SELECT
    (SELECT COUNT(*)::int FROM dershaneler) dershaneler,
    (SELECT COUNT(*)::int FROM staff) staff,
    (SELECT COUNT(*)::int FROM contacts) contacts,
    (SELECT COUNT(*)::int FROM leads) leads,
    (SELECT COUNT(*)::int FROM installment_tracker) taksit,
    (SELECT COUNT(*)::int FROM exam_results) deneme,
    (SELECT COUNT(*)::int FROM appointments) randevu,
    (SELECT COUNT(*)::int FROM campaigns) kampanya`);
console.log("TABLO DOLULUK:", JSON.stringify(q.rows[0]));
// campaigns insert'ini elle çalıştırıp hatayı gör
try {
  await c.query(`INSERT INTO campaigns (id, dershane_id, name, channel, status, total_targets, contacted, answered, appointments, voice_id, script, working_hours_snapshot, scheduled_at, started_at, completed_at)
    VALUES ('99999999-9999-4999-8999-000000000001','11111111-1111-4111-8111-111111111111','Test Kampanya','voice','running',5,4,2,1,null,null,null,now(),now(),null)`);
  console.log("MANUEL CAMPAIGNS INSERT: OK");
} catch (e) {
  console.log("MANUEL CAMPAIGNS HATA:", String(e).slice(0, 300));
}
await c.end();
