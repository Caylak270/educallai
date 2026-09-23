/**
 * Supabase REST erişimi (sunucu tarafı, service key).
 * - Bağlı değilse `supabaseLive = false` döner; çağıran taraf mock'a düşer.
 * - Tüm sorgular GET fetch ile; ek bağımlılık (supabase-js) yoktur.
 * - Yalnızca sunucu bileşenlerinden import edin (service key içerir).
 * - Sağlamlık: `sb_secret_` anahtarlarında Supabase'in anahtarı istek başına
 *   içsel JWT'ye çevirmesi sırasında ALTIKSIYETLI saat kayması ("JWT issued
 *   at future", PGRST303) kaynaklı aralıklı 401'ler görülebilir. Bu yüzden
 *   artan beklemeyle 4 denemeye kadar kendini iyileştirir; kalıcı dönemlerde
 *   sayfa mock/boş duruma düşer (kalıcı çözüm: eski tip service_role JWT anahtarı).
 */

const URL = process.env.SUPABASE_URL ?? "";
const KEY =
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseLive = URL.length > 0 && KEY.length > 0;

/** Transient kabul edilen durumlar: yeniden deneme yapılır. */
const RETRYABLE = new Set([401, 429, 500, 502, 503, 504]);

const BACKOFF_MS = [500, 1500, 3000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sbSelect<T>(
  table: string,
  search: string,
): Promise<T[] | null> {
  if (!supabaseLive) return null;
  const requestUrl = `${URL}/rest/v1/${table}?${search}`;

  const attempts = BACKOFF_MS.length + 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(requestUrl, {
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      if (res.ok) {
        return (await res.json()) as T[];
      }
      const body = await res.text().catch(() => "");
      if (RETRYABLE.has(res.status) && attempt < attempts) {
        await sleep(BACKOFF_MS[attempt - 1]);
        continue;
      }
      console.error(
        `supabase ${table}: HTTP ${res.status} (${attempt}. deneme)` +
          (body ? ` — ${body.slice(0, 200)}` : "")
      );
      return null;
    } catch (err) {
      if (attempt < attempts) {
        await sleep(BACKOFF_MS[attempt - 1]);
        continue;
      }
      console.error(
        `supabase ${table}:`,
        err instanceof Error ? err.message : err
      );
      return null;
    }
  }
  return null;
}
