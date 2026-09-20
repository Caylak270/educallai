/**
 * Supabase REST erişimi (sunucu tarafı, service key).
 * - Bağlı değilse `supabaseLive = false` döner; çağıran taraf mock'a düşer.
 * - Tüm sorgular GET fetch ile; ek bağımlılık (supabase-js) yoktur.
 * - Yalnızca sunucu bileşenlerinden import edin (service key içerir).
 */

const URL = process.env.SUPABASE_URL ?? "";
const KEY =
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseLive = URL.length > 0 && KEY.length > 0;

export async function sbSelect<T>(
  table: string,
  search: string,
): Promise<T[] | null> {
  if (!supabaseLive) return null;
  try {
    const res = await fetch(`${URL}/rest/v1/${table}?${search}`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`supabase ${table}: HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T[];
  } catch (err) {
    console.error(`supabase ${table}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
