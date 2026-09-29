import { supabase } from "@/lib/supabase";
import type { ActionResult, RepoListItem, Repository, Viewer, Visibility } from "@/lib/types";
import { REPO_NAME_PATTERN, USERNAME_PATTERN } from "@/lib/validation";
import { demoReposForOwner, demoRepository, demoSearch } from "./demo";
import { deleteGitRepository, initGitRepository } from "./git";
import { DEMO_WRITE_ERROR, isDemo } from "./mode";

const OWNER_EMBED = "owner:profiles!repositories_owner_id_fkey(id, username, display_name, avatar_url)";
const REPO_COLUMNS = `id, owner_id, name, description, website_url, topics, visibility, default_branch, is_empty, created_at, updated_at, pushed_at, ${OWNER_EMBED}`;
const LIST_COLUMNS = `id, name, description, topics, visibility, updated_at, pushed_at, ${OWNER_EMBED}`;

export async function getRepository(owner: string, name: string): Promise<Repository | null> {
  if (!USERNAME_PATTERN.test(owner) || !REPO_NAME_PATTERN.test(name)) return null;
  if (isDemo) return demoRepository(owner, name);
  const { data, error } = await supabase()
    .rpc("get_repository", { p_owner: owner, p_name: name })
    .select(REPO_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return (data as Repository | null) ?? null;
}

export async function listReposForOwner(ownerId: string): Promise<RepoListItem[]> {
  if (isDemo) return demoReposForOwner(ownerId);
  const { data, error } = await supabase()
    .from("repositories")
    .select(LIST_COLUMNS)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as RepoListItem[];
}

export type RepoSort = "updated" | "newest" | "name";

/** Builds a prefix-matching tsquery ("sta sit" -> "sta:* & sit:*") from free text. */
function toTsQuery(q: string) {
  const words = q.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.slice(0, 8).map((w) => `${w}:*`).join(" & ");
}

export async function searchRepositories(opts: {
  q?: string;
  sort?: RepoSort;
  page?: number;
  perPage?: number;
}): Promise<{ items: RepoListItem[]; total: number }> {
  const sort = opts.sort ?? "updated";
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? 20;
  if (isDemo) return demoSearch({ q: opts.q, sort, page, perPage });

  let query = supabase().from("repositories").select(LIST_COLUMNS, { count: "exact" }).eq("visibility", "public");
  const tsquery = opts.q ? toTsQuery(opts.q) : "";
  if (tsquery) query = query.textSearch("search", tsquery, { config: "english" });
  if (sort === "name") query = query.order("name", { ascending: true });
  else if (sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("updated_at", { ascending: false });

  const { data, error, count } = await query.range((page - 1) * perPage, page * perPage - 1);
  if (error) throw error;
  return { items: (data ?? []) as unknown as RepoListItem[], total: count ?? 0 };
}

export type NewRepository = {
  name: string;
  description: string | null;
  visibility: Visibility;
  readme: boolean;
};

export async function createRepository(viewer: Viewer, input: NewRepository): Promise<ActionResult<{ name: string }>> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const { data, error } = await supabase()
    .from("repositories")
    .insert({
      name: input.name,
      description: input.description,
      visibility: input.visibility,
      default_branch: "main",
    })
    .select("id, name")
    .single();
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already have a repository with that name.", fieldErrors: { name: "Already exists" } };
    }
    return { ok: false, error: error.message };
  }

  const init = await initGitRepository(viewer.profile.username, data.name, {
    readme: input.readme,
    description: input.description,
  });
  if (!init.ok) {
    // The row exists and the Git server creates the repository on first push, so this isn't fatal.
    return { ok: true, data: { name: data.name }, message: `Repository created, but setup didn't finish: ${init.error}` };
  }
  return { ok: true, data: { name: data.name } };
}

export type RepositoryUpdate = {
  name: string;
  description: string | null;
  website_url: string | null;
  topics: string[];
  visibility: Visibility;
  default_branch: string;
};

export async function updateRepository(repo: Repository, update: RepositoryUpdate): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  const { data, error } = await supabase().from("repositories").update(update).eq("id", repo.id).select("id");
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already have a repository with that name.", fieldErrors: { name: "Already exists" } };
    }
    return { ok: false, error: error.message };
  }
  if (!data?.length) return { ok: false, error: "You don't have permission to change this repository." };
  return { ok: true, message: "Settings saved." };
}

export async function deleteRepository(repo: Repository): Promise<ActionResult> {
  if (isDemo) return { ok: false, error: DEMO_WRITE_ERROR };
  // The Git server checks ownership, deletes the row and moves the repository to trash.
  return deleteGitRepository(repo.owner.username, repo.name);
}
