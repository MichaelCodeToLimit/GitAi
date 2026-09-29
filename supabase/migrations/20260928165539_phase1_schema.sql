-- GitAi phase 1: profiles, repositories and personal access tokens.
--
-- Code lives in real Git repositories on the Git server. Postgres holds accounts, repository
-- metadata and permissions.
--
-- Access model
--   * Public repositories are readable by everyone; private ones only by their owner
--     (collaborators arrive in phase 2).
--   * private.repo_access() is the definition of who may do what. The RLS policy on
--     repositories mirrors it inline so listing queries stay fast; keep the two in sync.
--   * The Git server (service role) calls public.git_authenticate() and public.git_repo_access().
--   * Clients never delete repositories directly: the Git server deletes the row and the repo
--     on disk together. Server-managed columns (is_empty, size_kb, pushed_at, import_status,
--     import_error) are not writable by clients (column-level grants).

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Validation helpers (immutable, used by check constraints)
-- ---------------------------------------------------------------------------

create or replace function private.is_reserved_username(name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(name) = any (array[
    'about', 'admin', 'api', 'auth', 'blog', 'dashboard', 'docs', 'explore', 'features', 'git',
    'git-ai', 'gitai', 'help', 'home', 'import', 'login', 'logout', 'new', 'notifications',
    'organizations', 'pricing', 'privacy', 'raw', 'search', 'security', 'settings', 'signin',
    'signup', 'site', 'stars', 'static', 'support', 'terms', 'topics', 'trending', 'user', 'users'
  ])
$$;

create or replace function private.valid_topics(items text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select array_position(items, null) is null
     and coalesce(bool_and(i ~ '^[a-z0-9][a-z0-9-]{0,34}$'), true)
  from unnest(items) as i
$$;

-- A subset of `git check-ref-format` rules, enough to reject names Git would refuse.
create or replace function private.valid_branch_name(b text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select b is not null
     and char_length(b) between 1 and 255
     and b !~ '[[:cntrl:] ~^:?*\[\\]'
     and b !~ '(^|/)\.'
     and b !~ '\.\.'
     and b !~ '//'
     and b !~ '^[/-]'
     and b !~ '[/.]$'
     and b !~ '\.lock(/|$)'
     and b !~ '@\{'
     and b <> '@'
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null
    constraint profiles_username_format
      check (username ~ '^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$')
    constraint profiles_username_not_reserved
      check (not private.is_reserved_username(username)),
  display_name text check (char_length(display_name) <= 80),
  bio text check (char_length(bio) <= 300),
  avatar_url text check (char_length(avatar_url) <= 500 and avatar_url ~* '^https://\S+$'),
  website text check (char_length(website) <= 300 and website ~* '^https?://\S+$'),
  location text check (char_length(location) <= 80),
  company text check (char_length(company) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_key on public.profiles (lower(username));

create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    constraint repositories_owner_id_fkey references public.profiles (id) on delete cascade,
  name text not null
    constraint repositories_name_format
      check (name ~ '^[A-Za-z0-9._-]{1,100}$' and name not in ('.', '..') and lower(name) !~ '\.git$'),
  description text check (char_length(description) <= 350),
  website_url text check (char_length(website_url) <= 500 and website_url ~* '^https?://\S+$'),
  topics text[] not null default '{}'
    check (cardinality(topics) <= 20 and private.valid_topics(topics)),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  default_branch text not null default 'main' check (private.valid_branch_name(default_branch)),
  -- Maintained by the Git server after every push, import or browser commit.
  is_empty boolean not null default true,
  size_kb bigint not null default 0 check (size_kb >= 0),
  pushed_at timestamptz,
  -- Import from a public https Git URL. No credentials in the URL; the Git server also refuses
  -- hosts that resolve to private networks.
  import_url text check (char_length(import_url) <= 500 and import_url ~* '^https://[^\s/@]+/\S+$'),
  import_status text check (import_status in ('queued', 'running', 'done', 'failed')),
  import_error text check (char_length(import_error) <= 1000),
  search tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repositories_import_status_needs_url check (import_status is null or import_url is not null)
);

create unique index repositories_owner_name_key on public.repositories (owner_id, lower(name));
create index repositories_public_pushed_idx on public.repositories (pushed_at desc nulls last)
  where visibility = 'public';
create index repositories_public_created_idx on public.repositories (created_at desc)
  where visibility = 'public';
create index repositories_topics_idx on public.repositories using gin (topics);
create index repositories_search_idx on public.repositories using gin (search);
create index repositories_import_queue_idx on public.repositories (created_at)
  where import_status in ('queued', 'running');

-- Personal access tokens for git over HTTPS. Only a SHA-256 hash is stored; the plaintext is
-- returned once by create_access_token().
create table public.access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_prefix text not null check (char_length(token_prefix) <= 20),
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint access_tokens_expiry_after_creation check (expires_at is null or expires_at > created_at)
);

create index access_tokens_user_idx on public.access_tokens (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

-- What p_user may do on a repository: 'none' | 'read' | 'write' | 'admin'.
-- p_user is null for anonymous requests. Phase 2 adds collaborators here (and in the RLS
-- policy on repositories).
create or replace function private.repo_access(p_user uuid, p_repo_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce((
    select case
      when p_user is not null and r.owner_id = p_user then 'admin'
      when r.visibility = 'public' then 'read'
      else 'none'
    end
    from public.repositories r
    where r.id = p_repo_id
  ), 'none')
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger repositories_set_updated_at
  before update on public.repositories
  for each row execute function private.set_updated_at();

create or replace function private.repositories_search()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search :=
    setweight(to_tsvector('english', coalesce(new.name, '') || ' ' || regexp_replace(coalesce(new.name, ''), '[-_.]', ' ', 'g')), 'A')
    || setweight(to_tsvector('english', array_to_string(new.topics, ' ')), 'B')
    || setweight(to_tsvector('english', coalesce(new.description, '')), 'C');
  return new;
end;
$$;

create trigger repositories_search_update
  before insert or update of name, description, topics on public.repositories
  for each row execute function private.repositories_search();

-- New repositories created with an import URL start in the import queue.
create or replace function private.repositories_queue_import()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.import_url is not null and new.import_status is null then
    new.import_status := 'queued';
  end if;
  return new;
end;
$$;

create trigger repositories_queue_import
  before insert on public.repositories
  for each row execute function private.repositories_queue_import();

-- Create a profile for every new auth user, deriving a unique username from the requested
-- username, the OAuth provider's username, or the email address.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base text;
  candidate text;
  attempt int := 0;
begin
  base := split_part(coalesce(
    nullif(meta ->> 'username', ''),
    nullif(meta ->> 'user_name', ''),
    nullif(meta ->> 'preferred_username', ''),
    new.email,
    ''
  ), '@', 1);
  base := regexp_replace(base, '[^A-Za-z0-9-]+', '-', 'g');
  base := regexp_replace(base, '-{2,}', '-', 'g');
  base := trim(both '-' from left(trim(both '-' from base), 30));
  if base = '' then
    base := 'user';
  end if;

  candidate := base;
  while private.is_reserved_username(candidate)
     or exists (select 1 from public.profiles p where lower(p.username) = lower(candidate))
  loop
    attempt := attempt + 1;
    if attempt > 25 then
      candidate := 'user-' || left(replace(new.id::text, '-', ''), 12);
      exit;
    end if;
    candidate := base || '-' || (floor(random() * 9000) + 1000)::int;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(nullif(coalesce(meta ->> 'full_name', meta ->> 'name', ''), ''), 80),
    case
      when char_length(meta ->> 'avatar_url') <= 500 and meta ->> 'avatar_url' ~* '^https://\S+$'
      then meta ->> 'avatar_url'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC: repositories
-- ---------------------------------------------------------------------------

-- Look up a repository by owner username and name (case-insensitive). RLS applies.
create or replace function public.get_repository(p_owner text, p_name text)
returns setof public.repositories
language sql
stable
security invoker
set search_path = ''
as $$
  select r.*
  from public.repositories r
  join public.profiles p on p.id = r.owner_id
  where lower(p.username) = lower(p_owner) and lower(r.name) = lower(p_name)
$$;

-- ---------------------------------------------------------------------------
-- RPC: personal access tokens
-- ---------------------------------------------------------------------------

-- Issuing a token inserts a row clients cannot insert themselves, so it runs as definer. It
-- lives in the unexposed private schema and is reached only through the public wrapper below.
create or replace function private.issue_access_token(p_name text, p_expires_at timestamptz)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_token text;
begin
  if v_uid is null then
    raise exception 'You must be signed in' using errcode = '28000';
  end if;
  if coalesce(char_length(trim(p_name)), 0) not between 1 and 100 then
    raise exception 'Token name must be 1-100 characters' using errcode = '22023';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'Expiry must be in the future' using errcode = '22023';
  end if;
  if (select count(*) from public.access_tokens t where t.user_id = v_uid) >= 50 then
    raise exception 'You can have at most 50 access tokens' using errcode = '54000';
  end if;

  -- Two v4 UUIDs: 244 random bits from the server's strong RNG.
  v_token := 'gitai_pat_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.access_tokens (user_id, name, token_hash, token_prefix, expires_at)
  values (v_uid, trim(p_name), encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), left(v_token, 14), p_expires_at);

  return v_token;
end;
$$;

-- Returns the plaintext token. It is never retrievable again.
create or replace function public.create_access_token(p_name text, p_expires_at timestamptz default null)
returns text
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.issue_access_token(p_name, p_expires_at)
$$;

create or replace function public.list_access_tokens()
returns table (id uuid, name text, token_prefix text, created_at timestamptz, expires_at timestamptz, last_used_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.id, t.name, t.token_prefix, t.created_at, t.expires_at, t.last_used_at
  from public.access_tokens t
  where t.user_id = (select auth.uid())
  order by t.created_at desc
$$;

create or replace function public.revoke_access_token(p_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  delete from public.access_tokens t
  where t.id = p_id and t.user_id = (select auth.uid());
  if not found then
    raise exception 'Access token not found' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: Git server only (service role)
-- ---------------------------------------------------------------------------

-- Resolve a personal access token to its user id, or null when invalid or expired.
create or replace function public.git_authenticate(p_token text)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_token_id uuid;
  v_user_id uuid;
  v_last timestamptz;
begin
  if p_token is null or p_token !~ '^gitai_pat_[0-9a-f]{64}$' then
    return null;
  end if;

  select t.id, t.user_id, t.last_used_at
  into v_token_id, v_user_id, v_last
  from public.access_tokens t
  where t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and (t.expires_at is null or t.expires_at > now());

  if v_token_id is null then
    return null;
  end if;
  -- Throttle writes: git makes several requests per clone/push.
  if v_last is null or v_last < now() - interval '5 minutes' then
    update public.access_tokens set last_used_at = now() where id = v_token_id;
  end if;
  return v_user_id;
end;
$$;

-- A repository by owner/name plus what p_user (null = anonymous) may do on it.
-- No row means the repository does not exist.
create or replace function public.git_repo_access(p_owner text, p_name text, p_user uuid)
returns table (
  repo_id uuid,
  owner_id uuid,
  owner_username text,
  name text,
  visibility text,
  default_branch text,
  is_empty boolean,
  import_status text,
  access text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select r.id, r.owner_id, p.username, r.name, r.visibility, r.default_branch, r.is_empty,
         r.import_status, private.repo_access(p_user, r.id)
  from public.repositories r
  join public.profiles p on p.id = r.owner_id
  where lower(p.username) = lower(p_owner) and lower(r.name) = lower(p_name)
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.repositories enable row level security;
alter table public.access_tokens enable row level security;

create policy "Profiles are public"
  on public.profiles for select to anon, authenticated
  using (true);

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Mirrors private.repo_access(): public repositories, or the caller's own.
create policy "Public or owned repositories"
  on public.repositories for select to anon, authenticated
  using (visibility = 'public' or owner_id = (select auth.uid()));

create policy "Users create their own repositories"
  on public.repositories for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners update their repositories"
  on public.repositories for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Users read their own access tokens"
  on public.access_tokens for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users revoke their own access tokens"
  on public.access_tokens for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants (new tables and functions are not exposed to the Data API automatically)
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.repositories, public.access_tokens from anon, authenticated;

grant select on public.profiles, public.repositories to anon, authenticated;
grant update (username, display_name, bio, avatar_url, website, location, company)
  on public.profiles to authenticated;

grant insert (owner_id, name, description, website_url, topics, visibility, default_branch, import_url)
  on public.repositories to authenticated;
grant update (name, description, website_url, topics, visibility, default_branch)
  on public.repositories to authenticated;

-- token_hash is deliberately not readable by clients.
grant select (id, user_id, name, token_prefix, expires_at, last_used_at, created_at)
  on public.access_tokens to authenticated;
grant delete on public.access_tokens to authenticated;

grant all on public.profiles, public.repositories, public.access_tokens to service_role;

revoke all on all functions in schema private from public, anon, authenticated;
-- Check constraints run as the writing role, so it needs these validators.
grant execute on function
  private.is_reserved_username(text),
  private.valid_topics(text[]),
  private.valid_branch_name(text)
to anon, authenticated;
grant execute on function private.issue_access_token(text, timestamptz) to authenticated;
grant execute on all functions in schema private to service_role;

revoke all on function
  public.get_repository(text, text),
  public.create_access_token(text, timestamptz),
  public.list_access_tokens(),
  public.revoke_access_token(uuid),
  public.git_authenticate(text),
  public.git_repo_access(text, text, uuid)
from public, anon, authenticated;

grant execute on function public.get_repository(text, text) to anon, authenticated, service_role;
grant execute on function
  public.create_access_token(text, timestamptz),
  public.list_access_tokens(),
  public.revoke_access_token(uuid)
to authenticated;
grant execute on function
  public.git_authenticate(text),
  public.git_repo_access(text, text, uuid)
to service_role;
