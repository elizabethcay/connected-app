import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MentorsPage() {
  const supabase = await createClient();
  const { data: mentors } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url")
    .eq("role", "mentor")
    .order("full_name");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-6 py-10">
      <h1 className="text-xl font-semibold">Mentors</h1>

      {!mentors || mentors.length === 0 ? (
        <p className="text-sm text-gray-600">No mentors yet.</p>
      ) : (
        <ul className="space-y-3">
          {mentors.map((mentor) => (
            <li key={mentor.id} className="rounded border p-4">
              <Link href={`/mentors/${mentor.id}`} className="font-medium underline">
                {mentor.full_name ?? "Unnamed mentor"}
              </Link>
              {mentor.bio && (
                <p className="mt-1 text-sm text-gray-600">{mentor.bio}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
