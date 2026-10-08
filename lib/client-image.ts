const MAX_SIDE = 800;
const JPEG_QUALITY = 0.82;

/**
 * Shrinks a photo in the browser before upload so storage and page loads stay small.
 * If the browser cannot decode the file, the original is sent and the server decides.
 */
export async function shrinkImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    return blob ? new File([blob], "image.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

/** Uploads an image to one of the entity image endpoints. Returns an error message, or null on success. */
export async function uploadEntityImage(url: string, file: File): Promise<string | null> {
  const body = new FormData();
  body.append("file", await shrinkImage(file));
  const res = await fetch(url, { method: "POST", body }).catch(() => null);
  if (res?.ok) return null;
  const data = res ? await res.json().catch(() => ({})) : {};
  return data.error ?? "تعذر رفع الصورة، تحقق من الاتصال";
}
