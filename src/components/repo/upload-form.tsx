import { Link, useActionData, useNavigation, useSubmit } from "react-router";
import { File as FileIcon, FolderUp, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { FormMessage } from "@/components/ui/form";
import { formatBytes } from "@/lib/format";
import type { ActionResult } from "@/lib/types";
import { CommitFields } from "./commit-fields";

type Picked = { file: File; path: string };

const MAX_BYTES = 9 * 1024 * 1024;

/** Things that shouldn't be uploaded by accident: VCS folders, dependencies, OS junk and secrets. */
function shouldSkip(path: string) {
  return (
    /(^|\/)(\.git|node_modules)(\/|$)/.test(path) ||
    /(^|\/)(\.DS_Store|Thumbs\.db)$/.test(path) ||
    /(^|\/)\.env(\.(?!example$)[^/]*)?$/.test(path)
  );
}

async function readEntry(entry: FileSystemEntry, prefix = ""): Promise<Picked[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
    return [{ file, path: prefix + file.name }];
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const children: FileSystemEntry[] = [];
  // readEntries returns results in batches until it returns an empty array.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (!batch.length) break;
    children.push(...batch);
  }
  const nested = await Promise.all(children.map((c) => readEntry(c, `${prefix}${entry.name}/`)));
  return nested.flat();
}

export function UploadForm({
  branch,
  parentSha,
  dir,
  cancelHref,
}: {
  branch: string;
  parentSha: string | null;
  dir: string;
  cancelHref: string;
}) {
  const state = useActionData() as ActionResult | undefined;
  const submit = useSubmit();
  const pending = useNavigation().state === "submitting";
  const [files, setFiles] = useState<Picked[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const total = files.reduce((sum, f) => sum + f.file.size, 0);

  function add(picked: Picked[]) {
    const keep = picked.filter((p) => !shouldSkip(p.path));
    setSkipped((n) => n + picked.length - keep.length);
    setFiles((current) => {
      const byPath = new Map(current.map((f) => [f.path, f]));
      for (const p of keep) byPath.set(p.path, p);
      return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
    });
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const entries = [...e.dataTransfer.items].map((i) => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
    if (entries.length) add((await Promise.all(entries.map((en) => readEntry(en)))).flat());
    else add([...e.dataTransfer.files].map((file) => ({ file, path: file.name })));
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    add([...(e.target.files ?? [])].map((file) => ({ file, path: file.webkitRelativePath || file.name })));
    e.target.value = "";
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    for (const f of files) data.append("files", f.file, f.file.name);
    data.set("paths", JSON.stringify(files.map((f) => f.path)));
    void submit(data, { method: "post", encType: "multipart/form-data" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="branch" value={branch} />
      <input type="hidden" name="parent_sha" value={parentSha ?? ""} />
      <input type="hidden" name="dir" value={dir} />

      <h1 className="text-xl font-semibold">
        Upload files{dir && <span className="font-normal text-fg-muted"> to {dir}/</span>}
      </h1>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging ? "border-accent bg-accent-soft" : "border-line bg-canvas-subtle"
        }`}
      >
        <Upload className="size-8 text-fg-subtle" />
        <p className="text-lg font-semibold">Drag files or folders here</p>
        <p className="text-sm text-fg-muted">
          or{" "}
          <button type="button" className="text-link hover:underline" onClick={() => fileInput.current?.click()}>
            choose files
          </button>{" "}
          ·{" "}
          <button type="button" className="text-link hover:underline" onClick={() => folderInput.current?.click()}>
            choose a folder
          </button>
        </p>
        <input ref={fileInput} type="file" multiple hidden onChange={onPick} />
        <input
          ref={folderInput}
          type="file"
          multiple
          hidden
          onChange={onPick}
          {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        />
      </div>

      {skipped > 0 && (
        <p className="text-xs text-fg-muted">
          Skipped {skipped} file{skipped === 1 ? "" : "s"} such as .git, node_modules or .env, which usually shouldn&apos;t be committed.
        </p>
      )}

      {files.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-canvas-subtle px-4 py-2 text-sm">
            <span>
              {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(total)}
            </span>
            <button type="button" className="text-xs text-fg-muted hover:text-danger" onClick={() => setFiles([])}>
              Clear all
            </button>
          </div>
          <ul className="max-h-80 divide-y divide-line-muted overflow-y-auto text-sm">
            {files.map((f) => (
              <li key={f.path} className="flex items-center gap-2 px-4 py-1.5">
                <FileIcon className="size-4 shrink-0 text-fg-muted" />
                <span className="truncate font-mono text-xs">{f.path}</span>
                <span className="ml-auto shrink-0 text-xs text-fg-muted">{formatBytes(f.file.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.path}`}
                  className="rounded p-0.5 text-fg-subtle hover:text-danger"
                  onClick={() => setFiles((cur) => cur.filter((x) => x.path !== f.path))}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {total > MAX_BYTES && (
        <p className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm">
          That&apos;s {formatBytes(total)}. Browser uploads are limited to 9 MB; push bigger changes with Git.
        </p>
      )}

      <CommitFields branch={branch} placeholder={files.length === 1 ? `Add ${files[0].file.name}` : "Add files via upload"} />
      <FormMessage state={state} />
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending || !files.length || total > MAX_BYTES}>
          {pending ? "Committing…" : "Commit changes"}
        </button>
        <Link to={cancelHref} className="btn">
          Cancel
        </Link>
        <span className="ml-auto hidden items-center gap-1 text-xs text-fg-muted sm:flex">
          <FolderUp className="size-3.5" /> Folder structure is kept.
        </span>
      </div>
    </form>
  );
}
