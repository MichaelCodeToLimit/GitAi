import { Link } from "react-router";
import { BookOpen, Pencil } from "lucide-react";
import { MarkdownView } from "@/components/markdown/markdown";
import { dirname, encodePath, repoUrl } from "@/lib/paths";
import type { TreeEntry } from "@/lib/types";

const README = /^readme(\.(md|markdown|mdown|mkdn|txt|rst))?$/i;

export function findReadme(entries: TreeEntry[]) {
  const candidates = entries.filter((e) => e.type === "blob" && README.test(e.name));
  return candidates.find((e) => /\.(md|markdown|mdown|mkdn)$/i.test(e.name)) ?? candidates[0] ?? null;
}

export function ReadmeCard({
  owner,
  repo,
  refName,
  path,
  content,
  canEdit,
  isPrivate,
}: {
  owner: string;
  repo: string;
  refName: string;
  path: string;
  content: string;
  canEdit: boolean;
  isPrivate: boolean;
}) {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const isMarkdown = /\.(md|markdown|mdown|mkdn)$/i.test(name);

  return (
    <section className="card mt-4 overflow-hidden" id="readme">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <BookOpen className="size-4 text-fg-muted" />
        <h2 className="text-sm font-semibold">{name}</h2>
        {canEdit && (
          <Link
            to={repoUrl(owner, repo, "edit", `${encodePath(refName)}/${encodePath(path)}`)}
            className="ml-auto rounded-md p-1.5 text-fg-muted hover:bg-canvas-inset hover:text-fg"
            aria-label={`Edit ${name}`}
          >
            <Pencil className="size-4" />
          </Link>
        )}
      </div>
      <div className="px-6 py-6 md:px-8">
        {isMarkdown ? (
          <MarkdownView source={content} base={{ owner, repo, ref: refName, dir: dirname(path), isPrivate }} />
        ) : (
          <pre className="font-mono text-sm whitespace-pre-wrap">{content}</pre>
        )}
      </div>
    </section>
  );
}
