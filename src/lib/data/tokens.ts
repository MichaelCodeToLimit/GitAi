import { supabase } from "@/lib/supabase";
import type { AccessToken, ActionResult } from "@/lib/types";
import { ago } from "./demo-fixtures";
import { DEMO_WRITE_ERROR, isDemo } from "./mode";

export async function listAccessTokens(): Promise<AccessToken[]> {
  if (isDemo) {
    return [{ id: "demo-1", name: "Laptop", token_prefix: "gitai_7Hq2", created_at: ago(40), expires_at: ago(-50), last_used_at: ago(1) }];
  }
  const { data, error } = await supabase().rpc("list_access_tokens");
  if (error) throw error;
  return (data ?? []) as AccessToken[];
}

/** Returns the plaintext token. It is shown once and never stored in readable form. */
export async function createAccessToken(name: string, expiresAt: string | null): Promise<ActionResult<{ token: string }>> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const { data, error } = await supabase().rpc("create_access_token", { p_name: name, p_expires_at: expiresAt });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { token: String(data) } };
}

export async function revokeAccessToken(id: string): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const { error } = await supabase().rpc("revoke_access_token", { p_id: id });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Token revoked." };
}
