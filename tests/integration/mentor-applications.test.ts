import { describe, it, expect } from "vitest";
import {
  anonClient,
  serviceRoleClient,
  signUpMentee,
  signUpMentorApplicant,
} from "./setup";

describe("mentor application DB-level guarantees (local Supabase)", () => {
  it("blocks a second mentor_applications insert for the same user (unique constraint)", async () => {
    const client = anonClient();
    const { userId } = await signUpMentorApplicant(client);

    const { error } = await client.from("mentor_applications").insert({
      user_id: userId,
      status: "pending",
      application_details: { year_program_school: "reapply attempt" },
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505"); // unique_violation
  });

  it("reverts a client-side attempt to change one's own role", async () => {
    const client = anonClient();
    const { userId } = await signUpMentee(client);

    await client.from("profiles").update({ role: "mentor" }).eq("id", userId);

    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    expect(profile?.role).toBe("mentee");
  });

  it("promotes an applicant to mentor when a reviewer approves the application", async () => {
    const applicant = anonClient();
    const { userId } = await signUpMentorApplicant(applicant);

    const reviewer = serviceRoleClient();
    const { error: reviewError } = await reviewer
      .from("mentor_applications")
      .update({ status: "approved" })
      .eq("user_id", userId);
    expect(reviewError).toBeNull();

    const { data: profile } = await reviewer
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    expect(profile?.role).toBe("mentor");

    // ...and is now publicly visible in the mentor directory.
    const outsider = anonClient();
    const { data: publicProfile } = await outsider
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
    expect(publicProfile?.id).toBe(userId);
  });

  it("demotes an applicant to member when a reviewer rejects the application", async () => {
    const applicant = anonClient();
    const { userId } = await signUpMentorApplicant(applicant);

    const reviewer = serviceRoleClient();
    await reviewer
      .from("mentor_applications")
      .update({ status: "rejected" })
      .eq("user_id", userId);

    const { data: profile } = await reviewer
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    expect(profile?.role).toBe("member");
  });

  it("hides a pending applicant's application row from other/anonymous requests", async () => {
    const applicant = anonClient();
    const { userId } = await signUpMentorApplicant(applicant);

    const outsider = anonClient();
    const { data } = await outsider
      .from("mentor_applications")
      .select("id")
      .eq("user_id", userId);

    expect(data).toEqual([]);
  });

  it("hides a non-mentor profile from the public mentor directory", async () => {
    const client = anonClient();
    const { userId } = await signUpMentee(client);

    const outsider = anonClient();
    const { data } = await outsider.from("profiles").select("id").eq("id", userId);

    expect(data).toEqual([]);
  });
});
