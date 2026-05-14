import { createClient } from "@supabase/supabase-js";

const BUCKET = "patient-files";

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

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  // استخراج المسار من الـ URL
  const url = new URL(fileUrl);
  const path = url.pathname.split(`/${BUCKET}/`)[1];
  if (!path) return;

  await supabase.storage.from(BUCKET).remove([path]);
}

export function isStorageConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}
