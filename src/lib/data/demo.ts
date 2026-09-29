// Demo-mode implementations of the data layer, backed by demo-fixtures.ts.

import { languageForPath, LANGUAGES } from "@/lib/languages";
import type {
  Blob,
  Commit,
  CommitDetail,
  CommitPage,
  EntryCommit,
  Profile,
  Refs,
  RepoListItem,
  Repository,
  Tree,
  TreeEntry,
  Viewer,
} from "@/lib/types";
import { ago, DEMO_PROFILES, DEMO_REPOS, type DemoCommit, type DemoRepo } from "./demo-fixtures";

const byteLength = (text: string) => new TextEncoder().encode(text).length;

const DEMO_VIEWER_KEY = "gitai-demo-viewer";

/** In demo mode, "signing in" just remembers which sample user to act as. */
export function setDemoViewer(username: string | null) {
  try {
    if (username) localStorage.setItem(DEMO_VIEWER_KEY, username);
    else localStorage.removeItem(DEMO_VIEWER_KEY);
  } catch {
    // Storage can be unavailable (private mode); demo sign-in just won't stick.
  }
}

export function demoViewer(): Viewer | null {
  let username: string | null = import.meta.env.VITE_DEMO_VIEWER ?? null;
  try {
    username = localStorage.getItem(DEMO_VIEWER_KEY) ?? username;
  } catch {
    // Fall back to the environment setting.
  }
  const profile = username ? demoProfile(username) : null;
  return profile ? { id: profile.id, email: `${profile.username}@example.com`, profile } : null;
}

export function demoProfile(username: string): Profile | null {
  return DEMO_PROFILES.find((p) => p.username.toLowerCase() === username.toLowerCase()) ?? null;
}

function summary(username: string) {
  const p = demoProfile(username)!;
  return { id: p.id, username: p.username, display_name: p.display_name, avatar_url: p.avatar_url };
}

function canSee(repo: DemoRepo) {
  return repo.visibility === "public" || demoViewer()?.profile.username === repo.owner;
}

function toRepository(repo: DemoRepo): Repository {
  const pushed = repo.commits[0] ? ago(repo.commits[0].days, repo.commits[0].hours) : null;
  return {
    id: repo.id,
    owner_id: summary(repo.owner).id,
    name: repo.name,
    description: repo.description,
    website_url: repo.website_url,
    topics: repo.topics,
    visibility: repo.visibility,
    default_branch: "main",
    created_at: ago(repo.created),
    updated_at: pushed ?? ago(repo.created),
    pushed_at: pushed,
    is_empty: repo.commits.length === 0,
    owner: summary(repo.owner),
  };
}

function toListItem(repo: DemoRepo): RepoListItem {
  const r = toRepository(repo);
  const langs = demoLanguages(repo);
  const top = Object.entries(langs).sort((a, b) => b[1] - a[1])[0];
  const lang = top ? Object.values(LANGUAGES).find((l) => l.name === top[0]) : null;
  return { ...r, language: lang ? { name: lang.name, color: lang.color } : null };
}

function find(owner: string, name: string) {
  const repo = DEMO_REPOS.find(
    (r) => r.owner.toLowerCase() === owner.toLowerCase() && r.name.toLowerCase() === name.toLowerCase(),
  );
  return repo && canSee(repo) ? repo : null;
}

export function demoRepository(owner: string, name: string): Repository | null {
  const repo = find(owner, name);
  return repo ? toRepository(repo) : null;
}

export function demoReposForOwner(ownerId: string): RepoListItem[] {
  return DEMO_REPOS.filter((r) => summary(r.owner).id === ownerId && canSee(r))
    .map(toListItem)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function demoSearch({ q, sort, page, perPage }: { q?: string; sort: string; page: number; perPage: number }) {
  const needle = q?.trim().toLowerCase();
  let items = DEMO_REPOS.filter((r) => r.visibility === "public").map(toListItem);
  if (needle) {
    items = items.filter((r) =>
      [r.name, r.description ?? "", ...r.topics, r.owner.username].some((s) => s.toLowerCase().includes(needle)),
    );
  }
  items.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "newest"
        ? b.id.localeCompare(a.id)
        : b.updated_at.localeCompare(a.updated_at),
  );
  return { items: items.slice((page - 1) * perPage, page * perPage), total: items.length };
}

// ---- Git ----------------------------------------------------------------------

function demoRepoFor(owner: string, name: string) {
  const repo = find(owner, name);
  if (!repo) return null;
  return repo;
}

function headSha(repo: DemoRepo) {
  return repo.commits[0]?.sha ?? "";
}

export function demoRefs(owner: string, name: string): Refs | null {
  const repo = demoRepoFor(owner, name);
  if (!repo) return null;
  const sha = headSha(repo);
  return {
    default_branch: "main",
    empty: repo.commits.length === 0,
    branches: repo.branches.map((b) => ({ name: b, sha })),
    tags: repo.tags.map((t) => ({ name: t, sha })),
  };
}

export function demoTree(owner: string, name: string, path: string): Tree | null {
  const repo = demoRepoFor(owner, name);
  if (!repo || !repo.commits.length) return null;
  const prefix = path ? `${path}/` : "";
  const seen = new Map<string, TreeEntry>();
  for (const [filePath, content] of Object.entries(repo.files)) {
    if (!filePath.startsWith(prefix)) continue;
    const rest = filePath.slice(prefix.length);
    const [head, ...tail] = rest.split("/");
    const entryPath = prefix + head;
    if (seen.has(head)) continue;
    seen.set(
      head,
      tail.length
        ? { name: head, path: entryPath, type: "tree", size: null, mode: "040000" }
        : { name: head, path: entryPath, type: "blob", size: byteLength(content), mode: "100644" },
    );
  }
  if (path && seen.size === 0) return null;
  const entries = [...seen.values()].sort((a, b) =>
    a.type !== b.type ? (a.type === "tree" ? -1 : 1) : a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );
  return { commit_sha: headSha(repo), path, entries };
}

function touches(commit: DemoCommit, path: string) {
  return commit.files.some((f) => !path || f.path === path || f.path.startsWith(`${path}/`));
}

export function demoTreeCommits(owner: string, name: string, path: string): Record<string, EntryCommit> {
  const repo = demoRepoFor(owner, name);
  const tree = demoTree(owner, name, path);
  if (!repo || !tree) return {};
  const result: Record<string, EntryCommit> = {};
  for (const entry of tree.entries) {
    const commit = repo.commits.find((c) => touches(c, entry.path)) ?? repo.commits[repo.commits.length - 1];
    result[entry.name] = { sha: commit.sha, message: commit.message.split("\n")[0], date: ago(commit.days, commit.hours) };
  }
  return result;
}

export function demoBlob(owner: string, name: string, path: string): Blob | null {
  const repo = demoRepoFor(owner, name);
  const content = repo?.files[path];
  if (content === undefined) return null;
  return { path, sha: headSha(repo!), size: byteLength(content), binary: false, truncated: false, content };
}

function toCommit(c: DemoCommit): Commit {
  const author = demoProfile(c.author)!;
  const person = {
    name: author.display_name ?? author.username,
    email: `${author.username}@users.noreply.example`,
    date: ago(c.days, c.hours),
    username: author.username,
  };
  return { sha: c.sha, parents: [], message: c.message, author: person, committer: person };
}

export function demoCommits(owner: string, name: string, path: string, page: number, perPage: number): CommitPage | null {
  const repo = demoRepoFor(owner, name);
  if (!repo) return null;
  const list = repo.commits.filter((c) => touches(c, path));
  const commits = list.slice((page - 1) * perPage, page * perPage).map((c, i, arr) => {
    const commit = toCommit(c);
    const next = arr[i + 1] ?? list[(page - 1) * perPage + i + 1];
    return { ...commit, parents: next ? [next.sha] : [] };
  });
  return { commits, has_more: list.length > page * perPage };
}

export function demoCommit(owner: string, name: string, sha: string): CommitDetail | null {
  const repo = demoRepoFor(owner, name);
  const index = repo?.commits.findIndex((c) => c.sha.startsWith(sha.toLowerCase())) ?? -1;
  if (!repo || index < 0) return null;
  const c = repo.commits[index];
  const parent = repo.commits[index + 1];
  const files = c.files.map((f) => ({
    path: f.path,
    old_path: null,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    binary: false,
    patch: f.patch ?? syntheticPatch(repo, f),
  }));
  return {
    commit: { ...toCommit(c), parents: parent ? [parent.sha] : [] },
    stats: {
      additions: files.reduce((a, f) => a + f.additions, 0),
      deletions: files.reduce((a, f) => a + f.deletions, 0),
    },
    files,
  };
}

/** For added files without a hand-written patch, show the current content as additions. */
function syntheticPatch(repo: DemoRepo, f: DemoCommit["files"][number]) {
  const content = repo.files[f.path];
  if (f.status !== "added" || content === undefined) return null;
  const lines = content.replace(/\n$/, "").split("\n");
  return `@@ -0,0 +1,${lines.length} @@\n${lines.map((l) => `+${l}`).join("\n")}`;
}

function demoLanguages(repo: DemoRepo) {
  const totals: Record<string, number> = {};
  for (const [path, content] of Object.entries(repo.files)) {
    const lang = LANGUAGES[languageForPath(path)];
    if (!lang?.bar) continue;
    totals[lang.name] = (totals[lang.name] ?? 0) + byteLength(content);
  }
  return totals;
}

export function demoLanguagesFor(owner: string, name: string) {
  const repo = demoRepoFor(owner, name);
  return repo ? demoLanguages(repo) : {};
}
