import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseEnv, supabaseKey, supabaseUrl } from "@/lib/env";

let client: SupabaseClient | null = null;

/** The browser's Supabase client. The session lives in localStorage; PKCE is used for redirects. */
export function supabase(): SupabaseClient {
  if (!hasSupabaseEnv) throw new Error("Supabase isn't configured.");
  client ??= createClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      // /auth/callback exchanges the code itself, so a stray ?code= elsewhere is ignored.
      detectSessionInUrl: false,
    },
  });
  return client;
}
