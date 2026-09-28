import { hasSupabaseEnv } from "@/lib/env";

/**
 * "demo" serves built-in sample data so the site works before Supabase and the Git server are
 * running. It's used when VITE_DATA=demo or Supabase isn't configured.
 */
export const isDemo = import.meta.env.VITE_DATA === "demo" || !hasSupabaseEnv;

export const gitServerUrl: string = (import.meta.env.VITE_GIT_SERVER_URL ?? "").replace(/\/+$/, "");

export const DEMO_WRITE_ERROR =
  "This is a demo with sample data. Connect Supabase and the Git server to save changes.";
