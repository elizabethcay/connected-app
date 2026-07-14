"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/supabase/auth-errors";

type Role = "mentor" | "mentee";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("mentee");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName || null },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/feed`,
      },
    });

    if (signUpError) {
      setError(friendlyAuthError(signUpError.message));
      setSubmitting(false);
      return;
    }

    // Best-effort: if signUp returned an active session (e.g. email
    // confirmation is disabled for this project), make sure the profile
    // row matches the chosen role right away. When confirmation is
    // required there's no session yet, RLS blocks this insert, and the
    // on_auth_user_created trigger is what actually creates the row.
    if (data.user && data.session) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        role,
        full_name: fullName || null,
      });
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

      <fieldset className="space-y-1">
        <legend className="block text-sm font-medium">I am a</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="mentee"
              checked={role === "mentee"}
              onChange={() => setRole("mentee")}
            />
            Mentee
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="mentor"
              checked={role === "mentor"}
              onChange={() => setRole("mentor")}
            />
            Mentor
          </label>
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Creating account…" : "Sign up"}
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
