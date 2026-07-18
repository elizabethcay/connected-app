-- Table-level grants are the coarse-grained permission check Postgres
-- applies before RLS policies are even evaluated. Supabase Cloud's
-- dashboard auto-grants these when provisioning a new project, which is
-- why everything has worked so far without them ever being declared here
-- -- but that bootstrapping isn't captured by any migration. A fresh
-- project, a local dev instance, or CI built purely from these migrations
-- would otherwise deny every request with "permission denied for table"
-- before RLS ever runs. RLS remains the actual security boundary; these
-- grants just make that boundary reachable.
grant select, insert, update, delete on public.profiles
  to anon, authenticated, service_role;

grant select, insert, update, delete on public.mentor_applications
  to anon, authenticated, service_role;
