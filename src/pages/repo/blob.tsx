import { useState } from "react";
import { Link, redirect, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { Download, Pencil } from "lucide-react";
import { CodeView } from "@/components/code/code-view";
import { MarkdownView } from "@/components/markdown/markdown";
import { BranchSelect } from "@/components/repo/branch-select";
import { Breadcrumbs } from "@/components/repo/breadcrumbs";
import { DeleteFileButton } from "@/components/repo/delete-file-button";
import { LatestCommitBar } from "@/components/repo/file-table";
import { RepoImage } from "@/components/repo/repo-image";
import { CopyButton } from "@/components/ui/copy-button";
import { getBlob, getCommits, getTree, rawFileUrl } from "@/lib/data/git";
import { isDemo } from "@/lib/data/mode";
import { downloadFile, openFile } from "@/lib/download";
import { formatBytes, pluralize } from "@/lib/format";
import { languageForPath, LANGUAGES } from "@/lib/languages";
import { isImagePath } from "@/lib/media";
import { basename, blobUrl, dirname, encodePath, repoUrl, treeUrl } from "@/lib/paths";
import { loadRepo, loadWriteContext, notFound, resolveRef } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import { deleteFile } from "./file-actions";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  const { refs, ref, path, isBranch, branchSha } = await resolveRef(ctx, params["*"] ?? "");
  if (!path) throw redirect(treeUrl(ctx.owner, ctx.name, ref));

  const [blob, history] = await Promise.all([
    getBlob(ctx.owner, ctx.name, ref, path),
    getCommits(ctx.owner, ctx.name, { ref, path, perPage: 1 }).catch(() => null),
  ]);
  if (!blob) {
    if (await getTree(ctx.owner, ctx.name, ref, path)) throw redirect(treeUrl(ctx.owner, ctx.name, ref, path));
    throw notFound();
  }
  const plain = new URL(request.url).searchParams.get("plain") === "1";
  return { ctx, refs, ref, path, isBranch, branchSha, blob, latest: history?.commits[0] ?? null, plain };
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { ctx, branch, path, branchSha } = await loadWriteContext(params.owner ?? "", params.repo ?? "", params["*"] ?? "");
  return deleteFile({ owner: ctx.owner, name: ctx.name, branch, parentSha: branchSha }, path, await request.formData());
}

export default function BlobPage() {
  const { ctx, refs, ref, path, isBranch, blob, latest, plain } = useLoaderData<typeof loader>();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const langKey = languageForPath(path);
  const lang = LANGUAGES[langKey];
  const isMarkdown = langKey === "markdown";
  const isImage = isImagePath(path);
  const showRendered = (isMarkdown || isImage) && !plain;
  const canEdit = ctx.isOwner && isBranch;
  const needsAuth = ctx.repo.visibility === "private" && !isDemo;
  const raw = rawFileUrl(ctx.owner, ctx.name, ref, path);
  const lines = blob.content ? blob.content.replace(/\n$/, "").split("\n").length : 0;
  const refPath = `${encodePath(ref)}/${encodePath(path)}`;
  const fail = (e: Error) => setDownloadError(e.message);

  return (
    <div className="space-y-4">
      <title>{`${ctx.name}/${path} at ${ref} · ${ctx.owner}/${ctx.name} · ${SITE_NAME}`}</title>
      <div className="flex flex-wrap items-center gap-2">
        <BranchSelect
          owner={ctx.owner}
          repo={ctx.name}
          current={ref}
          branches={refs.branches.map((b) => b.name)}
          tags={refs.tags.map((t) => t.name)}
          defaultBranch={refs.default_branch}
          kind="blob"
          path={path}
        />
        <Breadcrumbs owner={ctx.owner} repo={ctx.name} refName={ref} path={path} />
        <div className="ml-auto">
          <CopyButton value={path} label="Copy path" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <LatestCommitBar owner={ctx.owner} repo={ctx.name} refName={ref} path={path} commit={latest} />
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas-subtle px-3 py-2">
          {(isMarkdown || (isImage && blob.content !== null)) && (
            <div className="inline-flex rounded-md border border-line p-0.5 text-xs font-medium">
              <Link
                to={blobUrl(ctx.owner, ctx.name, ref, path)}
                className={`rounded px-2.5 py-1 ${showRendered ? "bg-canvas shadow-card" : "text-fg-muted hover:text-fg"}`}
              >
                Preview
              </Link>
              <Link
                to={`${blobUrl(ctx.owner, ctx.name, ref, path)}?plain=1`}
                className={`rounded px-2.5 py-1 ${!showRendered ? "bg-canvas shadow-card" : "text-fg-muted hover:text-fg"}`}
              >
                Code
              </Link>
            </div>
          )}
          <span className="px-1 text-xs text-fg-muted">
            {blob.content !== null && `${pluralize(lines, "line")} · `}
            {formatBytes(blob.size)}
            {lang && langKey !== "text" && ` · ${lang.name}`}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {downloadError && <span className="text-xs text-danger">{downloadError}</span>}
            {needsAuth || isDemo ? (
              <button type="button" className="btn btn-sm" onClick={() => openFile(raw).catch(fail)}>
                Raw
              </button>
            ) : (
              <a href={raw} target="_blank" rel="noopener" className="btn btn-sm">
                Raw
              </a>
            )}
            {blob.content !== null && <CopyButton value={blob.content} label="Copy raw file" />}
            <button
              type="button"
              className="btn btn-sm !px-2"
              aria-label="Download raw file"
              title="Download"
              onClick={() => downloadFile(raw, basename(path)).catch(fail)}
            >
              <Download className="size-4" />
            </button>
            {canEdit && blob.content !== null && !blob.truncated && (
              <Link to={repoUrl(ctx.owner, ctx.name, "edit", refPath)} className="btn btn-sm !px-2" aria-label="Edit file" title="Edit file">
                <Pencil className="size-4" />
              </Link>
            )}
            {canEdit && <DeleteFileButton branch={ref} path={path} />}
          </div>
        </div>

        {showRendered && isImage ? (
          <div className="flex justify-center bg-[repeating-conic-gradient(var(--canvas-inset)_0%_25%,var(--canvas)_0%_50%)] bg-[length:16px_16px] p-6">
            <RepoImage src={raw} auth={needsAuth} alt={path} className="max-h-[70vh] max-w-full" />
          </div>
        ) : showRendered && isMarkdown && blob.content !== null ? (
          <div className="px-6 py-6 md:px-10 md:py-8">
            <MarkdownView
              source={blob.content}
              base={{ owner: ctx.owner, repo: ctx.name, ref, dir: dirname(path), isPrivate: ctx.repo.visibility === "private" }}
            />
          </div>
        ) : blob.content === null || blob.binary ? (
          <div className="px-6 py-12 text-center text-fg-muted">
            {blob.binary ? "Binary file not shown." : "This file is too large to display."}{" "}
            <button type="button" className="text-link hover:underline" onClick={() => downloadFile(raw, basename(path)).catch(fail)}>
              Download it
            </button>{" "}
            instead.
          </div>
        ) : (
          <>
            {blob.truncated && (
              <div className="border-b border-line bg-warn-soft px-4 py-2 text-xs">
                This file is large, so only the beginning is shown. Use Raw to see all of it.
              </div>
            )}
            <CodeView code={blob.content} grammar={lang?.grammar} />
          </>
        )}
      </section>
    </div>
  );
}
