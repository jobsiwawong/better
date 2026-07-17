import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Bucket that holds note images + expense receipts. Created on demand.
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";

let client: ReturnType<typeof createClient> | null = null;
let bucketReady = false;

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

async function ensureBucket() {
  if (bucketReady) return;
  const supabase = getClient();
  // Idempotent: createBucket errors if it already exists — that's fine.
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 8 * 1024 * 1024,
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Could not create storage bucket: ${error.message}`);
  }
  bucketReady = true;
}

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * @param folder logical prefix, e.g. "notes" or "receipts".
 */
export async function uploadToStorage(file: File, folder: string): Promise<string> {
  await ensureBucket();
  const supabase = getClient();

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
