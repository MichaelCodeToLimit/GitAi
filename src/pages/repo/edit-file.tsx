import { useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { EditorForm } from "@/components/repo/editor-form";
import { getBlob } from "@/lib/data/git";
import { basename, blobUrl, dirname } from "@/lib/paths";
import { loadWriteContext, notFound } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import { saveFile } from "./file-actions";

export async function loader({ params }: LoaderFunctionArgs) {
  const write = await loadWriteContext(params.owner ?? "", params.repo ?? "", params["*"] ?? "");
  if (!write.path) throw notFound();
  const blob = await getBlob(write.ctx.owner, write.ctx.name, write.branch, write.path);
  if (!blob || blob.binary || blob.truncated || blob.content === null) throw notFound();
  return { ...write, content: blob.content };
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { ctx, branch, branchSha } = await loadWriteContext(params.owner ?? "", params.repo ?? "", params["*"] ?? "");
  return saveFile({ owner: ctx.owner, name: ctx.name, branch, parentSha: branchSha }, await request.formData());
}

export default function EditFilePage() {
  const { ctx, branch, path, branchSha, content } = useLoaderData<typeof loader>();
  return (
    <>
      <title>{`Editing ${ctx.name}/${path} · ${SITE_NAME}`}</title>
      <EditorForm
        owner={ctx.owner}
        repo={ctx.name}
        branch={branch}
        parentSha={branchSha}
        dir={dirname(path)}
        originalPath={path}
        initialName={basename(path)}
        initialContent={content}
        cancelHref={blobUrl(ctx.owner, ctx.name, branch, path)}
      />
    </>
  );
}
