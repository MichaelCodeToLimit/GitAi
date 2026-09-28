import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { safeNext } from "@/lib/auth";
import { isDemo } from "@/lib/data/mode";
import { resetViewer } from "@/lib/data/session";
import { supabase } from "@/lib/supabase";

/** Email links that carry a token hash (custom email templates) instead of a PKCE code. */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next") ?? (type === "recovery" ? "/auth/update-password" : "/"));
  if (isDemo) throw redirect("/");
  if (!tokenHash || !type) throw redirect("/auth/error?message=Invalid%20or%20expired%20link");

  const { error } = await supabase().auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) throw redirect(`/auth/error?message=${encodeURIComponent(error.message)}`);
  resetViewer();
  throw redirect(next);
}

export default function AuthConfirm() {
  return <p className="p-8 text-center text-fg-muted">Confirming…</p>;
}
