-- Profiles table: one row per auth.users row, holding the app-specific
-- role (mentor/mentee) and public profile fields.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('mentor', 'mentee')),
  full_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can always see and edit their own row.
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Anyone (including anonymous visitors) can browse the mentor directory.
-- Multiple permissive SELECT policies are OR'd together, so this adds to
-- (not replaces) the "own row" policy above.
create policy "Mentor profiles are publicly viewable"
  on public.profiles for select
  using (role = 'mentor');

-- Auto-create a profiles row whenever a new auth user is created, reading
-- the role/full_name the signup form passed via supabase.auth.signUp's
-- options.data. This is the reliable path when "Confirm email" is on,
-- since the browser client has no session (and thus no RLS access) until
-- the user confirms their email and logs in -- the app-side upsert in the
-- signup flow can't satisfy RLS at that point, so this trigger is load
-- bearing, not just a fallback.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'mentee'),
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
