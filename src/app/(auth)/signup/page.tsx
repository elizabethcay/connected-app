"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/supabase/auth-errors";

type SignupPath = "mentee" | "mentor_applicant";

type ApplicationDetails = {
  experience: string;
  motivation: string;
  linkedin_url: string | null;
  co_op_history: string | null;
};

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [path, setPath] = useState<SignupPath>("mentee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [experience, setExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [coOpHistory, setCoOpHistory] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const applyingAsMentor = path === "mentor_applicant";
    const applicationDetails: ApplicationDetails | null = applyingAsMentor
      ? {
          experience,
          motivation,
          linkedin_url: linkedinUrl || null,
          co_op_history: coOpHistory || null,
        }
      : null;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: path,
          full_name: fullName || null,
          application_details: applicationDetails,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/feed`,
      },
    });

    if (signUpError) {
      setError(friendlyAuthError(signUpError.message));
      setSubmitting(false);
      return;
    }

    // Best-effort: if signUp returned an active session (e.g. email
    // confirmation is disabled for this project), the on_auth_user_created
    // trigger already ran synchronously and created the profiles row (and,
    // for mentor applicants, the mentor_applications row) from the metadata
    // above. These client-side calls just cover the case where the trigger
    // isn't installed -- failures here (e.g. "already applied") are
    // expected and safe to ignore, since the trigger is the reliable path.
    if (data.user && data.session) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        role: path,
        full_name: fullName || null,
      });

      if (applyingAsMentor) {
        await supabase.from("mentor_applications").insert({
          user_id: data.user.id,
          status: "pending",
          application_details: applicationDetails,
        });
      }
    }

    setSubmitting(false);

    if (data.session) {
      router.push("/feed");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-gray-600">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Sign up</h1>

      <div
        role="tablist"
        aria-label="Signup path"
        className="grid grid-cols-2 gap-1 rounded border p-1 text-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={path === "mentee"}
          onClick={() => setPath("mentee")}
          className={`rounded px-3 py-2 ${
            path === "mentee" ? "bg-black text-white" : "text-gray-600"
          }`}
        >
          Join as a Mentee
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={path === "mentor_applicant"}
          onClick={() => setPath("mentor_applicant")}
          className={`rounded px-3 py-2 ${
            path === "mentor_applicant" ? "bg-black text-white" : "text-gray-600"
          }`}
        >
          Apply to be a Mentor
        </button>
      </div>

      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-sm font-medium">
          Full name
        </label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {path === "mentor_applicant" && (
        <div className="space-y-4 rounded border p-4">
          <p className="text-sm text-gray-600">
            Mentor applications are reviewed by our team. You&apos;ll start
            out as a mentor applicant and be promoted once approved.
          </p>

          <div className="space-y-1">
            <label htmlFor="experience" className="block text-sm font-medium">
              Relevant experience
            </label>
            <textarea
              id="experience"
              required
              rows={3}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="motivation" className="block text-sm font-medium">
              Why do you want to mentor?
            </label>
            <textarea
              id="motivation"
              required
              rows={3}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="linkedin_url" className="block text-sm font-medium">
              LinkedIn URL
            </label>
            <input
              id="linkedin_url"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="co_op_history" className="block text-sm font-medium">
              Co-op / work history
            </label>
            <textarea
              id="co_op_history"
              rows={3}
              value={coOpHistory}
              onChange={(e) => setCoOpHistory(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {submitting
          ? "Creating account…"
          : path === "mentor_applicant"
            ? "Submit application"
            : "Sign up"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
