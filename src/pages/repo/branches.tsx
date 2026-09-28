import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { GitBranch, Tag } from "lucide-react";
import { shortSha } from "@/lib/format";
import { commitUrl, treeUrl } from "@/lib/paths";
import { loadRefs, loadRepo } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";

export async function loader({ params }: LoaderFunctionArgs) {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  const refs = await loadRefs(ctx.owner, ctx.name);
  return { ctx, refs };
}

export default function BranchesPage() {
  const { ctx, refs } = useLoaderData<typeof loader>();
  const branches = [...(refs?.branches ?? [])].sort((a, b) =>
    a.name === refs?.default_branch ? -1 : b.name === refs?.default_branch ? 1 : a.name.localeCompare(b.name),
  );

  return (
    <div className="space-y-8">
      <title>{`Branches · ${ctx.owner}/${ctx.name} · ${SITE_NAME}`}</title>
      <section>
        <h1 className="mb-3 text-xl font-semibold">Branches</h1>
        {branches.length === 0 ? (
          <p className="text-fg-muted">No branches yet. Push to create one.</p>
        ) : (
          <ul className="card divide-y divide-line-muted">
            {branches.map((b) => (
              <li key={b.name} className="flex items-center gap-3 px-4 py-3">
                <GitBranch className="size-4 text-fg-muted" />
                <Link to={treeUrl(ctx.owner, ctx.name, b.name)} className="font-mono text-sm font-semibold text-link hover:underline">
                  {b.name}
                </Link>
                {b.name === refs?.default_branch && <span className="label-pill">default</span>}
                <Link to={commitUrl(ctx.owner, ctx.name, b.sha)} className="ml-auto font-mono text-xs text-fg-muted hover:text-link">
                  {shortSha(b.sha)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="tags" className="scroll-mt-4">
        <h2 className="mb-3 text-xl font-semibold">Tags</h2>
        {!refs?.tags.length ? (
          <p className="text-fg-muted">
            No tags yet. Create one with <code className="font-mono text-sm">git tag v1.0.0 &amp;&amp; git push --tags</code>.
          </p>
        ) : (
          <ul className="card divide-y divide-line-muted">
            {refs.tags.map((t) => (
              <li key={t.name} className="flex items-center gap-3 px-4 py-3">
                <Tag className="size-4 text-fg-muted" />
                <Link to={treeUrl(ctx.owner, ctx.name, t.name)} className="font-mono text-sm font-semibold text-link hover:underline">
                  {t.name}
                </Link>
                <Link to={commitUrl(ctx.owner, ctx.name, t.sha)} className="ml-auto font-mono text-xs text-fg-muted hover:text-link">
                  {shortSha(t.sha)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
