import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase instance with service role (for API routes)
export function createServerSupabase() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

const BUCKET = "lookbook";

/**
 * Upload a file (as Blob or Buffer) to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadToStorage(
  buffer: Buffer | Blob,
  path: string,
  contentType = "image/png"
): Promise<string> {
  const serverClient = createServerSupabase();

  const { error } = await serverClient.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = serverClient.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Fetch an image from a URL and upload it to Supabase Storage.
 * Returns the public URL.
 */
export async function mirrorImageToStorage(
  sourceUrl: string,
  path: string
): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${sourceUrl}`);

  const blob = await response.blob();
  return uploadToStorage(blob, path, blob.type || "image/png");
}
