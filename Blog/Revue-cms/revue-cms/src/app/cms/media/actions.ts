"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Media } from "@/lib/supabase/database.types";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadMediaFile(
  formData: FormData,
): Promise<{ row?: Media; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { error: "No file provided" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are supported" };
  }

  if (file.size > MAX_BYTES) {
    return { error: "File must be 10MB or smaller" };
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `uploads/${Date.now()}-${safe}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from("media").upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (upErr) return { error: upErr.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(path);

  const { data: row, error: dbErr } = await supabase
    .from("media")
    .insert({
      url: publicUrl,
      storage_path: path,
      filename: safe,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: "",
      folder: "uploads",
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbErr) {
    await supabase.storage.from("media").remove([path]);
    return { error: dbErr.message };
  }

  revalidatePath("/cms/media");
  return { row: row as Media };
}

export async function updateMediaAlt(id: string, alt: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("media")
    .update({ alt_text: alt })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/cms/media");
  return { success: true };
}

export async function deleteMedia(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: row, error: fetchErr } = await supabase
    .from("media")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (fetchErr) return { error: fetchErr.message };

  if (row?.storage_path) {
    await supabase.storage.from("media").remove([row.storage_path]);
  }

  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/cms/media");
  return { success: true };
}
