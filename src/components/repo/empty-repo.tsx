import { Link } from "react-router";
import { FilePlus2, Upload } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { cloneUrl } from "@/lib/data/git";
import { repoUrl } from "@/lib/paths";

function Snippet({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="relative rounded-md border border-line bg-canvas-subtle">
        <pre className="overflow-x-auto p-4 pr-12 font-mono text-xs leading-6">{code}</pre>
        <div className="absolute top-2 right-2">
          <CopyButton value={code} label={`Copy: ${title}`} />
        </div>
      </div>
    </div>
  );
}

/** Quick setup for a repository without commits, like GitHub's. */
export function EmptyRepo({
  owner,
  name,
  defaultBranch,
  isOwner,
}: {
  owner: string;
  name: string;
  defaultBranch: string;
  isOwner: boolean;
}) {
  const url = cloneUrl(owner, name);

  if (!isOwner) {
    return (
      <div className="card px-6 py-16 text-center">
        <h2 className="text-lg font-semibold">This repository is empty.</h2>
        <p className="mt-1 text-fg-muted">Nothing has been pushed to it yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-accent-soft px-5 py-4">
          <h2 className="font-semibold">Quick setup</h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            Push code from your computer, or start in the browser.
          </p>
          <div className="mt-3 flex gap-1.5">
            <input readOnly value={url} className="input !h-8 max-w-xl font-mono text-xs" aria-label="Clone URL" />
            <CopyButton value={url} label="Copy clone URL" className="!h-8" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link to={repoUrl(owner, name, "new", defaultBranch)} className="btn btn-sm">
              <FilePlus2 className="size-3.5" /> Create a new file
            </Link>
            <Link to={repoUrl(owner, name, "upload", defaultBranch)} className="btn btn-sm">
              <Upload className="size-3.5" /> Upload files
            </Link>
          </div>
        </div>
        <div className="space-y-6 p-5">
          <Snippet
            title="Create a new repository on the command line"
            code={`echo "# ${name}" >> README.md\ngit init\ngit add README.md\ngit commit -m "first commit"\ngit branch -M ${defaultBranch}\ngit remote add origin ${url}\ngit push -u origin ${defaultBranch}`}
          />
          <Snippet
            title="Or push an existing repository from the command line"
            code={`git remote add origin ${url}\ngit branch -M ${defaultBranch}\ngit push -u origin ${defaultBranch}`}
          />
          <p className="text-sm text-fg-muted">
            When Git asks for a password, use a{" "}
            <Link to="/settings/tokens" className="text-link hover:underline">
              personal access token
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
