"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RequireAuthButton({
  children,
  next,
  onAuthorized,
  className,
}: {
  children: React.ReactNode;
  next: string;
  onAuthorized: () => void;
  className?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(false);

  async function handleClick() {
    setChecking(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setChecking(false);

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    onAuthorized();
  }

  return (
    <button onClick={handleClick} disabled={checking} className={className}>
      {children}
    </button>
  );
}
