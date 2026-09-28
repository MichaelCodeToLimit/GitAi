import { Link, redirect } from "react-router";
import { AuthCard } from "@/components/auth/auth-card";
import { errorsOf, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { updatePassword } from "@/lib/auth";
import { getViewer } from "@/lib/data/session";
import { SITE_NAME } from "@/lib/site";
import { useSubmitState } from "@/lib/use-submit-state";

export async function loader() {
  if (!(await getViewer())) throw redirect("/login?next=/auth/update-password");
  return null;
}

export default function UpdatePasswordPage() {
  const { result, pending, onSubmit } = useSubmitState((form) =>
    updatePassword(String(form.get("password") ?? ""), String(form.get("confirm") ?? "")),
  );
  const errors = errorsOf(result);

  return (
    <AuthCard title="Choose a new password">
      <title>{`New password · ${SITE_NAME}`}</title>
      {result?.ok ? (
        <div className="space-y-3 text-center">
          <FormMessage state={result} />
          <Link to="/" className="btn btn-primary w-full">
            Continue
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="New password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" autoFocus />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm}>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="input" />
          </Field>
          <FormMessage state={result} />
          <SubmitButton className="btn btn-primary w-full" pending={pending} pendingLabel="Saving…">
            Update password
          </SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
