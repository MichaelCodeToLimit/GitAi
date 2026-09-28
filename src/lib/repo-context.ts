import { data } from "react-router";
import { getRefs } from "@/lib/data/git";
import { getRepository } from "@/lib/data/repos";
import { getViewer } from "@/lib/data/session";
import { splitRefAndPath } from "@/lib/paths";
import type { Refs, Repository, Viewer } from "@/lib/types";

export type RepoContext = {
  repo: Repository;
  owner: string;
  name: string;
  viewer: Viewer | null;
  isOwner: boolean;
};

export const notFound = () => data("Not found", { status: 404 });

// Loaders for a repo's layout and its child page run in parallel; share one fetch per navigation.
const inflight = new Map<string, Promise<unknown>>();
function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = load().finally(() => setTimeout(() => inflight.delete(key), 0));
  inflight.set(key, promise);
  return promise;
}

/** Loads the repository for a route, or throws a 404. */
export async function loadRepo(owner: string, name: string): Promise<RepoContext> {
  const [repo, viewer] = await Promise.all([
    once(`repo:${owner}/${name}`.toLowerCase(), () => getRepository(owner, name)),
    getViewer(),
  ]);
  if (!repo) throw notFound();
  return { repo, owner: repo.owner.username, name: repo.name, viewer, isOwner: viewer?.id === repo.owner_id };
}

export function loadRefs(owner: string, name: string): Promise<Refs | null> {
  return once(`refs:${owner}/${name}`.toLowerCase(), () => getRefs(owner, name));
}

/** Resolves "<ref>/<path>" splat segments against the repository's branches and tags. */
export async function resolveRef(ctx: RepoContext, splat: string) {
  const refs = await loadRefs(ctx.owner, ctx.name);
  if (!refs || refs.empty) throw notFound();
  const names = [...refs.branches.map((b) => b.name), ...refs.tags.map((t) => t.name)];
  const split = splitRefAndPath(splat.split("/").filter(Boolean), names);
  if (!split) throw notFound();
  const branch = refs.branches.find((b) => b.name === split.ref);
  return { refs, ref: split.ref, path: split.path, isBranch: Boolean(branch), branchSha: branch?.sha ?? null };
}

/**
 * For browser-editing pages (new, edit, upload): the owner and a branch are required.
 * An empty repository accepts commits to its default branch, which the first commit creates.
 */
export async function loadWriteContext(owner: string, name: string, splat: string) {
  const ctx = await loadRepo(owner, name);
  if (!ctx.isOwner) throw notFound();
  const refs = await loadRefs(ctx.owner, ctx.name);
  if (!refs || refs.empty) {
    const [first, ...rest] = splat.split("/").filter(Boolean);
    if (first !== ctx.repo.default_branch) throw notFound();
    return { ctx, branch: first, path: rest.join("/"), branchSha: null as string | null };
  }
  const resolved = await resolveRef(ctx, splat);
  if (!resolved.isBranch) throw notFound(); // Tags and commits can't be edited.
  return { ctx, branch: resolved.ref, path: resolved.path, branchSha: resolved.branchSha };
}
