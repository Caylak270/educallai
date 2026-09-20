import pg from "pg";
const url = `postgresql://postgres.${process.env.SUPABASE_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
await c.query(
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
const vc = await c.query("SELECT name, voice_config FROM dershaneler");
console.log("DERSHANE:", vc.rows[0].name, "| SES:", JSON.stringify(vc.rows[0].voice_config));
await c.end();
