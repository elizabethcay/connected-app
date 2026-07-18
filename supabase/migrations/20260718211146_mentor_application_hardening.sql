-- Hardening pass on the mentor application flow: a real DB-level
-- uniqueness guarantee (rather than an RLS-only check) for "one
-- application per user, ever", now that mentor_applications has real
-- traffic. bio/avatar_url already exist on profiles from Phase 1 --
-- confirmed defensively below, not because they're missing.

alter table public.profiles
  add column if not exists bio text,
  add column if not exists avatar_url text;

-- Guarantees "one application per user, ever" at the database level,
-- including against a race between two near-simultaneous inserts --
-- something the RLS "not exists" check alone can't fully close.
alter table public.mentor_applications
  add constraint mentor_applications_user_id_key unique (user_id);

-- The unique constraint above now does the reapplication-blocking, so
-- the insert policy no longer needs to duplicate it with a "not exists"
-- subquery -- ownership is the only thing left for RLS to check here.
drop policy if exists "One application per user, no reapplication" on public.mentor_applications;

create policy "Users can insert own application"
  on public.mentor_applications for insert
  with check (auth.uid() = user_id);
