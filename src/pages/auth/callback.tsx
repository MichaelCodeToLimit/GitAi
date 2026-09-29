import { redirect, type LoaderFunctionArgs } from "react-router";
import { safeNext } from "@/lib/auth";
import { isDemo } from "@/lib/data/mode";
import { resetViewer } from "@/lib/data/session";
import { supabase } from "@/lib/supabase";

// A sign-in code works once. If this loader runs again for the same code (a revalidation, a
// double navigation), reuse the first attempt instead of exchanging it a second time.
const exchanges = new Map<string, Promise<{ error: Error | null }>>();

const DIFFERENT_BROWSER_MESSAGE =
  "This link was opened in a different browser from the one where you started, so we couldn't sign you in here. " +
  "If you were confirming your email address, it's confirmed: sign in to continue.";

/** Finishes OAuth, magic-link, sign-up confirmation and password-reset flows (PKCE code exchange). */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (providerError) throw redirect(`/auth/error?message=${encodeURIComponent(providerError)}`);
  if (isDemo) throw redirect("/");

  const code = url.searchParams.get("code");
  if (!code) throw redirect("/auth/error?message=Missing%20sign-in%20code");

  let attempt = exchanges.get(code);
  if (!attempt) {
    attempt = supabase()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => ({ error }));
    exchanges.set(code, attempt);
  }
  const { error } = await attempt;

  if (error) {
    // Already signed in, e.g. the link was opened twice: there's nothing left to finish.
    const { data } = await supabase().auth.getSession();
    if (!data.session) {
      const message = /code verifier/i.test(error.message) ? DIFFERENT_BROWSER_MESSAGE : error.message;
      throw redirect(`/auth/error?message=${encodeURIComponent(message)}`);
    }
  }
  resetViewer();
  throw redirect(next);
}

export default function AuthCallback() {
  return <p className="p-8 text-center text-fg-muted">Signing you in…</p>;
}
