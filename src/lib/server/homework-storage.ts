/**
 * Ödev fotoğrafı Storage erişiminin TEK noktası.
 * Bucket: 'odev-fotograflari' (özel) — okuma yalnız kısa süreli imzalı URL ile.
 * Yol yapısı: `${assignmentId}/${contactId}-${zaman}` — bir ödevin tüm
 * fotoğrafları tek klasörde durur, ödev silinince klasör tek çağrıyla gider.
 *
 * DEVİR NOTU (ana yazılımcı): Bu dosyada bilinçli olarak kimlik/rol/yetki
 * kontrolü YOKTUR. Gerçek rol sistemi (müdür/öğretmen/danışman/öğrenci)
 * bağlandığında yükleme-silme-URL üretimine yetki kontrolü BURAYA eklenecek.
 * Route'lar yalnız bu yardımcıyı kullanır; Supabase Storage'a doğrudan
 * erişen başka kod olmamalı.
 */
import { createClient } from "@supabase/supabase-js";

export const HOMEWORK_BUCKET = "odev-fotograflari";

/** Yüklenebilen en büyük fotoğraf: 5 MB */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const URL = process.env.SUPABASE_URL ?? "";
const KEY =
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function db() {
  return createClient(URL, KEY, {
    auth: { persistSession: false },
  });
}

/** Öğrenci teslimi için storage yolu. */
export function buildHomeworkPhotoPath(assignmentId: string, contactId: string): string {
  return `${assignmentId}/${contactId}-${Date.now()}`;
}

/** Dosyayı bucket'a yazar; storage içindeki yolu döner. */
export async function uploadHomeworkPhoto(
  path: string,
  file: File
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await db().storage
    .from(HOMEWORK_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) throw new Error(error.message);
  return path;
}

/** Kısa süreli (varsayılan 60 dk) imzalı okuma URL'i. */
export async function signedHomeworkPhotoUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await db().storage
    .from(HOMEWORK_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new Error(error?.message ?? "İmzalı URL üretilemedi");
  return data.signedUrl;
}

/** Bir ödeve ait tüm fotoğrafları (klasörü) siler — ödev silinirken. */
export async function deleteHomeworkPhotoFolder(assignmentId: string): Promise<void> {
  const client = db();
  const { data, error } = await client.storage
    .from(HOMEWORK_BUCKET)
    .list(assignmentId, { limit: 200 });
  if (error) return; // klasör yoksa sessiz geç
  const paths = (data ?? []).map((f) => `${assignmentId}/${f.name}`);
  if (paths.length === 0) return;
  const { error: rmError } = await client.storage
    .from(HOMEWORK_BUCKET)
    .remove(paths);
  if (rmError) throw new Error(rmError.message);
}
