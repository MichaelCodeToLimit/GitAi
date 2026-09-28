import { useState } from "react";
import { Link, redirect, useLoaderData, useNavigate, useRevalidator, type LoaderFunctionArgs } from "react-router";
import { FlaskConical } from "lucide-react";
import { AuthCard, OrDivider } from "@/components/auth/auth-card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { safeNext, sendMagicLink, signInWithPassword } from "@/lib/auth";
import { setDemoViewer } from "@/lib/data/demo";
import { DEMO_PROFILES } from "@/lib/data/demo-fixtures";
import { isDemo } from "@/lib/data/mode";
import { getViewer, resetViewer } from "@/lib/data/session";
import { SITE_NAME } from "@/lib/site";
import { useSubmitState } from "@/lib/use-submit-state";

export async function loader({ request }: LoaderFunctionArgs) {
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  if (await getViewer()) throw redirect(next);
  return { next };
}

export default function LoginPage() {
  const { next } = useLoaderData<typeof loader>();

  return (
    <AuthCard
      title={`Sign in to ${SITE_NAME}`}
      footer={
        <>
          New here?{" "}
          <Link to={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-link hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <title>{`Sign in · ${SITE_NAME}`}</title>
      {isDemo && <DemoSignIn next={next} />}
      <OAuthButtons next={next} verb="Sign in" />
      <OrDivider />
      <LoginForm next={next} />
    </AuthCard>
  );
}

function DemoSignIn({ next }: { next: string }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  return (
    <div className="space-y-2 rounded-md border border-warn/40 bg-warn-soft p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <FlaskConical className="size-4 text-warn" /> Try the demo
      </p>
      <p className="text-xs text-fg-muted">Sign-in isn&apos;t connected yet. Continue as a sample user to see everything an owner can do.</p>
      <div className="flex flex-wrap gap-2">
        {DEMO_PROFILES.map((p) => (
          <button
            key={p.username}
            type="button"
            className="btn btn-sm"
            onClick={async () => {
              setDemoViewer(p.username);
              resetViewer();
              await navigate(next);
              await revalidator.revalidate();
            }}
          >
            {p.username}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const navigate = useNavigate();
  const password = useSubmitState(async (form) => {
    const result = await signInWithPassword(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    if (result.ok) await navigate(next);
    return result;
  });
  const link = useSubmitState((form) => sendMagicLink(String(form.get("email") ?? ""), next));

  if (mode === "link") {
    return (
      <form onSubmit={link.onSubmit} className="space-y-4">
        <Field label="Email address" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className="input" autoFocus />
        </Field>
        <FormMessage state={link.result} />
        <SubmitButton className="btn btn-primary w-full" pending={link.pending} pendingLabel="Sending…">
          Email me a sign-in link
        </SubmitButton>
        <button type="button" onClick={() => setMode("password")} className="w-full text-center text-xs text-link hover:underline">
          Use a password instead
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={password.onSubmit} className="space-y-4">
      <Field label="Email address" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </Field>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="text-sm font-semibold">
            Password
          </label>
          <Link to="/forgot-password" className="text-xs text-link hover:underline">
            Forgot password?
          </Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <FormMessage state={password.result} />
      <SubmitButton className="btn btn-primary w-full" pending={password.pending} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
      <button type="button" onClick={() => setMode("link")} className="w-full text-center text-xs text-link hover:underline">
        Email me a sign-in link instead
      </button>
    </form>
  );
}
