import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { FileCode2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { getCommit } from "@/lib/data/git";
import { parsePatch } from "@/lib/diff";
import { formatDate, pluralize, shortSha, timeAgo } from "@/lib/format";
import { blobUrl, commitUrl, treeUrl } from "@/lib/paths";
import { loadRepo, notFound } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import type { CommitFile } from "@/lib/types";

export async function loader({ params }: LoaderFunctionArgs) {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  const detail = await getCommit(ctx.owner, ctx.name, params.sha ?? "");
  if (!detail) throw notFound();
  return { ctx, detail };
}

const STATUS_STYLE: Record<CommitFile["status"], string> = {
  added: "text-ok",
  modified: "text-warn",
  deleted: "text-danger",
  renamed: "text-accent",
};

export default function CommitPage() {
  const { ctx, detail } = useLoaderData<typeof loader>();
  const { commit, stats, files } = detail;
  const [summary, ...rest] = commit.message.split("\n");
  const body = rest.join("\n").trim();
  const who = commit.author.username ?? commit.author.name;

  return (
    <div className="space-y-6">
      <title>{`${summary} · ${ctx.owner}/${ctx.name}@${shortSha(commit.sha)} · ${SITE_NAME}`}</title>
      <header className="card overflow-hidden">
        <div className="px-5 py-4">
          <h1 className="text-xl font-semibold break-words">{summary}</h1>
          {body && <pre className="mt-3 font-sans text-sm whitespace-pre-wrap text-fg-muted">{body}</pre>}
          <div className="mt-3">
            <Link to={treeUrl(ctx.owner, ctx.name, commit.sha)} className="btn btn-sm">
              Browse files
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-canvas-subtle px-5 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Avatar name={who} size={20} />
            {commit.author.username ? (
              <Link to={`/${commit.author.username}`} className="font-semibold hover:underline">
                {commit.author.username}
              </Link>
            ) : (
              <span className="font-semibold">{commit.author.name}</span>
            )}
            <span className="text-fg-muted">
              committed{" "}
              <time dateTime={commit.author.date} title={formatDate(commit.author.date)}>
                {timeAgo(commit.author.date)}
              </time>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-fg-muted sm:ml-auto">
            {commit.parents.length > 0 && (
              <span>
                {commit.parents.length === 1 ? "1 parent" : `${commit.parents.length} parents`}{" "}
                {commit.parents.map((p) => (
                  <Link key={p} to={commitUrl(ctx.owner, ctx.name, p)} className="ml-1 font-mono text-link hover:underline">
                    {shortSha(p)}
                  </Link>
                ))}
              </span>
            )}
            <span className="flex items-center gap-1">
              commit <code className="font-mono text-fg">{shortSha(commit.sha)}</code>
              <CopyButton value={commit.sha} label="Copy full SHA" />
            </span>
          </div>
        </div>
      </header>

      <p className="text-sm text-fg-muted">
        Showing <strong className="text-fg">{pluralize(files.length, "changed file")}</strong> with{" "}
        <strong className="text-ok">{pluralize(stats.additions, "addition")}</strong> and{" "}
        <strong className="text-danger">{pluralize(stats.deletions, "deletion")}</strong>.
      </p>

      <nav className="card divide-y divide-line-muted text-sm" aria-label="Changed files">
        {files.map((f) => (
          <a key={f.path} href={`#diff-${encodeURIComponent(f.path)}`} className="flex items-center gap-2 px-4 py-2 hover:bg-canvas-subtle">
            <FileCode2 className={`size-4 ${STATUS_STYLE[f.status]}`} />
            <span className="truncate font-mono text-xs">{f.old_path && f.status === "renamed" ? `${f.old_path} → ${f.path}` : f.path}</span>
            <span className="ml-auto font-mono text-xs">
              <span className="text-ok">+{f.additions}</span> <span className="text-danger">−{f.deletions}</span>
            </span>
          </a>
        ))}
      </nav>

      {files.map((f) => (
        <FileDiff key={f.path} file={f} owner={ctx.owner} repo={ctx.name} sha={commit.sha} />
      ))}
    </div>
  );
}

function FileDiff({ file, owner, repo, sha }: { file: CommitFile; owner: string; repo: string; sha: string }) {
  const rows = file.patch ? parsePatch(file.patch) : [];
  return (
    <section id={`diff-${encodeURIComponent(file.path)}`} className="card scroll-mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas-subtle px-4 py-2 text-sm">
        <span className={`label-pill capitalize ${STATUS_STYLE[file.status]}`}>{file.status}</span>
        <span className="min-w-0 truncate font-mono text-xs font-semibold">
          {file.old_path && file.status === "renamed" ? `${file.old_path} → ${file.path}` : file.path}
        </span>
        <span className="font-mono text-xs">
          <span className="text-ok">+{file.additions}</span> <span className="text-danger">−{file.deletions}</span>
        </span>
        {file.status !== "deleted" && (
          <Link to={blobUrl(owner, repo, sha, file.path)} className="btn btn-sm ml-auto">
            View file
          </Link>
        )}
      </div>
      {file.binary ? (
        <p className="px-4 py-6 text-center text-sm text-fg-muted">Binary file not shown.</p>
      ) : !rows.length ? (
        <p className="px-4 py-6 text-center text-sm text-fg-muted">
          {file.additions + file.deletions > 0 ? "This diff is too large to show." : "No content changes."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="diff-table">
            <tbody>
              {rows.map((row, i) =>
                row.kind === "hunk" ? (
                  <tr key={i} className="hunk">
                    <td colSpan={3}>{row.text}</td>
                  </tr>
                ) : (
                  <tr key={i} className={row.kind === "add" ? "add" : row.kind === "del" ? "del" : ""}>
                    <td className="num">{row.oldLine ?? ""}</td>
                    <td className="num">{row.newLine ?? ""}</td>
                    <td>
                      <span className="mr-2 inline-block w-2 text-fg-muted select-none">{row.kind === "add" ? "+" : row.kind === "del" ? "-" : " "}</span>
                      {row.text}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
