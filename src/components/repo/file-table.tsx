import { Link } from "react-router";
import { File, FileSymlink, Folder, FolderGit2, History } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { firstLine, formatDate, shortSha, timeAgo } from "@/lib/format";
import { blobUrl, commitUrl, commitsUrl, treeUrl } from "@/lib/paths";
import type { Commit, EntryCommit, TreeEntry } from "@/lib/types";

const ICONS = { tree: Folder, blob: File, submodule: FolderGit2, symlink: FileSymlink };

export function LatestCommitBar({
  owner,
  repo,
  refName,
  path,
  commit,
}: {
  owner: string;
  repo: string;
  refName: string;
  path: string;
  commit: Commit | null;
}) {
  if (!commit) return null;
  const who = commit.author.username ?? commit.author.name;
  return (
    <div className="flex items-center gap-3 rounded-t-md border-b border-line bg-canvas-subtle px-4 py-3 text-sm">
      <Avatar name={who} size={22} />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {commit.author.username ? (
          <Link to={`/${commit.author.username}`} className="shrink-0 font-semibold hover:underline">
            {commit.author.username}
          </Link>
        ) : (
          <span className="shrink-0 font-semibold">{commit.author.name}</span>
        )}
        <Link to={commitUrl(owner, repo, commit.sha)} className="truncate text-fg-muted hover:text-link hover:underline">
          {firstLine(commit.message)}
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-fg-muted">
        <Link to={commitUrl(owner, repo, commit.sha)} className="hidden font-mono hover:text-link sm:inline">
          {shortSha(commit.sha)}
        </Link>
        <time dateTime={commit.author.date} title={formatDate(commit.author.date)} className="hidden sm:inline">
          {timeAgo(commit.author.date)}
        </time>
        <Link to={commitsUrl(owner, repo, refName, path)} className="flex items-center gap-1 font-semibold text-fg hover:text-link">
          <History className="size-4" /> History
        </Link>
      </div>
    </div>
  );
}

export function FileTable({
  owner,
  repo,
  refName,
  path,
  entries,
  commits,
  header,
}: {
  owner: string;
  repo: string;
  refName: string;
  path: string;
  entries: TreeEntry[];
  commits: Record<string, EntryCommit>;
  header?: React.ReactNode;
}) {
  const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";

  return (
    <div className="card overflow-hidden">
      {header}
      <table className="w-full table-fixed text-sm">
        <tbody>
          {path && (
            <tr className="border-b border-line-muted hover:bg-canvas-subtle">
              <td colSpan={3} className="px-4 py-2">
                <Link to={treeUrl(owner, repo, refName, parent)} className="block font-mono text-fg-muted hover:text-link" aria-label="Parent folder">
                  ..
                </Link>
              </td>
            </tr>
          )}
          {entries.map((entry) => {
            const Icon = ICONS[entry.type] ?? File;
            const href = entry.type === "tree" ? treeUrl(owner, repo, refName, entry.path) : blobUrl(owner, repo, refName, entry.path);
            const c = commits[entry.name];
            return (
              <tr key={entry.path} className="border-b border-line-muted last:border-b-0 hover:bg-canvas-subtle">
                <td className="px-4 py-2 sm:w-[32%]">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`size-4 shrink-0 ${entry.type === "tree" ? "fill-current text-[#54aeff]" : "text-fg-muted"}`} />
                    {entry.type === "submodule" ? (
                      <span className="truncate">{entry.name}</span>
                    ) : (
                      <Link to={href} className="truncate hover:text-link hover:underline">
                        {entry.name}
                      </Link>
                    )}
                  </div>
                </td>
                <td className="hidden px-4 py-2 sm:table-cell">
                  {c && (
                    <Link to={commitUrl(owner, repo, c.sha)} className="block truncate text-fg-muted hover:text-link hover:underline">
                      {firstLine(c.message)}
                    </Link>
                  )}
                </td>
                <td className="w-28 px-4 py-2 text-right text-xs whitespace-nowrap text-fg-muted">
                  {c && (
                    <time dateTime={c.date} title={formatDate(c.date)}>
                      {timeAgo(c.date)}
                    </time>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
