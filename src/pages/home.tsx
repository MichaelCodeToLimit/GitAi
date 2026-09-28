import { Link, useLoaderData } from "react-router";
import { ArrowRight, BookMarked, GitBranch, KeyRound, Lock, Pencil, Search, Terminal } from "lucide-react";
import { RepoList } from "@/components/repo/repo-list-item";
import { Avatar } from "@/components/ui/avatar";
import { cloneUrl } from "@/lib/data/git";
import { listReposForOwner, searchRepositories } from "@/lib/data/repos";
import { getViewer } from "@/lib/data/session";
import { SITE_NAME } from "@/lib/site";
import type { RepoListItem, Viewer } from "@/lib/types";

const empty = { items: [] as RepoListItem[], total: 0 };

export async function loader() {
  const viewer = await getViewer();
  const [mine, recent] = await Promise.all([
    viewer ? listReposForOwner(viewer.id).catch(() => []) : Promise.resolve([]),
    searchRepositories({ sort: "updated", perPage: viewer ? 10 : 6 }).catch(() => empty),
  ]);
  return { viewer, mine, recent: recent.items };
}

export default function HomePage() {
  const { viewer, mine, recent } = useLoaderData<typeof loader>();
  return viewer ? <Dashboard viewer={viewer} mine={mine} recent={recent} /> : <Landing recent={recent} />;
}

function Landing({ recent }: { recent: RepoListItem[] }) {
  const example = cloneUrl("you", "project");
  return (
    <>
      <title>{`${SITE_NAME}: your code, versioned with real Git`}</title>
      <section className="relative overflow-hidden border-b border-line-muted">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(60rem_30rem_at_85%_-10%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_70%)]"
        />
        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-fg-muted">
              <GitBranch className="size-3.5 text-accent" /> Real Git, hosted for you
            </p>
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Your code, versioned with real Git.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-fg-muted">
              Push and clone from your terminal. Browse files, READMEs and history on the web. Keep projects private or share them with
              everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="btn btn-accent btn-lg">
                Create your account <ArrowRight className="size-4" />
              </Link>
              <Link to="/explore" className="btn btn-lg">
                Explore repositories
              </Link>
            </div>
          </div>

          <div className="card min-w-0 overflow-hidden shadow-pop">
            <div className="flex items-center gap-1.5 border-b border-line bg-canvas-subtle px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-xs text-fg-muted">terminal</span>
            </div>
            <pre className="overflow-x-auto bg-canvas p-5 font-mono text-[12.5px] leading-6">
              <span className="text-fg-subtle">$</span> git remote add origin {example}
              {"\n"}
              <span className="text-fg-subtle">$</span> git push -u origin main
              {"\n"}
              <span className="text-fg-muted">Enumerating objects: 42, done.</span>
              {"\n"}
              <span className="text-fg-muted">Writing objects: 100% (42/42), 18.4 KiB, done.</span>
              {"\n"}
              <span className="text-fg-muted">To {example}</span>
              {"\n"}
              <span className="text-ok"> * [new branch]</span>
              <span className="text-fg-muted">      main -&gt; main</span>
            </pre>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-4 px-4 py-14 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        <Feature icon={Terminal} title="Push and clone">
          Standard Git over HTTPS. Use the tools you know, authenticated with personal access tokens.
        </Feature>
        <Feature icon={BookMarked} title="Browse on the web">
          Files with syntax highlighting, rendered READMEs, commit history and diffs.
        </Feature>
        <Feature icon={Lock} title="Public or private">
          Share a project with everyone, or keep it to yourself until it&apos;s ready.
        </Feature>
        <Feature icon={Pencil} title="Edit in the browser">
          Fix a typo or add a file without leaving the page. Every change is a real commit.
        </Feature>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto w-full max-w-[1280px] px-4 pb-16 md:px-6">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Recently updated</h2>
            <Link to="/explore" className="text-sm text-link hover:underline">
              Explore all
            </Link>
          </div>
          <div className="card px-5">
            <RepoList repos={recent} />
          </div>
        </section>
      )}
    </>
  );
}

function Feature({ icon: Icon, title, children }: { icon: typeof Terminal; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon className="size-[18px]" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-fg-muted">{children}</p>
    </div>
  );
}

function Dashboard({ viewer, mine, recent }: { viewer: Viewer; mine: RepoListItem[]; recent: RepoListItem[] }) {
  const username = viewer.profile.username;
  return (
    <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 py-8 md:grid-cols-[300px_1fr] md:px-6">
      <title>{`Dashboard · ${SITE_NAME}`}</title>
      <aside className="space-y-4">
        <div className="flex items-center gap-2">
          <Avatar src={viewer.profile.avatar_url} name={username} size={24} />
          <span className="font-semibold">{username}</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Your repositories</h2>
          <Link to="/new" className="btn btn-primary btn-sm">
            <BookMarked className="size-3.5" /> New
          </Link>
        </div>
        {mine.length ? (
          <ul className="space-y-2 text-sm">
            {mine.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <Avatar src={r.owner.avatar_url} name={r.owner.username} size={16} />
                <Link to={`/${r.owner.username}/${r.name}`} className="truncate font-medium hover:text-link hover:underline">
                  {r.owner.username}/{r.name}
                </Link>
                {r.visibility === "private" && <Lock className="size-3 shrink-0 text-fg-subtle" aria-label="Private" />}
              </li>
            ))}
            {mine.length > 12 && (
              <li>
                <Link to={`/${username}?tab=repositories`} className="text-xs text-fg-muted hover:text-link">
                  Show all {mine.length}
                </Link>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-fg-muted">You don&apos;t have any repositories yet.</p>
        )}
      </aside>

      <div className="min-w-0 space-y-6">
        {mine.length === 0 && (
          <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Start your first project</h2>
              <p className="mt-1 text-fg-muted">Create a repository, then push existing code from your terminal or add files in the browser.</p>
            </div>
            <Link to="/new" className="btn btn-primary">
              Create repository
            </Link>
          </div>
        )}

        <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <KeyRound className="size-5 shrink-0 text-accent" />
          <p className="flex-1 text-sm text-fg-muted">To push from your terminal, create a personal access token and use it as your password.</p>
          <Link to="/settings/tokens" className="btn btn-sm">
            Manage tokens
          </Link>
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recently updated on {SITE_NAME}</h2>
            <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-link hover:underline">
              <Search className="size-3.5" /> Explore
            </Link>
          </div>
          {recent.length ? (
            <div className="card px-5">
              <RepoList repos={recent} />
            </div>
          ) : (
            <p className="text-fg-muted">No public repositories yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
