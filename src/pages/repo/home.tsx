import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { EmptyRepo } from "@/components/repo/empty-repo";
import { TreeView } from "@/components/repo/tree-view";
import { loadRefs, loadRepo, notFound } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import { loadTreeView } from "./tree-data";

export async function loader({ params }: LoaderFunctionArgs) {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  const refs = await loadRefs(ctx.owner, ctx.name);
  if (!refs || refs.empty) return { ctx, view: null };
  const view = await loadTreeView(ctx, refs, refs.default_branch, "", true);
  if (!view) throw notFound();
  return { ctx, view };
}

export default function RepoHomePage() {
  const { ctx, view } = useLoaderData<typeof loader>();
  const title = `${ctx.owner}/${ctx.name}${ctx.repo.description ? `: ${ctx.repo.description}` : ""} · ${SITE_NAME}`;
  return (
    <>
      <title>{title}</title>
      {view ? (
        <TreeView ctx={ctx} data={view} />
      ) : (
        <EmptyRepo owner={ctx.owner} name={ctx.name} defaultBranch={ctx.repo.default_branch} isOwner={ctx.isOwner} />
      )}
    </>
  );
}
