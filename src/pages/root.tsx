import { isRouteErrorResponse, Link, Outlet, ScrollRestoration, useNavigation, useRouteError } from "react-router";
import { DemoBanner } from "@/components/layout/demo-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LogoMark } from "@/components/logo";
import { getViewer } from "@/lib/data/session";

export async function loader() {
  return { viewer: await getViewer() };
}

export default function Root() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavigationProgress />
      <DemoBanner />
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}

/** A thin bar at the top while the next page's data loads. */
function NavigationProgress() {
  const navigation = useNavigation();
  if (navigation.state === "idle") return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden" role="progressbar" aria-label="Loading">
      <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-accent" />
    </div>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse opacity-70">
        <LogoMark size={40} />
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <title>Page not found · Git AI</title>
      <p className="font-mono text-6xl font-semibold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-fg-muted">
        It may have been moved or deleted, or it&apos;s a private repository you don&apos;t have access to.
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/" className="btn btn-primary">
          Go home
        </Link>
        <Link to="/explore" className="btn">
          Explore repositories
        </Link>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : String(error);

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <title>Something went wrong · Git AI</title>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-fg-muted">We couldn&apos;t load this page. The service might be busy; try again in a moment.</p>
      <pre className="mt-4 max-w-full overflow-x-auto rounded-md bg-canvas-inset px-3 py-2 text-left font-mono text-xs text-fg-muted">
        {message}
      </pre>
      <div className="mt-6 flex gap-2">
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
        <Link to="/" className="btn">
          Go home
        </Link>
      </div>
    </div>
  );
}
