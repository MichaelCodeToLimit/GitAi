import { supabase } from "@/lib/supabase";
import type { ActionResult, Profile } from "@/lib/types";
import { USERNAME_PATTERN } from "@/lib/validation";
import { demoProfile } from "./demo";
import { DEMO_WRITE_ERROR, isDemo } from "./mode";
import { PROFILE_COLUMNS, resetViewer } from "./session";

export async function getProfile(username: string): Promise<Profile | null> {
  if (!USERNAME_PATTERN.test(username)) return null;
  if (isDemo) return demoProfile(username);
  // The username pattern excludes LIKE wildcards, so ilike is an exact, case-insensitive match.
  const { data, error } = await supabase().from("profiles").select(PROFILE_COLUMNS).ilike("username", username).maybeSingle();
  if (error) throw error;
  return data;
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  if (isDemo) return Boolean(demoProfile(username));
  const { data } = await supabase().from("profiles").select("id").ilike("username", username).maybeSingle();
  return Boolean(data);
}

export type ProfileUpdate = Pick<Profile, "username" | "display_name" | "bio" | "website" | "location" | "company">;

export async function updateProfile(userId: string, update: ProfileUpdate): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const { error } = await supabase().from("profiles").update(update).eq("id", userId);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That username is taken.", fieldErrors: { username: "Taken" } };
    return { ok: false, error: error.message };
  }
  resetViewer();
  return { ok: true, message: "Profile saved." };
}

export async function updateAvatar(userId: string, file: File): Promise<ActionResult<{ url: string }>> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const types: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
  const ext = types[file.type];
  if (!ext) return { ok: false, error: "Use a PNG, JPEG, GIF or WebP image." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Images can be at most 2 MB." };

  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase().storage.from("avatars").upload(path, file, { contentType: file.type });
  if (error) return { ok: false, error: error.message };
  const url = supabase().storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await supabase().from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (updateError) return { ok: false, error: updateError.message };
  resetViewer();
  return { ok: true, data: { url }, message: "Picture updated." };
}
