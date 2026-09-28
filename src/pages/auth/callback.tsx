import { redirect, type LoaderFunctionArgs } from "react-router";
import { safeNext } from "@/lib/auth";
import { isDemo } from "@/lib/data/mode";
import { resetViewer } from "@/lib/data/session";
import { supabase } from "@/lib/supabase";

/** Finishes OAuth, magic-link, sign-up confirmation and password-reset flows (PKCE code exchange). */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (providerError) throw redirect(`/auth/error?message=${encodeURIComponent(providerError)}`);
  if (isDemo) throw redirect("/");

  const code = url.searchParams.get("code");
  if (!code) throw redirect("/auth/error?message=Missing%20sign-in%20code");

  const { error } = await supabase().auth.exchangeCodeForSession(code);
  if (error) throw redirect(`/auth/error?message=${encodeURIComponent(error.message)}`);
  resetViewer();
  throw redirect(next);
}

export default function AuthCallback() {
  return <p className="p-8 text-center text-fg-muted">Signing you in…</p>;
}
