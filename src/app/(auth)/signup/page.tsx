"use client";

import { useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthError } from "@/lib/supabase/auth-errors";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

type SignupPath = "mentee" | "mentor_applicant";

type MenteeDetails = {
  bio: string;
};

type MentorApplicationDetails = {
  year_program_school: string;
  background_experience: string;
  motivation: string;
  linkedin_url: string | null;
};

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [path, setPath] = useState<SignupPath>("mentee");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [bio, setBio] = useState("");

  const [yearProgramSchool, setYearProgramSchool] = useState("");
  const [backgroundExperience, setBackgroundExperience] = useState("");
  const [motivation, setMotivation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const applyingAsMentor = path === "mentor_applicant";
    const menteeDetails: MenteeDetails | null = applyingAsMentor
      ? null
      : { bio };
    const applicationDetails: MentorApplicationDetails | null = applyingAsMentor
      ? {
          year_program_school: yearProgramSchool,
          background_experience: backgroundExperience,
          motivation,
          linkedin_url: linkedinUrl || null,
        }
      : null;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: path,
          full_name: fullName || null,
          bio: menteeDetails?.bio || null,
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
        bio: menteeDetails?.bio || null,
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

  return (
    <div
      className={`${inter.className} fixed inset-0 overflow-y-auto bg-[#FFFBEF]`}
    >
      <div className="mx-auto flex min-h-full w-full max-w-[560px] flex-col px-6 py-10">
        <div className="relative flex flex-col items-center">
          <Link
            href="/"
            aria-label="Close"
            className="absolute right-0 top-2 text-[#565D4E]"
          >
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
              <path
                d="M1 1L20 20M20 1L1 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          <div className="relative h-12 w-36 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- cropped via a scale+offset that next/image's fill/object-fit model can't express */}
            <img
              src="/connected-logo.png"
              alt="ConnectEd"
              className="absolute max-w-none"
              style={{
                width: "185.08%",
                height: "298.03%",
                left: "-43.98%",
                top: "-78.31%",
              }}
            />
          </div>

          {!checkEmail && (
            <>
              <h1 className="mt-6 text-center text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#2C3526]">
                Welcome to ConnectEd
              </h1>
              <p className="mt-2 text-center text-[18px] font-medium text-[#565D4E]">
                Let&apos;s set up your profile to get started.
              </p>
            </>
          )}
        </div>

        {checkEmail ? (
          <div className="mt-10 text-center">
            <h2 className="text-[18px] font-medium text-[#2C3526]">
              Check your email
            </h2>
            <p className="mt-2 text-[15px] font-medium text-[#565D4E]">
              We sent a confirmation link to <strong>{email}</strong>. Click
              it to finish creating your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="flex w-full overflow-hidden rounded-[15px]">
              <button
                type="button"
                onClick={() => setPath("mentee")}
                className="flex-1 py-2.5 text-[15px] font-medium text-[#FFFBEF]"
                style={{
                  backgroundColor: path === "mentee" ? "#51733A" : "#658753",
                }}
              >
                Join as a Mentee
              </button>
              <button
                type="button"
                onClick={() => setPath("mentor_applicant")}
                className="flex-1 py-2.5 text-[15px] font-medium text-[#FFFBEF]"
                style={{
                  backgroundColor:
                    path === "mentor_applicant" ? "#51733A" : "#658753",
                }}
              >
                Apply to be a Mentor
              </button>
            </div>

            <Field label="Full Name">
              <input
                type="text"
                required
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>

            {path === "mentee" ? (
              <Field label="Bio">
                <textarea
                  rows={3}
                  required
                  placeholder="A short blurb about you.."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={inputClass}
                />
              </Field>
            ) : (
              <>
                <p className="text-center text-[15px] font-medium text-[#565D4E]">
                  Mentor applications are hand reviewed by our team.
                  You&apos;ll be notified of a decision with next steps to
                  this email.
                </p>

                <Field label="Year, Program and School">
                  <input
                    type="text"
                    required
                    value={yearProgramSchool}
                    onChange={(e) => setYearProgramSchool(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Background Experience">
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us about your projects, extracurriculars, work experience, etc!"
                    value={backgroundExperience}
                    onChange={(e) => setBackgroundExperience(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Why do you want to become a Mentor?">
                  <textarea
                    rows={3}
                    required
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="LinkedIn URL (Optional)">
                  <textarea
                    rows={2}
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-[18px] w-[18px] rounded-[6px] border border-[#9DA298] accent-[#51733A] focus:outline-none focus:ring-2 focus:ring-[#51733A]"
              />
              <span className="text-[15px] font-medium text-[#565D4E]">
                I consent to creating an account and having the information
                entered above, stored in ConnectEd&apos;s internal database.
                <br />
                <Link
                  href="/privacy-policy"
                  className="text-[#8E8E8E] underline"
                >
                  See Privacy Policy
                </Link>
              </span>
            </label>

            {error && (
              <p className="text-[15px] font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !consent}
              className="w-full rounded-[15px] bg-[#51733A] py-2.5 text-[15px] font-medium text-[#FFFBEF] disabled:opacity-50"
            >
              {submitting
                ? "Creating account…"
                : path === "mentor_applicant"
                  ? "Submit Application"
                  : "Create Profile"}
            </button>

            <p className="text-center text-[15px] font-medium text-[#8E8E8E]">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-[10px] border border-[#565D4E] bg-white px-3 py-2 text-[15px] font-medium text-[#2C3526] placeholder:text-[#8E8E8E] focus:outline-none focus:ring-2 focus:ring-[#51733A] focus:border-[#51733A]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-[15px] font-medium text-[#565D4E]">
        {label}
      </span>
      {children}
    </label>
  );
}
