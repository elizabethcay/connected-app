import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold">Your profile</h1>
      <ProfileForm
        userId={user.id}
        initialProfile={
          profile ?? {
            role: "mentee",
            full_name: null,
            bio: null,
            avatar_url: null,
          }
        }
      />
    </div>
  );
}
