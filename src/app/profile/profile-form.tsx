"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  role: "mentor" | "mentee" | string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export function ProfileForm({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: Profile;
}) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      role: initialProfile.role,
      full_name: fullName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
    });

    setStatus(error ? "error" : "saved");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <span className="block text-sm font-medium">Role</span>
        <p className="text-sm capitalize text-gray-600">
          {initialProfile.role}
        </p>
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
        <label htmlFor="bio" className="block text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="avatar_url" className="block text-sm font-medium">
          Avatar URL
        </label>
        <input
          id="avatar_url"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save changes"}
      </button>

      {status === "saved" && (
        <p className="text-sm text-green-700">Saved.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong saving your profile. Try again.
        </p>
      )}
    </form>
  );
}
