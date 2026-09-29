-- Phase 1 access tests. Runs entirely inside a transaction that is rolled back.
--   supabase db query --linked -f supabase/tests/phase1_access.sql
-- Any failed expectation raises an exception; success returns one row: 'phase1 access: all passed'.

begin;

-- Test users (the signup trigger creates their profiles).
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
values
  ('00000000-0000-4000-8000-00000000000a', 'alice@example.test', '{"username": "alice-test"}', '{"provider": "email"}'),
  ('00000000-0000-4000-8000-00000000000b', 'bob@example.test', '{"user_name": "Bob_Dev", "full_name": "Bob Dev"}', '{"provider": "github"}'),
  ('00000000-0000-4000-8000-00000000000c', 'admin@example.test', '{}', '{"provider": "email"}');

do $$
begin
  assert (select username from public.profiles where id = '00000000-0000-4000-8000-00000000000a') = 'alice-test',
    'requested username is used';
  assert (select username from public.profiles where id = '00000000-0000-4000-8000-00000000000b') = 'Bob-Dev',
    'OAuth username is sanitized';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000b') = 'Bob Dev',
    'display name comes from provider metadata';
  assert (select username from public.profiles where id = '00000000-0000-4000-8000-00000000000c') ~ '^admin-[0-9]{4}$',
    'reserved usernames get a suffix';
end $$;

-- ---------------------------------------------------------------- alice (owner)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);

insert into public.repositories (name, description, topics) values ('hello', 'Public repo', '{demo,git}');
insert into public.repositories (name, visibility) values ('secret', 'private');
insert into public.repositories (name, import_url) values ('imported', 'https://github.com/octocat/Hello-World.git');

do $$
begin
  assert (select count(*) from public.repositories) = 3, 'owner sees all own repos';
  assert (select owner_id from public.repositories where name = 'hello') = '00000000-0000-4000-8000-00000000000a',
    'owner_id defaults to the caller';
  assert (select import_status from public.repositories where name = 'imported') = 'queued',
    'import URL queues an import';
  assert (select count(*) from public.repositories where search @@ to_tsquery('english', 'demo')) = 1,
    'search vector includes topics';

  begin
    update public.repositories set is_empty = false where name = 'hello';
    raise exception 'FAIL: client updated a server-managed column';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.repositories where name = 'hello';
    raise exception 'FAIL: client deleted a repository directly';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.repositories (name, import_url) values ('bad-import', 'https://user:pw@github.com/a/b.git');
    raise exception 'FAIL: import URL with credentials accepted';
  exception when check_violation then null;
  end;

  begin
    insert into public.repositories (name, default_branch) values ('bad-branch', 'feature..x');
    raise exception 'FAIL: invalid branch name accepted';
  exception when check_violation then null;
  end;

  begin
    insert into public.repositories (name) values ('HELLO');
    raise exception 'FAIL: duplicate repo name (case-insensitive) accepted';
  exception when unique_violation then null;
  end;

  update public.repositories set description = 'Renamed', name = 'hello-world' where name = 'hello';
  assert found, 'owner can rename and edit';
end $$;

-- Personal access tokens.
select set_config('test.token', public.create_access_token('laptop'), true);

do $$
begin
  assert current_setting('test.token') ~ '^gitai_pat_[0-9a-f]{64}$', 'token format';
  assert (select count(*) from public.list_access_tokens()) = 1, 'owner lists their token';
  assert (select token_prefix from public.list_access_tokens()) = left(current_setting('test.token'), 14), 'prefix stored';

  begin
    perform token_hash from public.access_tokens;
    raise exception 'FAIL: client can read token hashes';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.create_access_token('expired', now() - interval '1 day');
    raise exception 'FAIL: token with past expiry accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- ---------------------------------------------------------------- bob (another user)
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000000b", "role": "authenticated"}', true);

do $$
declare
  v_alice_token uuid;
begin
  assert (select count(*) from public.repositories) = 2, 'other users see only public repos';
  assert not exists (select 1 from public.repositories where name = 'secret'), 'private repo hidden';
  assert (select count(*) from public.get_repository('alice-test', 'secret')) = 0, 'get_repository respects RLS';
  assert (select count(*) from public.get_repository('ALICE-TEST', 'Hello-World')) = 1, 'lookup is case-insensitive';

  update public.repositories set description = 'hacked' where name = 'hello-world';
  assert not found, 'cannot edit another user''s repo';

  begin
    insert into public.repositories (owner_id, name) values ('00000000-0000-4000-8000-00000000000a', 'planted');
    raise exception 'FAIL: created a repo for another user';
  exception when insufficient_privilege then null;
  end;

  assert (select count(*) from public.list_access_tokens()) = 0, 'cannot list another user''s tokens';

  select id into v_alice_token from public.access_tokens limit 1;
  assert v_alice_token is null, 'cannot see another user''s token rows';

  begin
    perform public.revoke_access_token((select id from public.access_tokens limit 1));
    raise exception 'FAIL: revoked a token that is not yours';
  exception when no_data_found then null;
  end;

  begin
    perform public.git_authenticate(current_setting('test.token'));
    raise exception 'FAIL: clients can call git_authenticate';
  exception when insufficient_privilege then null;
  end;

  update public.profiles set bio = 'hi' where id = '00000000-0000-4000-8000-00000000000a';
  assert not found, 'cannot edit another user''s profile';
end $$;

-- ---------------------------------------------------------------- anonymous
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

do $$
begin
  assert (select count(*) from public.repositories) = 2, 'anonymous sees only public repos';
  assert (select count(*) from public.profiles) >= 3, 'profiles are public';

  begin
    insert into public.repositories (owner_id, name) values ('00000000-0000-4000-8000-00000000000a', 'anon-repo');
    raise exception 'FAIL: anonymous created a repo';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.create_access_token('x');
    raise exception 'FAIL: anonymous created a token';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------- Git server (service role)
reset role;
set local role service_role;

do $$
declare
  v_alice constant uuid := '00000000-0000-4000-8000-00000000000a';
  v_bob constant uuid := '00000000-0000-4000-8000-00000000000b';
begin
  assert public.git_authenticate(current_setting('test.token')) = v_alice, 'valid token resolves to its user';
  assert public.git_authenticate('gitai_pat_' || repeat('0', 64)) is null, 'unknown token rejected';
  assert public.git_authenticate('not-a-token') is null, 'malformed token rejected';
  assert (select last_used_at from public.access_tokens limit 1) is not null, 'last_used_at recorded';

  assert (select access from public.git_repo_access('alice-test', 'secret', v_alice)) = 'admin', 'owner is admin';
  assert (select access from public.git_repo_access('alice-test', 'secret', v_bob)) = 'none', 'private repo: others none';
  assert (select access from public.git_repo_access('alice-test', 'secret', null)) = 'none', 'private repo: anonymous none';
  assert (select access from public.git_repo_access('Alice-Test', 'HELLO-WORLD', null)) = 'read', 'public repo: anonymous read';
  assert (select access from public.git_repo_access('alice-test', 'hello-world', v_bob)) = 'read', 'public repo: others read';
  assert not exists (select 1 from public.git_repo_access('alice-test', 'missing', v_alice)), 'missing repo: no row';

  update public.repositories set is_empty = false, size_kb = 12, pushed_at = now() where name = 'hello-world';
  assert found, 'service role updates push metadata';

  update public.access_tokens set expires_at = now() + interval '1 second', created_at = now() - interval '1 day';
  update public.access_tokens set expires_at = created_at + interval '1 hour';
  assert public.git_authenticate(current_setting('test.token')) is null, 'expired token rejected';
end $$;

reset role;
select 'phase1 access: all passed' as result;

rollback;
