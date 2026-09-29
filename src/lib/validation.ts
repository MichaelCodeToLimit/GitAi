import { z } from "zod";

// Keep these in step with the database checks.
export const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
export const REPO_NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

const RESERVED_USERNAMES = new Set([
  "about", "admin", "api", "auth", "blog", "dashboard", "docs", "explore", "features", "help", "home",
  "login", "logout", "new", "notifications", "organizations", "pricing", "privacy", "search", "security",
  "settings", "signup", "site", "static", "support", "terms", "topics", "trending", "user", "users",
]);

export const usernameSchema = z
  .string()
  .trim()
  .min(1, "Pick a username")
  .max(39, "Usernames can be at most 39 characters")
  .regex(USERNAME_PATTERN, "Use letters, numbers and single hyphens; no hyphen at the start or end")
  .refine((u) => !RESERVED_USERNAMES.has(u.toLowerCase()), "That username is reserved");

/**
 * Turns whatever someone typed into a valid repository name, like GitHub does:
 * "test git ai v1" -> "test-git-ai-v1". Characters that can't appear in web or Git addresses
 * become hyphens.
 */
export function toRepoName(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // "café" -> "cafe"
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|-+$/g, "")
    .replace(/\.git$/i, "")
    .slice(0, 100);
}

export const repoNameSchema = z
  .string()
  .trim()
  .min(1, "Give your repository a name")
  .max(100, "Names can be at most 100 characters")
  .regex(REPO_NAME_PATTERN, "Use letters, numbers, dots, hyphens and underscores")
  .refine((n) => n !== "." && n !== ".." && !n.toLowerCase().endsWith(".git"), "That name isn't allowed");

export const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v === "" ? null : /^https?:\/\//i.test(v) ? v : `https://${v}`))
  .refine((v) => v === null || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v), "Enter a valid URL");

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters`)
    .transform((v) => (v === "" ? null : v));

/** "ai, Web-Apps  cli" -> ["ai", "web-apps", "cli"] */
export const topicsSchema = z
  .string()
  .transform((v) =>
    [...new Set(v.split(/[\s,]+/).map((t) => t.trim().toLowerCase()).filter(Boolean))],
  )
  .refine((list) => list.length <= 20, "Up to 20 topics")
  .refine((list) => list.every((t) => /^[a-z0-9][a-z0-9-]{0,34}$/.test(t)), "Topics use lowercase letters, numbers and hyphens");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
