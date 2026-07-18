import { createClient } from "@supabase/supabase-js";

// These integration tests require a local Supabase stack running via
// `npx supabase start` (Docker). They exercise real signups and real
// Postgres triggers/constraints -- deliberately NOT run against the
// real project, and NOT part of the default `npm test` run.
const LOCAL_URL = "http://127.0.0.1:54321";

// Supabase's standard local-dev demo keys: identical on every machine,
// only valid against a locally running instance on 127.0.0.1. Not a secret.
const LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// persistSession: false is required here, not just tidy -- without it,
// every client created in this process shares the same default auth
// storage key, so a later client silently adopts an earlier client's
// session instead of authenticating as its own key/user. That previously
// made the "service role" client below actually make requests as
// whichever test user had most recently signed in.
const isolatedAuth = {
  auth: { persistSession: false, autoRefreshToken: false },
};

export function anonClient() {
  return createClient(LOCAL_URL, LOCAL_ANON_KEY, isolatedAuth);
}

// Bypasses RLS -- stands in for the reviewer's Table Editor (service-role)
// connection described in the mentor_applications migration.
export function serviceRoleClient() {
  return createClient(LOCAL_URL, LOCAL_SERVICE_ROLE_KEY, isolatedAuth);
}

function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

export async function signUpMentee(client: ReturnType<typeof anonClient>) {
  const email = uniqueEmail("mentee");
  const { data, error } = await client.auth.signUp({
    email,
    password: "test-password-123",
    options: {
      data: {
        role: "mentee",
        full_name: "Test Mentee",
        bio: "A bio",
        application_details: null,
      },
    },
  });
  if (error) throw error;
  return { email, userId: data.user!.id };
}

export async function signUpMentorApplicant(client: ReturnType<typeof anonClient>) {
  const email = uniqueEmail("mentor");
  const { data, error } = await client.auth.signUp({
    email,
    password: "test-password-123",
    options: {
      data: {
        role: "mentor_applicant",
        full_name: "Test Applicant",
        bio: null,
        application_details: {
          year_program_school: "3rd Year, CS",
          background_experience: "Built stuff",
          motivation: "Give back",
          linkedin_url: null,
        },
      },
    },
  });
  if (error) throw error;
  return { email, userId: data.user!.id };
}
