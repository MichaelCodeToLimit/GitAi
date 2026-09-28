import { Form, redirect, useActionData, useLoaderData, useNavigation, type ActionFunctionArgs } from "react-router";
import { BookOpen, Globe, Lock } from "lucide-react";
import { z } from "zod";
import { Avatar } from "@/components/ui/avatar";
import { errorsOf, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { createRepository } from "@/lib/data/repos";
import { getViewer } from "@/lib/data/session";
import { SITE_NAME } from "@/lib/site";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, optionalText, repoNameSchema } from "@/lib/validation";

export async function loader() {
  const viewer = await getViewer();
  if (!viewer) throw redirect("/login?next=/new");
  return { viewer };
}

const schema = z.object({
  name: repoNameSchema,
  description: optionalText(350),
  visibility: z.enum(["public", "private"]),
  readme: z.boolean(),
});

export async function action({ request }: ActionFunctionArgs): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) throw redirect("/login?next=/new");
  const form = await request.formData();
  const parsed = schema.safeParse({
    name: form.get("name") ?? "",
    description: form.get("description") ?? "",
    visibility: form.get("visibility"),
    readme: form.get("readme") === "on",
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const result = await createRepository(viewer, parsed.data);
  if (!result.ok) return result;
  throw redirect(`/${viewer.profile.username}/${result.data!.name}`);
}

export default function NewRepositoryPage() {
  const { viewer } = useLoaderData<typeof loader>();
  const result = useActionData() as ActionResult | undefined;
  const pending = useNavigation().state === "submitting";
  const errors = errorsOf(result);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <title>{`New repository · ${SITE_NAME}`}</title>
      <h1 className="text-2xl font-semibold">Create a new repository</h1>
      <p className="mt-1 border-b border-line-muted pb-5 text-fg-muted">
        A repository holds your project&apos;s files and their full history. Already have one on your computer? Create it here, then push.
      </p>

      <Form method="post" className="space-y-6 pt-6">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <span className="block text-sm font-semibold">Owner</span>
            <span className="btn cursor-default">
              <Avatar src={viewer.profile.avatar_url} name={viewer.profile.username} size={18} />
              {viewer.profile.username}
            </span>
          </div>
          <span className="pb-1.5 text-xl text-fg-muted">/</span>
          <div className="min-w-60 flex-1">
            <Field label="Repository name" htmlFor="name" error={errors.name}>
              <input id="name" name="name" required maxLength={100} className="input" autoFocus autoComplete="off" />
            </Field>
          </div>
        </div>
        <p className="-mt-3 text-xs text-fg-muted">Short and memorable works best, like hello-world or my-cli.</p>

        <Field label="Description" htmlFor="description" optional error={errors.description}>
          <input id="description" name="description" maxLength={350} className="input" />
        </Field>

        <fieldset className="space-y-2 border-t border-line-muted pt-5">
          <legend className="sr-only">Visibility</legend>
          <VisibilityOption value="public" defaultChecked icon={<Globe className="size-5" />} title="Public" text="Anyone on the internet can see this repository." />
          <VisibilityOption value="private" icon={<Lock className="size-5" />} title="Private" text="Only you can see this repository." />
        </fieldset>

        <div className="border-t border-line-muted pt-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="readme" className="mt-1 accent-[var(--accent)]" />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <BookOpen className="size-4 text-fg-muted" /> Add a README file
              </span>
              <span className="block text-xs text-fg-muted">A place to describe your project. Skip this if you&apos;re going to push an existing repository.</span>
            </span>
          </label>
        </div>

        <FormMessage state={result} />
        <div className="border-t border-line-muted pt-5">
          <SubmitButton pending={pending} pendingLabel="Creating…">
            Create repository
          </SubmitButton>
        </div>
      </Form>
    </div>
  );
}

function VisibilityOption({
  value,
  defaultChecked,
  icon,
  title,
  text,
}: {
  value: string;
  defaultChecked?: boolean;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
      <input type="radio" name="visibility" value={value} defaultChecked={defaultChecked} className="mt-1.5 accent-[var(--accent)]" />
      <span className="mt-0.5 text-fg-muted">{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-fg-muted">{text}</span>
      </span>
    </label>
  );
}
