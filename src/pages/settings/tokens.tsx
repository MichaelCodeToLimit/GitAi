import { redirect, useFetcher, useLoaderData, type ActionFunctionArgs } from "react-router";
import { KeyRound, TriangleAlert } from "lucide-react";
import { SettingsLayout } from "@/components/layout/settings-nav";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { cloneUrl } from "@/lib/data/git";
import { getViewer } from "@/lib/data/session";
import { createAccessToken, listAccessTokens, revokeAccessToken } from "@/lib/data/tokens";
import { formatDate, timeAgo } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";
import type { ActionResult } from "@/lib/types";

export async function loader() {
  const viewer = await getViewer();
  if (!viewer) throw redirect("/login?next=/settings/tokens");
  return { viewer, tokens: await listAccessTokens() };
}

const EXPIRY_DAYS = [7, 30, 60, 90, 365];

export async function action({ request }: ActionFunctionArgs): Promise<ActionResult<{ token?: string }>> {
  if (!(await getViewer())) throw redirect("/login?next=/settings/tokens");
  const form = await request.formData();

  if (form.get("intent") === "revoke") return revokeAccessToken(String(form.get("id")));

  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 60) return { ok: false, error: "Give the token a name (up to 60 characters)." };
  const days = String(form.get("expires") ?? "30");
  const expiresAt = days === "never" ? null : new Date(Date.now() + Number(days) * 86_400_000).toISOString();
  return createAccessToken(name, expiresAt);
}

export default function TokensPage() {
  const { viewer, tokens } = useLoaderData<typeof loader>();
  const create = useFetcher<ActionResult<{ token?: string }>>();
  const newToken = create.data?.ok ? create.data.data?.token : undefined;

  return (
    <SettingsLayout title="Personal access tokens">
      <title>{`Access tokens · ${SITE_NAME}`}</title>
      <p className="text-sm text-fg-muted">
        Use a token as your password when Git asks for one. For example, pushing to{" "}
        <code className="font-mono text-xs text-fg">{cloneUrl(viewer.profile.username, "project")}</code> uses your username{" "}
        <strong className="text-fg">{viewer.profile.username}</strong> and a token.
      </p>

      {newToken && (
        <div className="mt-5 space-y-2 rounded-md border border-ok/40 bg-ok-soft p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <TriangleAlert className="size-4 text-warn" /> Copy your new token now. You won&apos;t be able to see it again.
          </p>
          <div className="flex gap-1.5">
            <input readOnly value={newToken} className="input font-mono text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="New token" />
            <CopyButton value={newToken} label="Copy token" className="!h-8" />
          </div>
        </div>
      )}

      <section className="mt-6 card p-5">
        <h2 className="font-semibold">Generate a new token</h2>
        <create.Form method="post" className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <input type="hidden" name="intent" value="create" />
          <Field label="Note" htmlFor="name">
            <input id="name" name="name" required maxLength={60} placeholder="What's this token for? e.g. Laptop" className="input" />
          </Field>
          <Field label="Expiration" htmlFor="expires">
            <select id="expires" name="expires" defaultValue="30" className="input">
              {EXPIRY_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
              <option value="never">No expiration</option>
            </select>
          </Field>
          <SubmitButton pending={create.state !== "idle"} pendingLabel="Generating…">
            Generate token
          </SubmitButton>
        </create.Form>
        {create.data && !create.data.ok && (
          <div className="mt-3">
            <FormMessage state={create.data} />
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-semibold">Your tokens</h2>
        {tokens.length === 0 ? (
          <p className="text-sm text-fg-muted">You don&apos;t have any tokens yet.</p>
        ) : (
          <ul className="card divide-y divide-line-muted">
            {tokens.map((t) => (
              <TokenRow key={t.id} token={t} />
            ))}
          </ul>
        )}
      </section>
    </SettingsLayout>
  );
}

function TokenRow({ token }: { token: Awaited<ReturnType<typeof listAccessTokens>>[number] }) {
  const revoke = useFetcher<ActionResult>();
  const expired = token.expires_at !== null && new Date(token.expires_at) < new Date();
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <KeyRound className="size-4 text-fg-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{token.name}</p>
        <p className="text-xs text-fg-muted">
          <code className="font-mono">{token.token_prefix}…</code> · created {formatDate(token.created_at)} ·{" "}
          {token.last_used_at ? `last used ${timeAgo(token.last_used_at)}` : "never used"} ·{" "}
          {token.expires_at ? (
            <span className={expired ? "text-danger" : undefined}>
              {expired ? "expired" : "expires"} {formatDate(token.expires_at)}
            </span>
          ) : (
            "no expiration"
          )}
        </p>
        {revoke.data && !revoke.data.ok && <p className="text-xs text-danger">{revoke.data.error}</p>}
      </div>
      <revoke.Form
        method="post"
        onSubmit={(e) => {
          if (!confirm(`Revoke “${token.name}”? Anything using it will stop working.`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="intent" value="revoke" />
        <input type="hidden" name="id" value={token.id} />
        <button type="submit" className="btn btn-sm btn-danger" disabled={revoke.state !== "idle"}>
          Revoke
        </button>
      </revoke.Form>
    </li>
  );
}
