export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (lower.includes("password") && (lower.includes("least") || lower.includes("weak") || lower.includes("short"))) {
    return "That password is too weak. Use at least 6 characters.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before logging in — check your inbox for the confirmation link.";
  }
  if (lower.includes("invalid email")) {
    return "That doesn't look like a valid email address.";
  }

  return message;
}
