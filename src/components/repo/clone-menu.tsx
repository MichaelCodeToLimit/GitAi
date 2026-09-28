import { Link } from "react-router";
import { ChevronDown, Code2, FileArchive, KeyRound } from "lucide-react";
import { useState } from "react";
import { Menu } from "@/components/ui/menu";
import { CopyButton } from "@/components/ui/copy-button";
import { downloadFile } from "@/lib/download";

export function CloneMenu({
  cloneUrl,
  archive,
}: {
  cloneUrl: string;
  archive: { url: string; filename: string; auth: boolean } | null;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <Menu
      label="Clone or download"
      triggerClassName="btn btn-primary"
      panelClassName="w-[22rem] max-w-[calc(100vw-2rem)]"
      trigger={
        <>
          <Code2 className="size-4" /> Code <ChevronDown className="size-4" />
        </>
      }
    >
      <div className="space-y-2 px-3 py-2">
        <div className="text-sm font-semibold">Clone with HTTPS</div>
        <div className="flex gap-1.5">
          <input readOnly value={cloneUrl} className="input !h-8 font-mono text-xs" aria-label="Clone URL" onFocus={(e) => e.currentTarget.select()} />
          <CopyButton value={cloneUrl} label="Copy clone URL" className="!h-8" />
        </div>
        <p className="flex gap-1.5 text-xs text-fg-muted">
          <KeyRound className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Sign in with your username and a{" "}
            <Link to="/settings/tokens" className="text-link hover:underline">
              personal access token
            </Link>{" "}
            as the password.
          </span>
        </p>
      </div>
      {archive && (
        <>
          <div className="my-1 border-t border-line-muted" />
          {archive.auth ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-canvas-inset"
              onClick={() => downloadFile(archive.url, archive.filename).catch((e: Error) => setError(e.message))}
            >
              <FileArchive className="size-4 text-fg-muted" /> Download ZIP
            </button>
          ) : (
            <a href={archive.url} download={archive.filename} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-canvas-inset" role="menuitem">
              <FileArchive className="size-4 text-fg-muted" /> Download ZIP
            </a>
          )}
          {error && <p className="px-3 pb-2 text-xs text-danger">{error}</p>}
        </>
      )}
    </Menu>
  );
}
