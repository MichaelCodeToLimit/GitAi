import { Link, redirect, useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { errorsOf, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { safeNext, signUp } from "@/lib/auth";
import { getViewer } from "@/lib/data/session";
import { SITE_NAME } from "@/lib/site";
import { useSubmitState } from "@/lib/use-submit-state";

export async function loader({ request }: LoaderFunctionArgs) {
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  if (await getViewer()) throw redirect(next);
  return { next };
}

export default function SignupPage() {
  const { next } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { result, pending, onSubmit } = useSubmitState(async (form) => {
    const r = await signUp({
      username: String(form.get("username") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (r.ok && r.data?.signedIn) await navigate(next);
    return r;
  });
  const errors = errorsOf(result);

  return (
    <AuthCard
      title="Create your account"
      subtitle="Host your code with real Git, for free."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-link hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <title>{`Sign up · ${SITE_NAME}`}</title>
      {result?.ok ? (
        <div className="space-y-2 py-4 text-center">
          <MailCheck className="mx-auto size-10 text-ok" />
          <p className="font-semibold">Check your email</p>
          <p className="text-sm text-fg-muted">{result.message}</p>
        </div>
      ) : (
        <>
          <OAuthButtons next={next} verb="Sign up" />
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Username" htmlFor="username" error={errors.username} hint="Letters, numbers and hyphens. This is your public name.">
              <input id="username" name="username" autoComplete="username" required maxLength={39} className="input" />
            </Field>
            <Field label="Email address" htmlFor="email" error={errors.email}>
              <input id="email" name="email" type="email" autoComplete="email" required className="input" />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters, with letters and numbers.">
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
            </Field>
            <FormMessage state={result} />
            <SubmitButton className="btn btn-primary w-full" pending={pending} pendingLabel="Creating account…">
              Create account
            </SubmitButton>
          </form>
        </>
      )}
    </AuthCard>
  );
}
