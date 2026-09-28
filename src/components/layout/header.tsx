import { Form, Link, useRouteLoaderData } from "react-router";
import { Search } from "lucide-react";
import { Logo } from "@/components/logo";
import type { Viewer } from "@/lib/types";
import { NewMenu, UserMenu } from "./user-menu";

export function Header() {
  const viewer = useRouteLoaderData("root") as { viewer: Viewer | null } | undefined;
  const me = viewer?.viewer ?? null;

  return (
    <header className="border-b border-line bg-canvas-subtle">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:gap-5 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
          <Link to="/explore" className="rounded-md px-2.5 py-1.5 text-fg-muted hover:bg-canvas-inset hover:text-fg">
            Explore
          </Link>
        </nav>

        <Form action="/explore" role="search" className="ml-auto hidden w-full max-w-72 md:block">
          <label className="relative block">
            <span className="sr-only">Search repositories</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-subtle" />
            <input name="q" type="search" placeholder="Search repositories" className="input !h-8 !pl-8 text-sm" />
          </label>
        </Form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link to="/explore" className="btn btn-sm !px-2 md:hidden" aria-label="Search">
            <Search className="size-4" />
          </Link>
          {me ? (
            <>
              <NewMenu />
              <UserMenu username={me.profile.username} displayName={me.profile.display_name} avatarUrl={me.profile.avatar_url} />
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-canvas-inset">
                Sign in
              </Link>
              <Link to="/signup" className="btn btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
