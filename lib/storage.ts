import { createClient } from "@supabase/supabase-js";

const BUCKET = "patient-files";
const SIGNED_URL_TTL_SECONDS = 5 * 60;

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder: string
): Promise<string | null> {
  const supabase = getClient();
  if (!supabase) {
    console.warn("[Storage] SUPABASE_URL or SUPABASE_SERVICE_KEY not set");
    return null;
  }

  const path = `${folder}/${Date.now()}-${fileName}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    console.error("[Storage] Upload error:", error.message);
    return null;
  }

  return path;
}

export function getStoragePath(fileUrlOrPath: string): string | null {
  if (!fileUrlOrPath) return null;
  if (!fileUrlOrPath.startsWith("http")) return fileUrlOrPath;

  try {
    const url = new URL(fileUrlOrPath);
    const marker = `/${BUCKET}/`;
    const path = url.pathname.split(marker)[1];
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

export async function createSignedFileUrl(fileUrlOrPath: string): Promise<string | null> {
  const supabase = getClient();
  const path = getStoragePath(fileUrlOrPath);
  if (!supabase || !path) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[Storage] Signed URL error:", error.message);
    return null;
  }

  return data.signedUrl;
}

export async function deleteFile(fileUrlOrPath: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  const path = getStoragePath(fileUrlOrPath);
  if (!path) return;

  await supabase.storage.from(BUCKET).remove([path]);
}

export function isStorageConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}
