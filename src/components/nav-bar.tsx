"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="font-semibold">
        ConnectEd
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/feed">Feed</Link>
        <Link href="/mentors">Mentors</Link>
        {!loading && user && <Link href="/profile">Profile</Link>}
        {!loading && !user && <Link href="/login">Log in</Link>}
        {!loading && !user && <Link href="/signup">Sign up</Link>}
        {!loading && user && (
          <button onClick={handleLogout} className="cursor-pointer">
            Log out
          </button>
        )}
      </nav>
    </header>
  );
}
