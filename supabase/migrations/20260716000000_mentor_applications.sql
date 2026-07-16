-- Phase 2: mentor application & approval flow.
-- Role is no longer self-granted at signup -- applying to be a mentor
-- creates a pending mentor_applications row, and only the review trigger
-- below (approve/reject) ever promotes/demotes profiles.role.

-- Expand the role enum. The original CHECK was inline/unnamed, so its
-- generated name may not be predictable -- find and drop whatever it's
-- actually called rather than guessing.
do $$
declare
  existing_constraint text;
begin
  select con.conname into existing_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'profiles'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%role%';

  if existing_constraint is not null then
    execute format('alter table public.profiles drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_check
    check (role in ('mentee', 'mentor', 'mentor_applicant', 'member'));

-- One row per mentor application. Reviewed manually via the Supabase
-- Table Editor for this MVP (service-role connection, bypasses RLS) --
-- no client-side update policy, so there is no app-side path to approve
-- or reject.
create table if not exists public.mentor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  application_details jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

alter table public.mentor_applications enable row level security;

create policy "Users can view own application"
  on public.mentor_applications for select
  using (auth.uid() = user_id);

-- One application per user, ever -- enforced here, not just in the UI,
-- so a rejected (now `member`) account can never reapply, and this holds
-- even if a future UI path to "reapply" is built without its own check.
create policy "One application per user, no reapplication"
  on public.mentor_applications for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.mentor_applications where user_id = auth.uid()
    )
  );

-- Auto-create the profiles row (as before) and, for mentor applicants,
-- the matching mentor_applications row, from the metadata the signup
-- form passes via supabase.auth.signUp's options.data. This remains the
-- reliable path while "Confirm email" is on: the browser has no session
-- (and thus no RLS access) until the user confirms and logs in, so
-- neither client-side insert can satisfy RLS at signup time. Both
-- inserts happen in the same trigger invocation, which runs inside the
-- same transaction as the auth.users insert -- so if the second insert
-- fails, the whole signup rolls back atomically, rather than needing
-- app-level compensating rollback logic.
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

  if new.raw_user_meta_data ->> 'role' = 'mentor_applicant' then
    insert into public.mentor_applications (user_id, status, application_details)
    values (
      new.id,
      'pending',
      new.raw_user_meta_data -> 'application_details'
    );
  end if;

  return new;
end;
$$;

-- Promote/demote on review -- the only mechanism that ever changes an
-- applicant's role; reviewers only ever touch `status`, never
-- `profiles.role` directly. SECURITY DEFINER so this keeps working if a
-- future reviewer UI updates `status` through a normal authenticated
-- request: without it, this UPDATE would run under the caller's own
-- profiles RLS (locked down below) and silently fail to change someone
-- else's role. With it, the function runs as its owner, which bypasses
-- RLS the same way the Table Editor's service-role connection does.
create or replace function public.handle_mentor_application_review()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.profiles set role = 'mentor' where id = new.user_id;
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    update public.profiles set role = 'member' where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_mentor_application_reviewed on public.mentor_applications;

create trigger on_mentor_application_reviewed
  after update on public.mentor_applications
  for each row execute function public.handle_mentor_application_review();

-- Lock down profiles.role: the existing "Users can update own profile"
-- policy still lets a user update their own row (full_name/bio/etc.),
-- but this trigger silently reverts any attempted change to `role` in
-- that same request. auth.role() reflects the JWT of the top-level
-- request, so this only fires for ordinary anon-key/authenticated
-- requests -- the review trigger's cascading UPDATE above runs under
-- service_role (Table Editor today, a future reviewer flow tomorrow)
-- and is unaffected, since it isn't 'authenticated'.
create or replace function public.prevent_role_self_edit()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() = 'authenticated' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_self_edit_trigger on public.profiles;

create trigger prevent_role_self_edit_trigger
  before update on public.profiles
  for each row execute function public.prevent_role_self_edit();
