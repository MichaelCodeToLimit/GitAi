import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { BookMarked, Building2, CalendarDays, Link2, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { RepoList } from "@/components/repo/repo-list-item";
import { Avatar } from "@/components/ui/avatar";
import { getProfile } from "@/lib/data/profiles";
import { listReposForOwner } from "@/lib/data/repos";
import { getViewer } from "@/lib/data/session";
import { formatDate } from "@/lib/format";
import { notFound } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const [profile, viewer] = await Promise.all([getProfile(params.owner ?? ""), getViewer()]);
  if (!profile) throw notFound();
  const repos = await listReposForOwner(profile.id);
  const tab = new URL(request.url).searchParams.get("tab") === "repositories" ? "repositories" : "overview";
  return { profile, repos, tab, isSelf: viewer?.id === profile.id };
}

export default function ProfilePage() {
  const { profile, repos, tab, isSelf } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState("");
  const shown = repos.filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()));
  const base = `/${profile.username}`;

  return (
    <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 py-8 md:grid-cols-[296px_1fr] md:px-6">
      <title>{`${profile.username}${profile.display_name ? ` (${profile.display_name})` : ""} · ${SITE_NAME}`}</title>
      <aside>
        <div className="flex items-center gap-4 md:block">
          <Avatar src={profile.avatar_url} name={profile.username} size={296} className="!size-20 md:!size-[296px]" />
          <div className="md:mt-4">
            {profile.display_name && <h1 className="text-2xl leading-tight font-semibold">{profile.display_name}</h1>}
            <p className="text-xl text-fg-muted">{profile.username}</p>
          </div>
        </div>
        {profile.bio && <p className="mt-4">{profile.bio}</p>}
        {isSelf && (
          <Link to="/settings/profile" className="btn mt-4 w-full">
            Edit profile
          </Link>
        )}
        <ul className="mt-4 space-y-1.5 text-sm">
          {profile.company && (
            <li className="flex items-center gap-2">
              <Building2 className="size-4 text-fg-muted" /> {profile.company}
            </li>
          )}
          {profile.location && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-fg-muted" /> {profile.location}
            </li>
          )}
          {profile.website && (
            <li className="flex items-center gap-2">
              <Link2 className="size-4 text-fg-muted" />
              <a href={profile.website} rel="nofollow noopener noreferrer me" className="truncate hover:text-link hover:underline">
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            </li>
          )}
          <li className="flex items-center gap-2 text-fg-muted">
            <CalendarDays className="size-4" /> Joined {formatDate(profile.created_at)}
          </li>
        </ul>
      </aside>

      <div className="min-w-0">
        <nav className="mb-4 flex gap-1 border-b border-line-muted" aria-label="Profile">
          {(["overview", "repositories"] as const).map((t) => (
            <Link
              key={t}
              to={t === "overview" ? base : `${base}?tab=repositories`}
              aria-current={tab === t ? "page" : undefined}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm capitalize ${
                tab === t ? "border-accent font-semibold" : "border-transparent text-fg-muted hover:text-fg"
              }`}
            >
              {t === "repositories" && <BookMarked className="size-4" />}
              {t}
              {t === "repositories" && <span className="rounded-full bg-canvas-inset px-1.5 text-xs">{repos.length}</span>}
            </Link>
          ))}
        </nav>

        {repos.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-semibold">{isSelf ? "You don't have any repositories yet." : `${profile.username} doesn't have any public repositories yet.`}</p>
            {isSelf && (
              <Link to="/new" className="btn btn-primary mt-4">
                Create a repository
              </Link>
            )}
          </div>
        ) : tab === "overview" ? (
          <section>
            <h2 className="mb-3 text-base">Recent repositories</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {repos.slice(0, 6).map((r) => (
                <div key={r.id} className="card flex flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <BookMarked className="size-4 text-fg-muted" />
                    <Link to={`/${r.owner.username}/${r.name}`} className="truncate font-semibold text-link hover:underline">
                      {r.name}
                    </Link>
                    <span className="label-pill ml-auto capitalize">{r.visibility}</span>
                  </div>
                  <p className="line-clamp-2 flex-1 text-xs text-fg-muted">{r.description}</p>
                  {r.language && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                      <span className="size-3 rounded-full" style={{ background: r.language.color }} />
                      {r.language.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <label className="relative block max-w-md">
              <span className="sr-only">Find a repository</span>
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtle" />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a repository…" className="input !pl-8" />
            </label>
            {shown.length ? <RepoList repos={shown} showOwner={false} /> : <p className="py-10 text-center text-fg-muted">No repositories match.</p>}
          </section>
        )}
      </div>
    </div>
  );
}
