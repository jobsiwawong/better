import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { uploadToStorage } from "@/lib/supabase-storage";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB, mirrors MAX_IMAGE_BYTES on the client.
const ALLOWED_FOLDERS = new Set(["notes", "receipts"]);

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const folderRaw = form.get("folder");
  const folder = typeof folderRaw === "string" && ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : "notes";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8 MB)." }, { status: 413 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 415 });
  }

  try {
    const url = await uploadToStorage(file, folder);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
