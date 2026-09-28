import { Link, useSearchParams } from "react-router";
import { AuthCard } from "@/components/auth/auth-card";
import { SITE_NAME } from "@/lib/site";

export default function AuthErrorPage() {
  const [params] = useSearchParams();
  const message = params.get("message");
  return (
    <AuthCard title="Something went wrong" subtitle="We couldn't finish signing you in.">
      <title>{`Sign-in problem · ${SITE_NAME}`}</title>
      {message && <p className="rounded-md bg-canvas-inset px-3 py-2 text-sm break-words text-fg-muted">{message.slice(0, 300)}</p>}
      <p className="text-sm">Links from emails expire after a while and only work once. Try again from the sign-in page.</p>
      <Link to="/login" className="btn btn-primary w-full">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
