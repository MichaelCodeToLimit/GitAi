import { findReadme } from "@/components/repo/readme-card";
import type { TreeViewData } from "@/components/repo/tree-view";
import { getBlob, getCommits, getLanguages, getTree, getTreeCommits } from "@/lib/data/git";
import type { RepoContext } from "@/lib/repo-context";
import type { Refs } from "@/lib/types";

/** Everything the Code tab needs for one folder, fetched in parallel. Null if the folder doesn't exist. */
export async function loadTreeView(
  ctx: RepoContext,
  refs: Refs,
  refName: string,
  path: string,
  isBranch: boolean,
): Promise<TreeViewData | null> {
  const isRoot = path === "";
  const [tree, entryCommits, latest, languages] = await Promise.all([
    getTree(ctx.owner, ctx.name, refName, path),
    getTreeCommits(ctx.owner, ctx.name, refName, path),
    getCommits(ctx.owner, ctx.name, { ref: refName, path, perPage: 1 }).catch(() => null),
    isRoot ? getLanguages(ctx.owner, ctx.name, refName) : Promise.resolve({}),
  ]);
  if (!tree) return null;

  const readmeEntry = findReadme(tree.entries);
  const readmeBlob = readmeEntry ? await getBlob(ctx.owner, ctx.name, refName, readmeEntry.path).catch(() => null) : null;

  return {
    refs,
    refName,
    path,
    isBranch,
    tree,
    entryCommits,
    latest: latest?.commits[0] ?? null,
    languages,
    readme: readmeEntry && readmeBlob?.content ? { path: readmeEntry.path, content: readmeBlob.content } : null,
  };
}
