import { Link, Outlet, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { BookMarked, Lock } from "lucide-react";
import { VisibilityPill } from "@/components/repo/repo-list-item";
import { RepoTabs } from "@/components/repo/repo-tabs";
import { Avatar } from "@/components/ui/avatar";
import { loadRepo } from "@/lib/repo-context";

export async function loader({ params }: LoaderFunctionArgs) {
  return loadRepo(params.owner ?? "", params.repo ?? "");
}

export default function RepoLayout() {
  const ctx = useLoaderData<typeof loader>();
  const base = `/${ctx.owner}/${ctx.name}`;
  const Icon = ctx.repo.visibility === "private" ? Lock : BookMarked;

  return (
    <>
      <div className="border-b border-line bg-canvas-subtle">
        <div className="mx-auto max-w-[1280px] px-4 pt-4 md:px-6">
          <div className="flex flex-wrap items-center gap-2 pb-3 text-xl">
            <Icon className="size-4 text-fg-muted" />
            <Link to={`/${ctx.owner}`} className="flex items-center gap-1.5 text-link hover:underline">
              <Avatar src={ctx.repo.owner.avatar_url} name={ctx.owner} size={20} />
              {ctx.owner}
            </Link>
            <span className="text-fg-muted">/</span>
            <Link to={base} className="font-semibold break-all text-link hover:underline">
              {ctx.name}
            </Link>
            <VisibilityPill visibility={ctx.repo.visibility} />
          </div>
          <RepoTabs base={base} isOwner={ctx.isOwner} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6">
        <Outlet />
      </div>
    </>
  );
}
