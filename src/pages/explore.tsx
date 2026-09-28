import { Form, Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Search } from "lucide-react";
import { RepoList } from "@/components/repo/repo-list-item";
import { searchRepositories, type RepoSort } from "@/lib/data/repos";
import { pluralize } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

const SORTS: { id: RepoSort; label: string }[] = [
  { id: "updated", label: "Recently updated" },
  { id: "newest", label: "Newest" },
  { id: "name", label: "Name" },
];

const PER_PAGE = 20;

export async function loader({ request }: LoaderFunctionArgs) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").slice(0, 100);
  const rawSort = params.get("sort");
  const sort: RepoSort = SORTS.some((s) => s.id === rawSort) ? (rawSort as RepoSort) : "updated";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const { items, total } = await searchRepositories({ q, sort, page, perPage: PER_PAGE });
  return { q, sort, page, items, total };
}

export default function ExplorePage() {
  const { q, sort, page, items, total } = useLoaderData<typeof loader>();
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const link = (next: { sort?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    const s = next.sort ?? sort;
    if (s !== "updated") sp.set("sort", s);
    const p = next.page ?? 1;
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/explore?${qs}` : "/explore";
  };

  return (
    <div className="mx-auto w-full max-w-[1012px] px-4 py-10 md:px-6">
      <title>{`Explore · ${SITE_NAME}`}</title>
      <h1 className="text-3xl font-semibold tracking-tight">Explore</h1>
      <p className="mt-1 text-fg-muted">Public repositories from the community.</p>

      <Form action="/explore" className="mt-6 flex gap-2" role="search">
        <label className="relative flex-1">
          <span className="sr-only">Search repositories</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            key={q}
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by name, description or topic"
            className="input !h-10 !pl-9"
          />
        </label>
        {sort !== "updated" && <input type="hidden" name="sort" value={sort} />}
        <button className="btn !h-10">Search</button>
      </Form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-muted pb-3">
        <p className="text-sm text-fg-muted">
          {q ? (
            <>
              {pluralize(total, "result")} for <strong className="text-fg">“{q}”</strong>
            </>
          ) : (
            pluralize(total, "repository", "repositories")
          )}
        </p>
        <nav className="flex gap-1 text-sm" aria-label="Sort">
          {SORTS.map((s) => (
            <Link
              key={s.id}
              to={link({ sort: s.id })}
              aria-current={s.id === sort ? "true" : undefined}
              className={`rounded-md px-2.5 py-1 ${s.id === sort ? "bg-canvas-inset font-medium text-fg" : "text-fg-muted hover:text-fg"}`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      {items.length ? (
        <RepoList repos={items} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold">No repositories found</p>
          <p className="mt-1 text-fg-muted">{q ? "Try different words." : "Nothing public yet. Be the first!"}</p>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 ? (
            <Link to={link({ page: page - 1 })} className="btn btn-sm">
              Previous
            </Link>
          ) : (
            <button type="button" className="btn btn-sm" disabled>
              Previous
            </button>
          )}
          <span className="px-2 text-sm text-fg-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link to={link({ page: page + 1 })} className="btn btn-sm">
              Next
            </Link>
          ) : (
            <button type="button" className="btn btn-sm" disabled>
              Next
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
