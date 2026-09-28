import { useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { UploadForm } from "@/components/repo/upload-form";
import { repoUrl, treeUrl } from "@/lib/paths";
import { loadWriteContext } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import { uploadFiles } from "./file-actions";

export async function loader({ params }: LoaderFunctionArgs) {
  return loadWriteContext(params.owner ?? "", params.repo ?? "", params["*"] ?? "");
}

export async function action({ params, request }: ActionFunctionArgs) {
  const { ctx, branch, path, branchSha } = await loadWriteContext(params.owner ?? "", params.repo ?? "", params["*"] ?? "");
  return uploadFiles({ owner: ctx.owner, name: ctx.name, branch, parentSha: branchSha }, path, await request.formData());
}

export default function UploadPage() {
  const { ctx, branch, path, branchSha } = useLoaderData<typeof loader>();
  return (
    <>
      <title>{`Upload files · ${ctx.owner}/${ctx.name} · ${SITE_NAME}`}</title>
      <UploadForm
        branch={branch}
        parentSha={branchSha}
        dir={path}
        cancelHref={branchSha ? treeUrl(ctx.owner, ctx.name, branch, path) : repoUrl(ctx.owner, ctx.name)}
      />
    </>
  );
}
