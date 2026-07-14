import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestMentorship } from "./request-mentorship";

export default async function MentorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mentor } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url")
    .eq("id", id)
    .eq("role", "mentor")
    .single();

  if (!mentor) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 px-6 py-10">
      <h1 className="text-xl font-semibold">
        {mentor.full_name ?? "Unnamed mentor"}
      </h1>
      {mentor.bio && <p className="text-sm text-gray-600">{mentor.bio}</p>}
      <RequestMentorship mentorId={mentor.id} />
    </div>
  );
}
