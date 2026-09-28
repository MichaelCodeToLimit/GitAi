import { Trash2 } from "lucide-react";
import { useFetcher } from "react-router";

/** Deletes a file with a commit. Posts to the blob page's action. */
export function DeleteFileButton({ branch, path }: { branch: string; path: string }) {
  const fetcher = useFetcher<{ ok: false; error: string }>();
  const busy = fetcher.state !== "idle";

  return (
    <fetcher.Form
      method="post"
      onSubmit={(e) => {
        if (!confirm(`Delete ${path}? This creates a commit on ${branch}.`)) e.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="intent" value="delete" />
      {fetcher.data && !fetcher.data.ok && <span className="text-xs text-danger">{fetcher.data.error}</span>}
      <button type="submit" disabled={busy} className="btn btn-sm btn-danger !px-2" aria-label="Delete file" title="Delete file">
        <Trash2 className="size-4" />
      </button>
    </fetcher.Form>
  );
}
