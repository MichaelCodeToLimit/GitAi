import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { TreeView } from "@/components/repo/tree-view";
import { getBlob } from "@/lib/data/git";
import { blobUrl, repoUrl } from "@/lib/paths";
import { loadRepo, notFound, resolveRef } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import { loadTreeView } from "./tree-data";

export async function loader({ params }: LoaderFunctionArgs) {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  const { refs, ref, path, isBranch } = await resolveRef(ctx, params["*"] ?? "");
  if (!path && ref === refs.default_branch) throw redirect(repoUrl(ctx.owner, ctx.name));

  const view = await loadTreeView(ctx, refs, ref, path, isBranch);
  if (!view) {
    // GitHub sends /tree/<file> to the file view; do the same.
    if (path && (await getBlob(ctx.owner, ctx.name, ref, path))) throw redirect(blobUrl(ctx.owner, ctx.name, ref, path));
    throw notFound();
  }
  return { ctx, view };
}

export default function TreePage() {
  const { ctx, view } = useLoaderData<typeof loader>();
  return (
    <>
      <title>{`${view.path ? `${ctx.name}/${view.path} at ${view.refName}` : `${ctx.owner}/${ctx.name} at ${view.refName}`} · ${SITE_NAME}`}</title>
      <TreeView ctx={ctx} data={view} />
    </>
  );
}
