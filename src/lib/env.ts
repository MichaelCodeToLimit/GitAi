export const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL ?? "";
export const supabaseKey: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseKey);

/** The site's base path without a trailing slash ("" or "/GitAi"). */
export const basePath = import.meta.env.BASE_URL.replace(/\/+$/, "");

/** Absolute URL for a path inside the site, e.g. for auth redirect links. */
export function siteUrl(path: string) {
  return `${window.location.origin}${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}
