import { Link } from "react-router";
import { GitBranch, Link2, Tag } from "lucide-react";
import { archiveUrl, cloneUrl } from "@/lib/data/git";
import { pluralize } from "@/lib/format";
import { encodePath, repoUrl } from "@/lib/paths";
import type { RepoContext } from "@/lib/repo-context";
import type { Commit, EntryCommit, Refs, Tree } from "@/lib/types";
import { AddFileMenu } from "./add-file-menu";
import { BranchSelect } from "./branch-select";
import { Breadcrumbs } from "./breadcrumbs";
import { CloneMenu } from "./clone-menu";
import { FileTable, LatestCommitBar } from "./file-table";
import { LanguageBar } from "./language-bar";
import { ReadmeCard } from "./readme-card";

export type TreeViewData = {
  refs: Refs;
  refName: string;
  path: string;
  isBranch: boolean;
  tree: Tree;
  entryCommits: Record<string, EntryCommit>;
  latest: Commit | null;
  languages: Record<string, number>;
  readme: { path: string; content: string } | null;
};

/** The Code tab: file list for a folder at a ref, plus README; at the root also the About sidebar. */
export function TreeView({ ctx, data }: { ctx: RepoContext; data: TreeViewData }) {
  const { owner, name, repo, isOwner } = ctx;
  const { refs, refName, path, isBranch, tree, entryCommits, latest, languages, readme } = data;
  const isRoot = path === "";
  const canEdit = isOwner && isBranch;
  const refPath = path ? `${encodePath(refName)}/${encodePath(path)}` : encodePath(refName);
  const archive = archiveUrl(owner, name, refName);

  const toolbar = (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <BranchSelect
        owner={owner}
        repo={name}
        current={refName}
        branches={refs.branches.map((b) => b.name)}
        tags={refs.tags.map((t) => t.name)}
        defaultBranch={refs.default_branch}
        kind="tree"
        path={path}
      />
      {isRoot ? (
        <div className="hidden items-center gap-4 px-2 text-sm sm:flex">
          <Link to={repoUrl(owner, name, "branches")} className="flex items-center gap-1 text-fg-muted hover:text-link">
            <GitBranch className="size-4" />
            <strong className="text-fg">{refs.branches.length}</strong> {refs.branches.length === 1 ? "branch" : "branches"}
          </Link>
          <Link to={repoUrl(owner, name, "branches") + "#tags"} className="flex items-center gap-1 text-fg-muted hover:text-link">
            <Tag className="size-4" />
            <strong className="text-fg">{refs.tags.length}</strong> {refs.tags.length === 1 ? "tag" : "tags"}
          </Link>
        </div>
      ) : (
        <Breadcrumbs owner={owner} repo={name} refName={refName} path={path} />
      )}
      <div className="ml-auto flex items-center gap-2">
        {canEdit && <AddFileMenu newHref={repoUrl(owner, name, "new", refPath)} uploadHref={repoUrl(owner, name, "upload", refPath)} />}
        {isRoot && (
          <CloneMenu
            cloneUrl={cloneUrl(owner, name)}
            archive={
              archive
                ? { url: archive, filename: `${name}-${refName.replace(/[^A-Za-z0-9._-]+/g, "-")}.zip`, auth: repo.visibility === "private" }
                : null
            }
          />
        )}
      </div>
    </div>
  );

  const files = (
    <>
      <FileTable
        owner={owner}
        repo={name}
        refName={refName}
        path={path}
        entries={tree.entries}
        commits={entryCommits}
        header={<LatestCommitBar owner={owner} repo={name} refName={refName} path={path} commit={latest} />}
      />
      {readme && (
        <ReadmeCard
          owner={owner}
          repo={name}
          refName={refName}
          path={readme.path}
          content={readme.content}
          canEdit={canEdit}
          isPrivate={repo.visibility === "private"}
        />
      )}
    </>
  );

  if (!isRoot) {
    return (
      <div>
        {toolbar}
        {files}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_296px]">
      <div className="min-w-0">
        {toolbar}
        {files}
      </div>
      <aside className="space-y-6 lg:pt-1">
        <section>
          <h2 className="mb-3 text-base font-semibold">About</h2>
          {repo.description ? <p className="text-[15px]">{repo.description}</p> : <p className="text-fg-muted italic">No description provided.</p>}
          {repo.website_url && (
            <a
              href={repo.website_url}
              rel="nofollow noopener noreferrer"
              className="mt-3 flex items-center gap-2 text-sm font-semibold break-all text-link hover:underline"
            >
              <Link2 className="size-4 shrink-0" />
              {repo.website_url.replace(/^https?:\/\//, "")}
            </a>
          )}
          {repo.topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {repo.topics.map((t) => (
                <Link key={t} to={`/explore?q=${encodeURIComponent(t)}`} className="topic">
                  {t}
                </Link>
              ))}
            </div>
          )}
          <ul className="mt-4 space-y-2 text-sm text-fg-muted">
            <li className="flex items-center gap-2">
              <GitBranch className="size-4" /> {pluralize(refs.branches.length, "branch", "branches")}
            </li>
            <li className="flex items-center gap-2">
              <Tag className="size-4" /> {pluralize(refs.tags.length, "tag")}
            </li>
          </ul>
        </section>
        <div className="border-t border-line-muted pt-6">
          <LanguageBar totals={languages} />
        </div>
      </aside>
    </div>
  );
}
