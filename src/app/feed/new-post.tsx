"use client";

import { useState } from "react";
import { RequireAuthButton } from "@/components/require-auth-button";

export function NewPost() {
  const [open, setOpen] = useState(false);

  if (open) {
    // Posting isn't wired up yet -- there's no posts table in this phase.
    // This just proves the auth gate; persistence lands with the feed feature.
    return (
      <div className="rounded border p-4">
        <textarea
          rows={3}
          placeholder="Share something with the community…"
          className="w-full rounded border px-3 py-2"
        />
        <button
          onClick={() => setOpen(false)}
          className="mt-2 rounded bg-black px-3 py-2 text-sm text-white"
        >
          Post
        </button>
      </div>
    );
  }

  return (
    <RequireAuthButton
      next="/feed"
      onAuthorized={() => setOpen(true)}
      className="rounded bg-black px-3 py-2 text-sm text-white"
    >
      New post
    </RequireAuthButton>
  );
}
