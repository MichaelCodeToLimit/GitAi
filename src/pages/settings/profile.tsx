import { redirect, useFetcher, useLoaderData, type ActionFunctionArgs } from "react-router";
import { Camera } from "lucide-react";
import { useRef } from "react";
import { z } from "zod";
import { SettingsLayout } from "@/components/layout/settings-nav";
import { Avatar } from "@/components/ui/avatar";
import { errorsOf, Field, FormMessage, SubmitButton } from "@/components/ui/form";
import { updateAvatar, updateProfile } from "@/lib/data/profiles";
import { getViewer } from "@/lib/data/session";
import { SITE_NAME } from "@/lib/site";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, optionalText, optionalUrl, usernameSchema } from "@/lib/validation";

export async function loader() {
  const viewer = await getViewer();
  if (!viewer) throw redirect("/login?next=/settings/profile");
  return { viewer };
}

const schema = z.object({
  username: usernameSchema,
  display_name: optionalText(80),
  bio: optionalText(300),
  website: optionalUrl,
  location: optionalText(80),
  company: optionalText(80),
});

export async function action({ request }: ActionFunctionArgs): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) throw redirect("/login?next=/settings/profile");
  const form = await request.formData();

  if (form.get("intent") === "avatar") {
    const file = form.get("avatar");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image." };
    const result = await updateAvatar(viewer.id, file);
    return result.ok ? { ok: true, message: result.message } : result;
  }

  const parsed = schema.safeParse(Object.fromEntries(["username", "display_name", "bio", "website", "location", "company"].map((k) => [k, form.get(k) ?? ""])));
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  return updateProfile(viewer.id, parsed.data);
}

export default function ProfileSettingsPage() {
  const { viewer } = useLoaderData<typeof loader>();
  const profile = viewer.profile;
  const form = useFetcher<ActionResult>();
  const avatar = useFetcher<ActionResult>();
  const fileInput = useRef<HTMLInputElement>(null);
  const errors = errorsOf(form.data);

  return (
    <SettingsLayout title="Public profile">
      <title>{`Profile settings · ${SITE_NAME}`}</title>
      <div className="grid gap-8 lg:grid-cols-[1fr_200px]">
        <form.Form method="post" className="space-y-5">
          <Field label="Username" htmlFor="username" error={errors.username} hint="Changing it changes the address of your profile and repositories.">
            <input id="username" name="username" defaultValue={profile.username} className="input max-w-xs" required maxLength={39} />
          </Field>
          <Field label="Name" htmlFor="display_name" optional error={errors.display_name}>
            <input id="display_name" name="display_name" defaultValue={profile.display_name ?? ""} className="input max-w-sm" maxLength={80} />
          </Field>
          <Field label="Bio" htmlFor="bio" optional error={errors.bio} hint="A sentence or two about you.">
            <textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} rows={3} maxLength={300} className="input !h-auto py-2" />
          </Field>
          <Field label="Website" htmlFor="website" optional error={errors.website}>
            <input id="website" name="website" defaultValue={profile.website ?? ""} className="input max-w-md" placeholder="https://" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Company" htmlFor="company" optional error={errors.company}>
              <input id="company" name="company" defaultValue={profile.company ?? ""} className="input" maxLength={80} />
            </Field>
            <Field label="Location" htmlFor="location" optional error={errors.location}>
              <input id="location" name="location" defaultValue={profile.location ?? ""} className="input" maxLength={80} />
            </Field>
          </div>
          <FormMessage state={form.data} />
          <SubmitButton pending={form.state !== "idle"} pendingLabel="Saving…">
            Update profile
          </SubmitButton>
        </form.Form>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Profile picture</p>
          <avatar.Form method="post" encType="multipart/form-data">
            <input type="hidden" name="intent" value="avatar" />
            <input
              ref={fileInput}
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/gif,image/webp"
              hidden
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            />
            <button
              type="button"
              className="group relative block rounded-full"
              onClick={() => fileInput.current?.click()}
              aria-label="Change profile picture"
              disabled={avatar.state !== "idle"}
            >
              <Avatar src={profile.avatar_url} name={profile.username} size={200} />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-xs font-medium shadow-card group-hover:bg-canvas-subtle">
                <Camera className="size-3.5" /> {avatar.state !== "idle" ? "Uploading…" : "Edit"}
              </span>
            </button>
          </avatar.Form>
          <FormMessage state={avatar.data} />
        </div>
      </div>
    </SettingsLayout>
  );
}
