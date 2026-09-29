// Shapes the website works with. Supabase holds people and repository records;
// the Git server holds the code (refs, trees, blobs, commits).

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  company: string | null;
  created_at: string;
};

export type ProfileSummary = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;

export type Viewer = { id: string; email: string | null; profile: Profile };

export type Visibility = "public" | "private";

export type Repository = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  topics: string[];
  visibility: Visibility;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  /** True until the first push (kept up to date by the Git server). */
  is_empty: boolean;
  owner: ProfileSummary;
};

export type RepoListItem = Pick<
  Repository,
  "id" | "name" | "description" | "topics" | "visibility" | "updated_at" | "pushed_at" | "owner"
> & { language?: { name: string; color: string } | null };

export type AccessToken = {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
};

// ---- Git server ----------------------------------------------------------------

export type GitRef = { name: string; sha: string };

export type Refs = {
  default_branch: string;
  empty: boolean;
  branches: GitRef[];
  tags: GitRef[];
};

export type TreeEntryType = "tree" | "blob" | "submodule" | "symlink";

export type TreeEntry = {
  name: string;
  path: string;
  type: TreeEntryType;
  size: number | null;
  mode: string;
};

export type Tree = { commit_sha: string; path: string; entries: TreeEntry[] };

export type EntryCommit = { sha: string; message: string; date: string };

export type Blob = {
  path: string;
  sha: string;
  size: number;
  binary: boolean;
  truncated: boolean;
  content: string | null;
};

export type GitPerson = { name: string; email: string; date: string; username?: string | null };

export type Commit = {
  sha: string;
  parents: string[];
  message: string;
  author: GitPerson;
  committer: GitPerson;
};

export type CommitPage = { commits: Commit[]; has_more: boolean };

export type FileStatus = "added" | "modified" | "deleted" | "renamed";

export type CommitFile = {
  path: string;
  old_path: string | null;
  status: FileStatus;
  additions: number;
  deletions: number;
  binary: boolean;
  patch: string | null;
};

export type CommitDetail = {
  commit: Commit;
  stats: { additions: number; deletions: number };
  files: CommitFile[];
};

/** A change made in the browser, committed by the Git server. */
export type FileChange =
  | { action: "upsert"; path: string; content_base64: string }
  | { action: "delete"; path: string };

// ---- Mutation results --------------------------------------------------------

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
