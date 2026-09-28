import { Link } from "react-router";
import { Check, ChevronDown, GitBranch, Tag } from "lucide-react";
import { useState } from "react";
import { Menu } from "@/components/ui/menu";
import { blobUrl, commitsUrl, treeUrl } from "@/lib/paths";

type Kind = "tree" | "blob" | "commits";

export function BranchSelect({
  owner,
  repo,
  current,
  branches,
  tags,
  defaultBranch,
  kind,
  path,
}: {
  owner: string;
  repo: string;
  current: string;
  branches: string[];
  tags: string[];
  defaultBranch: string;
  kind: Kind;
  path: string;
}) {
  const [tab, setTab] = useState<"branches" | "tags">(tags.includes(current) ? "tags" : "branches");
  const [filter, setFilter] = useState("");
  const isTag = tags.includes(current);
  const list = (tab === "branches" ? branches : tags).filter((n) => n.toLowerCase().includes(filter.toLowerCase()));

  const hrefFor = (ref: string) =>
    kind === "blob" ? blobUrl(owner, repo, ref, path) : kind === "commits" ? commitsUrl(owner, repo, ref, path) : treeUrl(owner, repo, ref, path);

  const label = /^[0-9a-f]{40}$/i.test(current) ? current.slice(0, 7) : current;

  return (
    <Menu
      label="Switch branches or tags"
      align="left"
      triggerClassName="btn max-w-60"
      panelClassName="w-72"
      trigger={
        <>
          {isTag ? <Tag className="size-4 text-fg-muted" /> : <GitBranch className="size-4 text-fg-muted" />}
          <span className="truncate font-semibold">{label}</span>
          <ChevronDown className="size-4 text-fg-muted" />
        </>
      }
    >
      {(close) => (
        <div>
          <div className="px-3 pt-1.5 pb-2 text-xs font-semibold">Switch branches/tags</div>
          <div className="px-3 pb-2">
            <input
              autoFocus
              className="input !h-8 text-sm"
              placeholder={tab === "branches" ? "Find a branch…" : "Find a tag…"}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex border-b border-line-muted px-3 text-xs">
            {(["branches", "tags"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 px-2 py-1.5 capitalize ${tab === t ? "border-accent font-semibold" : "border-transparent text-fg-muted"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {list.length === 0 && <li className="px-3 py-2 text-sm text-fg-muted">Nothing to show</li>}
            {list.map((name) => (
              <li key={name}>
                <Link
                  to={hrefFor(name)}
                  onClick={close}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-canvas-inset"
                  role="menuitem"
                >
                  <Check className={`size-4 shrink-0 ${name === current ? "text-fg" : "invisible"}`} />
                  <span className="truncate">{name}</span>
                  {name === defaultBranch && <span className="label-pill ml-auto">default</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Menu>
  );
}
