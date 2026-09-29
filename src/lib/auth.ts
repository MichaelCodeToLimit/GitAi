// Sign-in flows, run in the browser against Supabase Auth.

import { z } from "zod";
import { siteUrl, supabaseKey, supabaseUrl } from "@/lib/env";
import { setDemoViewer } from "@/lib/data/demo";
import { DEMO_WRITE_ERROR, isDemo } from "@/lib/data/mode";
import { isUsernameTaken } from "@/lib/data/profiles";
import { resetViewer } from "@/lib/data/session";
import { supabase } from "@/lib/supabase";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, passwordSchema, usernameSchema } from "@/lib/validation";

export type OAuthProvider = "github" | "google" | "azure" | "apple";

const ALL_PROVIDERS: OAuthProvider[] = ["github", "google", "azure", "apple"];
let enabledProviders: Promise<OAuthProvider[]> | null = null;

/** Providers switched on in Supabase Auth, read from its public settings so buttons appear once enabled. */
export function getEnabledProviders(): Promise<OAuthProvider[]> {
  if (isDemo) return Promise.resolve(ALL_PROVIDERS);
  enabledProviders ??= fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseKey } })
    .then((res) => (res.ok ? res.json() : { external: {} }))
    .then((settings: { external?: Record<string, boolean> }) => ALL_PROVIDERS.filter((p) => settings.external?.[p]))
    .catch(() => []);
  return enabledProviders;
}

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(value: string | null | undefined) {
  const next = value ?? "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

const callbackUrl = (next: string) => siteUrl(`/auth/callback?next=${encodeURIComponent(safeNext(next))}`);
const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export async function signInWithPassword(email: string, password: string): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success || !password) return { ok: false, error: "Enter your email and password." };
  const { error } = await supabase().auth.signInWithPassword({ email: parsed.data, password });
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, error: "Confirm your email first. Check your inbox for the link." };
    return { ok: false, error: "Incorrect email or password." };
  }
  resetViewer();
  return { ok: true };
}

export async function sendMagicLink(email: string, next: string): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  const { error } = await supabase().auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: callbackUrl(next) },
  });
  // Don't reveal whether an account exists.
  if (error && error.status !== 400 && error.status !== 422) return { ok: false, error: error.message };
  return { ok: true, message: `If an account exists for ${parsed.data}, a sign-in link is on its way.` };
}

const signUpSchema = z.object({ username: usernameSchema, email: emailSchema, password: passwordSchema });

export async function signUp(input: { username: string; email: string; password: string }): Promise<ActionResult<{ signedIn: boolean }>> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (await isUsernameTaken(parsed.data.username)) {
    return { ok: false, error: "That username is taken.", fieldErrors: { username: "Username is taken" } };
  }
  const { data, error } = await supabase().auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { username: parsed.data.username }, emailRedirectTo: callbackUrl("/") },
  });
  if (error) {
    if (error.code === "user_already_exists") return { ok: false, error: "An account with that email already exists. Try signing in." };
    if (error.code === "weak_password") return { ok: false, error: error.message, fieldErrors: { password: "Too weak" } };
    return { ok: false, error: error.message };
  }
  resetViewer();
  if (data.session) return { ok: true, data: { signedIn: true } };
  return { ok: true, data: { signedIn: false }, message: `Almost there! We sent a confirmation link to ${parsed.data.email}.` };
}

/** Sends the browser to the provider; it comes back to /auth/callback. */
export async function signInWithProvider(provider: OAuthProvider, next: string): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const { error } = await supabase().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl(next),
      // Microsoft needs the email scope to return an address.
      scopes: provider === "azure" ? "email" : undefined,
    },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  await supabase().auth.resetPasswordForEmail(parsed.data, { redirectTo: callbackUrl("/auth/update-password") });
  return { ok: true, message: `If an account exists for ${parsed.data}, we sent a link to reset the password.` };
}

export async function updatePassword(password: string, confirm: string): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    const message = parsed.error.issues[0].message;
    return { ok: false, error: message, fieldErrors: { password: message } };
  }
  if (password !== confirm) return { ok: false, error: "The passwords don't match.", fieldErrors: { confirm: "Doesn't match" } };
  const { error } = await supabase().auth.updateUser({ password: parsed.data });
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "Choose a password you haven't used here before." };
    return { ok: false, error: error.message };
  }
  return { ok: true, message: "Your password was updated." };
}

export async function signOut() {
  if (isDemo) setDemoViewer(null);
  else await supabase().auth.signOut();
  resetViewer();
}
