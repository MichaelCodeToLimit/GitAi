import { GitBranch } from "lucide-react";

/** The "Commit changes" box shared by the editor and the uploader. */
export function CommitFields({ branch, placeholder }: { branch: string; placeholder: string }) {
  return (
    <div className="card space-y-3 p-4">
      <h2 className="font-semibold">Commit changes</h2>
      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium">
          Commit message
        </label>
        <input id="message" name="message" className="input" placeholder={placeholder} maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Extended description <span className="font-normal text-fg-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="input !h-auto py-2"
          placeholder="Add more detail about this change…"
        />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-fg-muted">
        <GitBranch className="size-3.5" /> Commits directly to the <code className="font-mono text-fg">{branch}</code> branch.
      </p>
    </div>
  );
}
