import { Link, useLocation } from "react-router";
import { Code2, GitBranch, History, Settings } from "lucide-react";

export function RepoTabs({ base, isOwner }: { base: string; isOwner: boolean }) {
  const { pathname } = useLocation();
  // Compare case-insensitively: /Nova/Starlight and /nova/starlight are the same repository.
  const rest = pathname.toLowerCase().startsWith(base.toLowerCase()) ? pathname.slice(base.length) : "";
  const section = rest.split("/")[1] ?? "";

  const tabs = [
    { to: base, label: "Code", icon: Code2, active: ["", "tree", "blob", "new", "edit", "upload"].includes(section) },
    { to: `${base}/commits`, label: "Commits", icon: History, active: section === "commits" || section === "commit" },
    { to: `${base}/branches`, label: "Branches", icon: GitBranch, active: section === "branches" },
    ...(isOwner ? [{ to: `${base}/settings`, label: "Settings", icon: Settings, active: section === "settings" }] : []),
  ];

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]" aria-label="Repository">
      {tabs.map(({ to, label, icon: Icon, active }) => (
        <Link
          key={label}
          to={to}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-2 border-b-2 px-2 pt-1 pb-2.5 text-sm whitespace-nowrap ${
            active ? "border-accent font-semibold text-fg" : "border-transparent text-fg-muted hover:text-fg"
          }`}
        >
          <span className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-canvas-inset">
            <Icon className="size-4 text-fg-muted" />
            {label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
