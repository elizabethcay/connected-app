const ROLE_LABELS: Record<string, string> = {
  mentee: "Mentee",
  mentor_applicant: "Mentor applicant — pending review",
  mentor: "Mentor",
  member: "Member",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
