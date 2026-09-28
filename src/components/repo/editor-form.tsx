import { Form, Link, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { treeUrl } from "@/lib/paths";
import type { ActionResult } from "@/lib/types";
import { CommitFields } from "./commit-fields";

export function EditorForm({
  owner,
  repo,
  branch,
  parentSha,
  dir,
  originalPath,
  initialName,
  initialContent,
  cancelHref,
}: {
  owner: string;
  repo: string;
  branch: string;
  parentSha: string | null;
  dir: string;
  originalPath: string | null;
  initialName: string;
  initialContent: string;
  cancelHref: string;
}) {
  const result = useActionData() as ActionResult | undefined;
  const navigation = useNavigation();
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(initialContent);
  const fullPath = [dir, name].filter(Boolean).join("/");

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd } = el;
    setContent(`${content.slice(0, selectionStart)}  ${content.slice(selectionEnd)}`);
    requestAnimationFrame(() => el.setSelectionRange(selectionStart + 2, selectionStart + 2));
  }

  return (
    <Form method="post" className="space-y-4">
      <input type="hidden" name="branch" value={branch} />
      <input type="hidden" name="parent_sha" value={parentSha ?? ""} />
      <input type="hidden" name="dir" value={dir} />
      <input type="hidden" name="original_path" value={originalPath ?? ""} />

      <div className="flex flex-wrap items-center gap-1 text-base">
        <Link to={treeUrl(owner, repo, branch)} className="font-semibold text-link hover:underline">
          {repo}
        </Link>
        {dir
          .split("/")
          .filter(Boolean)
          .map((part, i, parts) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-fg-muted">/</span>
              <Link to={treeUrl(owner, repo, branch, parts.slice(0, i + 1).join("/"))} className="text-link hover:underline">
                {part}
              </Link>
            </span>
          ))}
        <span className="text-fg-muted">/</span>
        <input
          name="filename"
          aria-label="File name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your file…"
          className="input !h-8 !w-72 max-w-full"
          autoFocus={!originalPath}
          required
        />
        <span className="text-sm text-fg-muted">in</span>
        <code className="rounded-md bg-canvas-inset px-2 py-0.5 font-mono text-sm">{branch}</code>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line bg-canvas-subtle px-4 py-2 text-xs text-fg-muted">
          {originalPath ? "Edit file" : "New file"}
          {fullPath && <span className="ml-2 font-mono text-fg">{fullPath}</span>}
        </div>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          aria-label="File contents"
          placeholder="Enter file contents here"
          className="block min-h-[55vh] w-full resize-y bg-canvas p-4 font-mono text-[13px] leading-5 outline-none"
        />
      </div>

      <CommitFields
        branch={branch}
        placeholder={originalPath ? (originalPath === fullPath ? `Update ${fullPath}` : `Rename ${originalPath}`) : `Create ${fullPath || "file"}`}
      />
      <FormMessage state={result} />
      <div className="flex gap-2">
        <SubmitButton pending={navigation.state === "submitting"} pendingLabel="Committing…">
          Commit changes
        </SubmitButton>
        <Link to={cancelHref} className="btn">
          Cancel
        </Link>
      </div>
    </Form>
  );
}
