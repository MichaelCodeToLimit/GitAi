import { Link } from "react-router";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import type { RepoListItem } from "@/lib/types";

export function VisibilityPill({ visibility }: { visibility: "public" | "private" }) {
  return <span className="label-pill capitalize">{visibility}</span>;
}

export function RepoListEntry({ repo, showOwner = true }: { repo: RepoListItem; showOwner?: boolean }) {
  const href = `/${repo.owner.username}/${repo.name}`;
  return (
    <li className="flex flex-col gap-2 border-b border-line-muted py-6 first:pt-2 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        {showOwner && <Avatar src={repo.owner.avatar_url} name={repo.owner.username} size={20} />}
        <h3 className="text-xl font-semibold break-all">
          <Link to={href} className="text-link hover:underline">
            {showOwner && <span className="font-normal">{repo.owner.username} / </span>}
            {repo.name}
          </Link>
        </h3>
        <VisibilityPill visibility={repo.visibility} />
      </div>
      {repo.description && <p className="max-w-3xl text-fg-muted">{repo.description}</p>}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repo.topics.slice(0, 6).map((t) => (
            <Link key={t} to={`/explore?q=${encodeURIComponent(t)}`} className="topic">
              {t}
            </Link>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
        {repo.language && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full" style={{ background: repo.language.color }} />
            {repo.language.name}
          </span>
        )}
        <span>Updated {timeAgo(repo.pushed_at ?? repo.updated_at)}</span>
      </div>
    </li>
  );
}

export function RepoList({ repos, showOwner = true }: { repos: RepoListItem[]; showOwner?: boolean }) {
  return (
    <ul>
      {repos.map((r) => (
        <RepoListEntry key={r.id} repo={r} showOwner={showOwner} />
      ))}
    </ul>
  );
}
