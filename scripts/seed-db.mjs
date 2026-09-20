// Demo veri + ses yapılandırması (SUPABASE_DB_PASSWORD + SUPABASE_REF env ile)
import pg from "pg";
import { readFileSync } from "node:fs";

const password = process.env.SUPABASE_DB_PASSWORD;
const ref = process.env.SUPABASE_REF;
const region = process.env.SUPABASE_REGION || "ap-northeast-1";
const url = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("BAĞLANTI OK");
  await client.query(readFileSync("supabase/seed_demo.sql", "utf-8"));
  console.log("DEMO VERİ: yüklendi");
  const counts = await client.query(
    "SELECT (SELECT COUNT(*) FROM contacts) contacts, (SELECT COUNT(*) FROM leads) leads, (SELECT COUNT(*) FROM installment_tracker) taksit, (SELECT COUNT(*) FROM exam_results) deneme, (SELECT COUNT(*) FROM appointments) randevu, (SELECT COUNT(*) FROM campaigns) kampanya"
  );
  console.log("SATIRLAR:", JSON.stringify(counts.rows[0]));

  // Cartesia ses kimliklerini kurum yapılandırmasına yaz
  await client.query(
    `UPDATE dershaneler SET voice_config = $1::jsonb WHERE name = 'Limit Dershane'`,
    [JSON.stringify({
      provider: "cartesia",
      model: "sonic-3",
      language: "tr",
      voice_female: process.env.CARTESIA_VOICE_FEMALE,
      voice_male: process.env.CARTESIA_VOICE_MALE,
      speed: 1.0,
    })]
  );
  const vc = await client.query("SELECT name, voice_config FROM dershaneler");
  console.log("SES YAPILANDIRMASI:", JSON.stringify(vc.rows[0].voice_config));
} catch (e) {
  console.error("HATA:", String(e).slice(0, 400));
  process.exit(1);
} finally {
  await client.end();
}
