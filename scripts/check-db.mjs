import pg from "pg";
const url = `postgresql://postgres.${process.env.SUPABASE_REF}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const camp = await c.query("SELECT id, name FROM campaigns");
console.log("CAMPAIGNS:", JSON.stringify(camp.rows));
const cnt = await c.query("SELECT COUNT(*)::int n FROM campaign_targets");
console.log("TARGET COUNT:", cnt.rows[0].n);
await c.end();
