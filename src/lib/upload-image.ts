// Turns a picked/pasted image into a string the editor can embed.
//
// INTERIM: returns a base64 data URL, which is stored inline in the note's
// content (in the DB), so images are available on any device that opens the
// note — no external storage needed yet.
//
// LATER (Supabase): replace the body with an upload that POSTs the file to a
// storage bucket and returns the public URL. Nothing else needs to change —
// the editor just stores whatever string this resolves to.
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
