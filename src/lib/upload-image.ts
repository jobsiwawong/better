// Uploads a picked/pasted image to Supabase Storage (via the /api/upload
// route, which holds the service-role key server-side) and returns the
// public URL that gets embedded in note content / stored on a receipt.
//
// Signature is unchanged from the old base64 version, so callers just get a
// URL string instead of a data URL.
export async function uploadImage(
  file: File,
  folder: "notes" | "receipts" = "notes",
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Image upload failed.");
  }
  const { url } = await res.json();
  return url as string;
}

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
