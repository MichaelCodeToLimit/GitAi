import { useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { EditorForm } from "@/components/repo/editor-form";
import { repoUrl, treeUrl } from "@/lib/paths";
import { loadWriteContext } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import { saveFile } from "./file-actions";

export async function loader({ params }: LoaderFunctionArgs) {
  return loadWriteContext(params.owner ?? "", params.repo ?? "", params["*"] ?? "");
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { ctx, branch, branchSha } = await loadWriteContext(params.owner ?? "", params.repo ?? "", params["*"] ?? "");
  return saveFile({ owner: ctx.owner, name: ctx.name, branch, parentSha: branchSha }, await request.formData());
}

export default function NewFilePage() {
  const { ctx, branch, path, branchSha } = useLoaderData<typeof loader>();
  return (
    <>
      <title>{`New file · ${ctx.owner}/${ctx.name} · ${SITE_NAME}`}</title>
      <EditorForm
        owner={ctx.owner}
        repo={ctx.name}
        branch={branch}
        parentSha={branchSha}
        dir={path}
        originalPath={null}
        initialName=""
        initialContent=""
        cancelHref={branchSha ? treeUrl(ctx.owner, ctx.name, branch, path) : repoUrl(ctx.owner, ctx.name)}
      />
    </>
  );
}
