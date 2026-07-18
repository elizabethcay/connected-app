import { describe, it, expect } from "vitest";
import { roleLabel } from "./role-label";

describe("roleLabel", () => {
  it("labels mentee", () => {
    expect(roleLabel("mentee")).toBe("Mentee");
  });

  it("labels mentor_applicant as pending review", () => {
    expect(roleLabel("mentor_applicant")).toBe(
      "Mentor applicant — pending review",
    );
  });

  it("labels mentor", () => {
    expect(roleLabel("mentor")).toBe("Mentor");
  });

  it("labels member plainly, not hidden", () => {
    expect(roleLabel("member")).toBe("Member");
  });

  it("passes through an unrecognized role unchanged, rather than throwing", () => {
    expect(roleLabel("some_future_role")).toBe("some_future_role");
  });

  it("passes through an empty string unchanged", () => {
    expect(roleLabel("")).toBe("");
  });
});
