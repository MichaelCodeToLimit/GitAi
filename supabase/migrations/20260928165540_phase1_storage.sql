-- Storage for GitAi.
--   avatars (public):       profile pictures under "<user_id>/<file>".
--   repo-backups (private): Git bundles written by the Git server (service role only, so no
--                           client policies).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('repo-backups', 'repo-backups', false)
on conflict (id) do nothing;

-- Avatars are read through the public URL. Signed-in users manage only their own folder;
-- replacing a file (upsert) needs select + insert + update.
create policy "Users read their own avatar objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users replace their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own avatar objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
