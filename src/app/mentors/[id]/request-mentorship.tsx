"use client";

import { useState } from "react";
import { RequireAuthButton } from "@/components/require-auth-button";

export function RequestMentorship({ mentorId }: { mentorId: string }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    // No mentorship_requests table yet -- this just proves the auth gate,
    // persistence lands with the mentorship-request feature.
    return <p className="text-sm text-green-700">Request sent.</p>;
  }

  return (
    <RequireAuthButton
      next={`/mentors/${mentorId}`}
      onAuthorized={() => setSent(true)}
      className="rounded bg-black px-3 py-2 text-sm text-white"
    >
      Request mentorship
    </RequireAuthButton>
  );
}
