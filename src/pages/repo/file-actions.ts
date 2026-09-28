// Browser commits: create, edit, upload and delete files through the Git server.

import { redirect } from "react-router";
import { commitChanges } from "@/lib/data/git";
import { bytesToBase64, textToBase64 } from "@/lib/encoding";
import { blobUrl, dirname, isValidRepoPath, treeUrl } from "@/lib/paths";
import type { ActionResult, FileChange } from "@/lib/types";

export const MAX_UPLOAD_BYTES = 9 * 1024 * 1024;

type Target = { owner: string; name: string; branch: string; parentSha: string | null };

/** The branch head the page was loaded with, so the Git server can reject stale edits (409). */
function parentOf(target: Target, form: FormData) {
  const sha = String(form.get("parent_sha") ?? "");
  return /^[0-9a-f]{40}$/i.test(sha) ? sha : target.parentSha;
}

function commitMessage(form: FormData, fallback: string) {
  const summary = String(form.get("message") ?? "").trim() || fallback;
  const body = String(form.get("description") ?? "").trim();
  return body ? `${summary}\n\n${body}` : summary;
}

export async function saveFile(target: Target, form: FormData): Promise<ActionResult> {
  const original = String(form.get("original_path") ?? "");
  const dir = String(form.get("dir") ?? "");
  const filename = String(form.get("filename") ?? "").trim().replace(/^\/+|\/+$/g, "");
  const path = [dir, filename].filter(Boolean).join("/");
  const content = String(form.get("content") ?? "");

  if (!filename) return { ok: false, error: "Name your file.", fieldErrors: { filename: "Required" } };
  if (!isValidRepoPath(path)) return { ok: false, error: `“${path}” isn't a valid file path.`, fieldErrors: { filename: "Invalid path" } };

  const changes: FileChange[] = [{ action: "upsert", path, content_base64: textToBase64(content) }];
  if (original && original !== path) changes.push({ action: "delete", path: original });

  const fallback = original ? (original === path ? `Update ${path}` : `Rename ${original} to ${path}`) : `Create ${path}`;
  const result = await commitChanges(target.owner, target.name, {
    branch: target.branch,
    parentSha: parentOf(target, form),
    message: commitMessage(form, fallback),
    changes,
  });
  if (!result.ok) return result;
  throw redirect(blobUrl(target.owner, target.name, target.branch, path));
}

export async function uploadFiles(target: Target, dir: string, form: FormData): Promise<ActionResult> {
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.name !== "");
  let relativePaths: string[] = [];
  try {
    relativePaths = JSON.parse(String(form.get("paths") ?? "[]"));
  } catch {
    // Fall back to plain file names.
  }
  if (!files.length) return { ok: false, error: "Choose at least one file." };
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Uploads are limited to 9 MB at a time. Push larger changes with Git." };
  }

  const changes: FileChange[] = [];
  for (const [i, file] of files.entries()) {
    const path = [dir, (relativePaths[i] || file.name).replace(/^\/+/, "")].filter(Boolean).join("/");
    if (!isValidRepoPath(path)) return { ok: false, error: `“${path}” isn't a valid file path.` };
    changes.push({ action: "upsert", path, content_base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())) });
  }

  const result = await commitChanges(target.owner, target.name, {
    branch: target.branch,
    parentSha: parentOf(target, form),
    message: commitMessage(form, files.length === 1 ? `Add ${files[0].name}` : "Add files via upload"),
    changes,
  });
  if (!result.ok) return result;
  throw redirect(treeUrl(target.owner, target.name, target.branch, dir));
}

export async function deleteFile(target: Target, path: string, form: FormData): Promise<ActionResult> {
  if (!isValidRepoPath(path)) return { ok: false, error: "Invalid path" };
  const result = await commitChanges(target.owner, target.name, {
    branch: target.branch,
    parentSha: parentOf(target, form),
    message: commitMessage(form, `Delete ${path}`),
    changes: [{ action: "delete", path }],
  });
  if (!result.ok) return result;
  throw redirect(treeUrl(target.owner, target.name, target.branch, dirname(path)));
}
