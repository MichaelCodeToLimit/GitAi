import { Link } from "react-router";
import { treeUrl } from "@/lib/paths";

/** repo / src / lib / file.ts, each part linking to its folder. */
export function Breadcrumbs({ owner, repo, refName, path }: { owner: string; repo: string; refName: string; path: string }) {
  const parts = path.split("/").filter(Boolean);
  return (
    <nav aria-label="Path" className="flex min-w-0 flex-wrap items-center gap-1 text-base">
      <Link to={treeUrl(owner, repo, refName)} className="font-semibold text-link hover:underline">
        {repo}
      </Link>
      {parts.map((part, i) => {
        const last = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            <span className="text-fg-muted">/</span>
            {last ? (
              <span className="font-semibold break-all">{part}</span>
            ) : (
              <Link to={treeUrl(owner, repo, refName, parts.slice(0, i + 1).join("/"))} className="break-all text-link hover:underline">
                {part}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
