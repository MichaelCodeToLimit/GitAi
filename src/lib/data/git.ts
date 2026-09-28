// Client for the Git server's HTTP API, called straight from the browser. Every call sends the
// signed-in user's Supabase token so the server can apply permissions. A 404 means "not found or
// not allowed".

import { encodePath, extension } from "@/lib/paths";
import type { ActionResult, Blob, CommitDetail, CommitPage, EntryCommit, FileChange, Refs, Tree } from "@/lib/types";
import {
  demoBlob,
  demoCommit,
  demoCommits,
  demoLanguagesFor,
  demoRefs,
  demoTree,
  demoTreeCommits,
} from "./demo";
import { DEMO_WRITE_ERROR, gitServerUrl, isDemo } from "./mode";
import { getAccessToken } from "./session";

export class GitServerError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GitServerError";
    this.status = status;
  }
}

const repoBase = (owner: string, name: string) => `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
const refSegment = (ref: string) => encodeURIComponent(ref);

async function gitFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!gitServerUrl) throw new GitServerError("The code service isn't configured (VITE_GIT_SERVER_URL is missing).");
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  try {
    return await fetch(`${gitServerUrl}${path}`, { ...init, headers });
  } catch (error) {
    throw new GitServerError(`The code service is unreachable: ${(error as Error).message}`);
  }
}

/** GET a JSON resource; null on 404, throws on other failures. */
async function getJson<T>(path: string): Promise<T | null> {
  const res = await gitFetch(path);
  if (res.status === 404) return null;
  if (!res.ok) throw new GitServerError(`Code service error ${res.status}`, res.status);
  return (await res.json()) as T;
}

async function errorMessage(res: Response) {
  try {
    const body = await res.json();
    return body.error ?? body.message ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

export async function getRefs(owner: string, name: string): Promise<Refs | null> {
  if (isDemo) return demoRefs(owner, name);
  return getJson<Refs>(`${repoBase(owner, name)}/refs`);
}

export async function getTree(owner: string, name: string, ref: string, path: string): Promise<Tree | null> {
  if (isDemo) return demoTree(owner, name, path);
  return getJson<Tree>(`${repoBase(owner, name)}/tree/${refSegment(ref)}/${encodePath(path)}`);
}

export async function getTreeCommits(owner: string, name: string, ref: string, path: string): Promise<Record<string, EntryCommit>> {
  if (isDemo) return demoTreeCommits(owner, name, path);
  try {
    return (await getJson<Record<string, EntryCommit>>(`${repoBase(owner, name)}/tree-commits/${refSegment(ref)}/${encodePath(path)}`)) ?? {};
  } catch {
    return {}; // Optional enrichment: the file list still renders without it.
  }
}

export async function getBlob(owner: string, name: string, ref: string, path: string): Promise<Blob | null> {
  if (isDemo) return demoBlob(owner, name, path);
  return getJson<Blob>(`${repoBase(owner, name)}/blob/${refSegment(ref)}/${encodePath(path)}`);
}

export async function getCommits(
  owner: string,
  name: string,
  opts: { ref: string; path?: string; page?: number; perPage?: number },
): Promise<CommitPage | null> {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? 30;
  if (isDemo) return demoCommits(owner, name, opts.path ?? "", page, perPage);
  const params = new URLSearchParams({ ref: opts.ref, page: String(page), per_page: String(perPage) });
  if (opts.path) params.set("path", opts.path);
  return getJson<CommitPage>(`${repoBase(owner, name)}/commits?${params}`);
}

export async function getCommit(owner: string, name: string, sha: string): Promise<CommitDetail | null> {
  if (!/^[0-9a-f]{4,40}$/i.test(sha)) return null;
  if (isDemo) return demoCommit(owner, name, sha);
  return getJson<CommitDetail>(`${repoBase(owner, name)}/commit/${sha}`);
}

/** Bytes per language name at a ref, e.g. { TypeScript: 12034 }. */
export async function getLanguages(owner: string, name: string, ref: string): Promise<Record<string, number>> {
  if (isDemo) return demoLanguagesFor(owner, name);
  try {
    return (await getJson<Record<string, number>>(`${repoBase(owner, name)}/languages/${refSegment(ref)}`)) ?? {};
  } catch {
    return {};
  }
}

// ---- Raw files and archives ----------------------------------------------------

const DEMO_MIME: Record<string, string> = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", gif: "image/gif" };

/**
 * A URL the browser can load directly. Works for public repositories; private ones need
 * {@link fetchRawBlob} because <img> and links can't send an Authorization header.
 */
export function rawFileUrl(owner: string, name: string, ref: string, path: string): string {
  if (isDemo) {
    const blob = demoBlob(owner, name, path);
    const mime = DEMO_MIME[extension(path)] ?? "text/plain;charset=utf-8";
    return `data:${mime};charset=utf-8,${encodeURIComponent(blob?.content ?? "")}`;
  }
  return `${gitServerUrl}${repoBase(owner, name)}/raw/${refSegment(ref)}/${encodePath(path)}`;
}

export function archiveUrl(owner: string, name: string, ref: string): string | null {
  if (isDemo) return null;
  return `${gitServerUrl}${repoBase(owner, name)}/archive/${refSegment(ref)}.zip`;
}

/** Fetches a raw file or archive with the user's token, for private repositories. */
export async function fetchWithAuth(url: string): Promise<globalThis.Blob> {
  if (url.startsWith("data:")) return (await fetch(url)).blob();
  if (!url.startsWith(gitServerUrl)) throw new GitServerError("Unexpected URL");
  const res = await gitFetch(url.slice(gitServerUrl.length));
  if (!res.ok) throw new GitServerError(`Couldn't download the file (${res.status})`, res.status);
  return res.blob();
}

// ---- Writes -------------------------------------------------------------------

/** Commits browser edits and uploads. Fails with a clear message if the branch moved. */
export async function commitChanges(
  owner: string,
  name: string,
  input: { branch: string; parentSha: string | null; message: string; changes: FileChange[] },
): Promise<ActionResult<{ sha: string }>> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const res = await gitFetch(`${repoBase(owner, name)}/commits`, {
    method: "POST",
    body: JSON.stringify({
      branch: input.branch,
      parent_sha: input.parentSha,
      message: input.message,
      changes: input.changes,
    }),
  });
  if (res.status === 409) {
    return { ok: false, error: "Someone pushed to this branch while you were editing. Reload and try again." };
  }
  if (!res.ok) return { ok: false, error: await errorMessage(res) };
  return { ok: true, data: (await res.json()) as { sha: string } };
}

export async function initGitRepository(
  owner: string,
  name: string,
  opts: { readme: boolean; description: string | null },
): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  try {
    const res = await gitFetch(`${repoBase(owner, name)}/init`, { method: "POST", body: JSON.stringify(opts) });
    return res.ok ? { ok: true } : { ok: false, error: await errorMessage(res) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function deleteGitRepository(owner: string, name: string): Promise<ActionResult> {
  try {
    const res = await gitFetch(repoBase(owner, name), { method: "DELETE" });
    return res.ok ? { ok: true } : { ok: false, error: await errorMessage(res) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export function cloneUrl(owner: string, name: string) {
  const base = gitServerUrl || "https://git.example.com";
  return `${base}/${owner}/${name}.git`;
}
