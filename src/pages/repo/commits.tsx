import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { GitCommitVertical } from "lucide-react";
import { BranchSelect } from "@/components/repo/branch-select";
import { Avatar } from "@/components/ui/avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { getCommits } from "@/lib/data/git";
import { firstLine, formatDate, shortSha, timeAgo } from "@/lib/format";
import { commitsUrl, commitUrl, treeUrl } from "@/lib/paths";
import { loadRefs, loadRepo, notFound, resolveRef } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import type { Commit } from "@/lib/types";

const PER_PAGE = 30;

export async function loader({ params, request }: LoaderFunctionArgs) {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  const search = new URL(request.url).searchParams;
  const path = (search.get("path") ?? "").replace(/^\/+|\/+$/g, "");
  const page = Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1);

  const splat = params["*"] ?? "";
  if (!splat) {
    const refs = await loadRefs(ctx.owner, ctx.name);
    if (!refs || refs.empty) return { ctx, empty: true as const };
    const result = await getCommits(ctx.owner, ctx.name, { ref: refs.default_branch, path, page, perPage: PER_PAGE });
    if (!result) throw notFound();
    return { ctx, empty: false as const, refs, ref: refs.default_branch, path, page, result };
  }
  const { refs, ref } = await resolveRef(ctx, splat);
  const result = await getCommits(ctx.owner, ctx.name, { ref, path, page, perPage: PER_PAGE });
  if (!result) throw notFound();
  return { ctx, empty: false as const, refs, ref, path, page, result };
}

export default function CommitsPage() {
  const data = useLoaderData<typeof loader>();
  const { ctx } = data;
  if (data.empty) {
    return (
      <div className="card px-6 py-16 text-center">
        <title>{`Commits · ${ctx.owner}/${ctx.name} · ${SITE_NAME}`}</title>
        <h1 className="text-lg font-semibold">No commits yet</h1>
        <p className="mt-1 text-fg-muted">Commits show up here once something is pushed.</p>
      </div>
    );
  }

  const { refs, ref, path, page, result } = data;
  const groups = new Map<string, Commit[]>();
  for (const c of result.commits) {
    const day = formatDate(c.author.date);
    groups.set(day, [...(groups.get(day) ?? []), c]);
  }
  const pageHref = (p: number) => {
    const base = commitsUrl(ctx.owner, ctx.name, ref, path);
    return p > 1 ? `${base}${base.includes("?") ? "&" : "?"}page=${p}` : base;
  };

  return (
    <div className="space-y-5">
      <title>{`Commits · ${ctx.owner}/${ctx.name} · ${SITE_NAME}`}</title>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Commits</h1>
        <BranchSelect
          owner={ctx.owner}
          repo={ctx.name}
          current={ref}
          branches={refs.branches.map((b) => b.name)}
          tags={refs.tags.map((t) => t.name)}
          defaultBranch={refs.default_branch}
          kind="commits"
          path={path}
        />
        {path && (
          <p className="text-sm text-fg-muted">
            History for{" "}
            <Link to={treeUrl(ctx.owner, ctx.name, ref, path)} className="font-mono text-link hover:underline">
              {path}
            </Link>
          </p>
        )}
      </div>

      {result.commits.length === 0 ? (
        <p className="py-10 text-center text-fg-muted">No commits found.</p>
      ) : (
        [...groups.entries()].map(([day, commits]) => (
          <section key={day} className="relative pl-6">
            <div className="absolute top-0 bottom-0 left-[7px] w-px bg-line" aria-hidden="true" />
            <h2 className="relative mb-2 flex items-center gap-2 text-sm text-fg-muted">
              <GitCommitVertical className="absolute -left-6 size-4 bg-canvas text-fg-subtle" />
              Commits on {day}
            </h2>
            <ul className="card divide-y divide-line-muted">
              {commits.map((c) => (
                <CommitRow key={c.sha} owner={ctx.owner} repo={ctx.name} commit={c} />
              ))}
            </ul>
          </section>
        ))
      )}

      {(page > 1 || result.has_more) && (
        <nav className="flex justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link to={pageHref(page - 1)} className="btn btn-sm">
              Newer
            </Link>
          )}
          {result.has_more && (
            <Link to={pageHref(page + 1)} className="btn btn-sm">
              Older
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function CommitRow({ owner, repo, commit }: { owner: string; repo: string; commit: Commit }) {
  const [summary, ...rest] = commit.message.split("\n");
  const body = rest.join("\n").trim();
  const who = commit.author.username ?? commit.author.name;
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-canvas-subtle">
      <div className="min-w-0 flex-1">
        <Link to={commitUrl(owner, repo, commit.sha)} className="font-semibold break-words hover:text-link hover:underline">
          {firstLine(summary)}
        </Link>
        {body && (
          <details className="inline">
            <summary className="ml-2 inline cursor-pointer list-none rounded bg-canvas-inset px-1.5 text-xs text-fg-muted hover:text-fg" aria-label="Show full message">
              …
            </summary>
            <pre className="mt-2 font-sans text-sm whitespace-pre-wrap text-fg-muted">{body}</pre>
          </details>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-fg-muted">
          <Avatar name={who} size={16} />
          {commit.author.username ? (
            <Link to={`/${commit.author.username}`} className="font-semibold text-fg hover:underline">
              {commit.author.username}
            </Link>
          ) : (
            <span className="font-semibold text-fg">{commit.author.name}</span>
          )}
          committed
          <time dateTime={commit.author.date} title={new Date(commit.author.date).toLocaleString("en-US")}>
            {timeAgo(commit.author.date)}
          </time>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link to={commitUrl(owner, repo, commit.sha)} className="btn btn-sm font-mono">
          {shortSha(commit.sha)}
        </Link>
        <CopyButton value={commit.sha} label="Copy full SHA" />
        <Link to={treeUrl(owner, repo, commit.sha)} className="btn btn-sm hidden sm:inline-flex" title={`Browse the repository at ${shortSha(commit.sha)}`}>
          Browse
        </Link>
      </div>
    </li>
  );
}
