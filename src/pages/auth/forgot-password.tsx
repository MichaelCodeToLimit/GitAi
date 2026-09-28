import { Link } from "react-router";
import { AuthCard } from "@/components/auth/auth-card";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { requestPasswordReset } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";
import { useSubmitState } from "@/lib/use-submit-state";

export default function ForgotPasswordPage() {
  const { result, pending, onSubmit } = useSubmitState((form) => requestPasswordReset(String(form.get("email") ?? "")));

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your account's email and we'll send you a reset link."
      footer={
        <Link to="/login" className="text-link hover:underline">
          Back to sign in
        </Link>
      }
    >
      <title>{`Reset password · ${SITE_NAME}`}</title>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email address" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className="input" autoFocus />
        </Field>
        <FormMessage state={result} />
        <SubmitButton className="btn btn-primary w-full" pending={pending} pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
