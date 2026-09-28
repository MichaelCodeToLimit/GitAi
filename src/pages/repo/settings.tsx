import { useState } from "react";
import { redirect, useFetcher, useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { Globe, Lock } from "lucide-react";
import { z } from "zod";
import { errorsOf, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { deleteRepository, updateRepository } from "@/lib/data/repos";
import { loadRefs, loadRepo, notFound } from "@/lib/repo-context";
import { SITE_NAME } from "@/lib/site";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, optionalText, optionalUrl, repoNameSchema, topicsSchema } from "@/lib/validation";

export async function loader({ params }: LoaderFunctionArgs) {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  if (!ctx.viewer) throw redirect(`/login?next=${encodeURIComponent(`/${ctx.owner}/${ctx.name}/settings`)}`);
  if (!ctx.isOwner) throw notFound();
  const refs = await loadRefs(ctx.owner, ctx.name).catch(() => null);
  return { ctx, branches: refs?.branches.map((b) => b.name) ?? [] };
}

const schema = z.object({
  name: repoNameSchema,
  description: optionalText(350),
  website_url: optionalUrl,
  topics: topicsSchema,
  visibility: z.enum(["public", "private"]),
  default_branch: z.string().trim().min(1).max(255),
});

export async function action({ params, request }: ActionFunctionArgs): Promise<ActionResult> {
  const ctx = await loadRepo(params.owner ?? "", params.repo ?? "");
  if (!ctx.isOwner) return { ok: false, error: "You don't have permission to change this repository." };
  const form = await request.formData();

  if (form.get("intent") === "delete") {
    const expected = `${ctx.owner}/${ctx.name}`;
    if (String(form.get("confirm") ?? "").trim() !== expected) return { ok: false, error: `Type ${expected} to confirm.` };
    const result = await deleteRepository(ctx.repo);
    if (!result.ok) return result;
    throw redirect(`/${ctx.owner}`);
  }

  const parsed = schema.safeParse({
    name: form.get("name") ?? "",
    description: form.get("description") ?? "",
    website_url: form.get("website_url") ?? "",
    topics: form.get("topics") ?? "",
    visibility: form.get("visibility"),
    default_branch: form.get("default_branch") ?? ctx.repo.default_branch,
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const result = await updateRepository(ctx.repo, parsed.data);
  if (!result.ok) return result;
  if (parsed.data.name !== ctx.repo.name) throw redirect(`/${ctx.owner}/${parsed.data.name}/settings`);
  return result;
}

export default function RepoSettingsPage() {
  const { ctx, branches } = useLoaderData<typeof loader>();
  const general = useFetcher<ActionResult>();
  const remove = useFetcher<ActionResult>();
  const [confirmText, setConfirmText] = useState("");
  const repo = ctx.repo;
  const errors = errorsOf(general.data);
  const branchOptions = branches.includes(repo.default_branch) ? branches : [repo.default_branch, ...branches];
  const expected = `${ctx.owner}/${ctx.name}`;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <title>{`Settings · ${expected} · ${SITE_NAME}`}</title>
      <section>
        <h1 className="border-b border-line-muted pb-2 text-2xl font-semibold">General</h1>
        <general.Form method="post" className="space-y-5 pt-5">
          <Field label="Repository name" htmlFor="name" error={errors.name}>
            <input id="name" name="name" defaultValue={repo.name} className="input max-w-sm" required maxLength={100} />
          </Field>
          <Field label="Description" htmlFor="description" optional error={errors.description}>
            <input id="description" name="description" defaultValue={repo.description ?? ""} className="input" maxLength={350} />
          </Field>
          <Field label="Website" htmlFor="website_url" optional error={errors.website_url}>
            <input id="website_url" name="website_url" defaultValue={repo.website_url ?? ""} className="input max-w-lg" placeholder="https://example.com" />
          </Field>
          <Field label="Topics" htmlFor="topics" optional error={errors.topics} hint="Separate with spaces or commas, for example: game rust webgl">
            <input id="topics" name="topics" defaultValue={repo.topics.join(" ")} className="input max-w-lg" />
          </Field>
          <Field label="Default branch" htmlFor="default_branch" error={errors.default_branch} hint="Shown when people visit the repository, and the base for clones.">
            <select id="default_branch" name="default_branch" defaultValue={repo.default_branch} className="input max-w-xs">
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Visibility</legend>
            <VisibilityOption value="public" current={repo.visibility} icon={<Globe className="size-4" />} title="Public" text="Anyone on the internet can see this repository." />
            <VisibilityOption value="private" current={repo.visibility} icon={<Lock className="size-4" />} title="Private" text="Only you can see this repository." />
          </fieldset>
          <FormMessage state={general.data} />
          <SubmitButton pending={general.state !== "idle"} pendingLabel="Saving…">
            Save changes
          </SubmitButton>
        </general.Form>
      </section>

      <section>
        <h2 className="pb-2 text-xl font-semibold">Danger zone</h2>
        <remove.Form method="post" className="space-y-3 rounded-md border border-danger/50 p-5">
          <input type="hidden" name="intent" value="delete" />
          <p className="text-sm">Deleting removes the repository, its files and its history. It can&apos;t be undone from here.</p>
          <Field label={`Type ${expected} to confirm`} htmlFor="confirm">
            <input id="confirm" name="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="input max-w-sm font-mono" autoComplete="off" />
          </Field>
          <FormMessage state={remove.data} />
          <SubmitButton className="btn btn-danger" disabled={confirmText !== expected} pending={remove.state !== "idle"} pendingLabel="Deleting…">
            Delete this repository
          </SubmitButton>
        </remove.Form>
      </section>
    </div>
  );
}

function VisibilityOption({ value, current, icon, title, text }: { value: string; current: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
      <input type="radio" name="visibility" value={value} defaultChecked={current === value} className="mt-1 accent-[var(--accent)]" />
      <span className="mt-0.5 text-fg-muted">{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-fg-muted">{text}</span>
      </span>
    </label>
  );
}
