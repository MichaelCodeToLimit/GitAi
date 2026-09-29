import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { ServerOff } from "lucide-react";
import { EmptyRepo } from "@/components/repo/empty-repo";
import { TreeView } from "@/components/repo/tree-view";
import { GitServerError } from "@/lib/data/git";
import { loadRefs, loadRepo, notFound } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import { loadTreeView } from "./tree-data";

export async function loader({ params }: LoaderFunctionArgs) {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  // Nothing pushed yet: show the setup instructions without asking the Git server.
  if (ctx.repo.is_empty) return { ctx, view: null, codeError: null };

  try {
    const refs = await loadRefs(ctx.owner, ctx.name);
    if (!refs || refs.empty) return { ctx, view: null, codeError: null };
    const view = await loadTreeView(ctx, refs, refs.default_branch, "", true);
    if (!view) throw notFound();
    return { ctx, view, codeError: null };
  } catch (error) {
    if (error instanceof GitServerError) return { ctx, view: null, codeError: error.message };
    throw error;
  }
}

export default function RepoHomePage() {
  const { ctx, view, codeError } = useLoaderData<typeof loader>();
  const title = `${ctx.owner}/${ctx.name}${ctx.repo.description ? `: ${ctx.repo.description}` : ""} · ${SITE_NAME}`;
  return (
    <>
      <title>{title}</title>
      {codeError ? (
        <div className="card px-6 py-14 text-center">
          <ServerOff className="mx-auto size-8 text-fg-subtle" />
          <h2 className="mt-3 text-lg font-semibold">The code can&apos;t be shown right now</h2>
          <p className="mx-auto mt-1 max-w-md text-fg-muted">
            The service that stores this repository&apos;s files isn&apos;t reachable. The repository itself is fine; try again later.
          </p>
        </div>
      ) : view ? (
        <TreeView ctx={ctx} data={view} />
      ) : (
        <EmptyRepo owner={ctx.owner} name={ctx.name} defaultBranch={ctx.repo.default_branch} isOwner={ctx.isOwner} />
      )}
    </>
  );
}
