import { supabase } from "@/lib/supabase";
import type { Viewer } from "@/lib/types";
import { demoViewer } from "./demo";
import { isDemo } from "./mode";

export const PROFILE_COLUMNS =
  "id, username, display_name, bio, avatar_url, website, location, company, created_at";

let viewerPromise: Promise<Viewer | null> | null = null;

async function loadViewer(): Promise<Viewer | null> {
  if (isDemo) return demoViewer();
  try {
    const { data } = await supabase().auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const { data: profile } = await supabase().from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
    if (!profile) return null;
    return { id: user.id, email: user.email ?? null, profile };
  } catch (error) {
    console.error("Couldn't load the signed-in user", error);
    return null;
  }
}

/** The signed-in person, or null. Cached until sign-in state changes. */
export function getViewer(): Promise<Viewer | null> {
  viewerPromise ??= loadViewer();
  return viewerPromise;
}

/** Forget the cached viewer, e.g. after signing in or out or editing the profile. */
export function resetViewer() {
  viewerPromise = null;
}

/** The user's access token, sent to the Git server so it can apply permissions. */
export async function getAccessToken(): Promise<string | null> {
  if (isDemo) return null;
  const { data } = await supabase().auth.getSession();
  return data.session?.access_token ?? null;
}
