import { describe, it, expect } from "vitest";
import { friendlyAuthError } from "./auth-errors";

describe("friendlyAuthError", () => {
  it("maps 'already registered' to a duplicate-account message", () => {
    expect(friendlyAuthError("User already registered")).toBe(
      "An account with this email already exists. Try logging in instead.",
    );
  });

  it("maps 'already exists' to a duplicate-account message", () => {
    expect(friendlyAuthError("A user with this email already exists")).toBe(
      "An account with this email already exists. Try logging in instead.",
    );
  });

  it("maps a 'password ... least' message to a weak-password message", () => {
    expect(
      friendlyAuthError("Password should be at least 6 characters"),
    ).toBe("That password is too weak. Use at least 6 characters.");
  });

  it("maps a 'password ... weak' message to a weak-password message", () => {
    expect(friendlyAuthError("Password is too weak")).toBe(
      "That password is too weak. Use at least 6 characters.",
    );
  });

  it("maps a 'password ... short' message to a weak-password message", () => {
    expect(friendlyAuthError("Password is too short")).toBe(
      "That password is too weak. Use at least 6 characters.",
    );
  });

  it("does not treat an unrelated password message as weak-password", () => {
    // "password" present but none of least/weak/short -- should fall through unchanged.
    expect(friendlyAuthError("Password reset email sent")).toBe(
      "Password reset email sent",
    );
  });

  it("maps 'Invalid login credentials' to a generic incorrect-credentials message", () => {
    expect(friendlyAuthError("Invalid login credentials")).toBe(
      "Incorrect email or password.",
    );
  });

  it("maps 'Email not confirmed' to a confirmation-reminder message", () => {
    expect(friendlyAuthError("Email not confirmed")).toBe(
      "Please confirm your email before logging in — check your inbox for the confirmation link.",
    );
  });

  it("maps 'Invalid email' to an invalid-format message", () => {
    expect(friendlyAuthError("Unable to validate email address: invalid email")).toBe(
      "That doesn't look like a valid email address.",
    );
  });

  it("is case-insensitive", () => {
    expect(friendlyAuthError("USER ALREADY REGISTERED")).toBe(
      "An account with this email already exists. Try logging in instead.",
    );
  });

  it("passes through an unrecognized message unchanged", () => {
    expect(friendlyAuthError("Something completely unexpected happened")).toBe(
      "Something completely unexpected happened",
    );
  });

  it("passes through an empty message unchanged", () => {
    expect(friendlyAuthError("")).toBe("");
  });
});
