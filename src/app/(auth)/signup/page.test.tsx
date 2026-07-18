import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "./page";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-inter" }),
}));

type FromCall = { table: string; method: "upsert" | "insert"; arg: unknown };

let fromCalls: FromCall[] = [];
let signUpMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp: (...args: unknown[]) => signUpMock(...args) },
    from: (table: string) => ({
      upsert: (arg: unknown) => {
        fromCalls.push({ table, method: "upsert", arg });
        return Promise.resolve({ error: null });
      },
      insert: (arg: unknown) => {
        fromCalls.push({ table, method: "insert", arg });
        return Promise.resolve({ error: null });
      },
    }),
  }),
}));

function noSessionSignUp(userId = "user-1") {
  return {
    data: { user: { id: userId }, session: null },
    error: null,
  };
}

function withSessionSignUp(userId = "user-1") {
  return {
    data: { user: { id: userId }, session: { access_token: "token" } },
    error: null,
  };
}

async function fillMenteeRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Your name"), "Jamie Mentee");
  await user.type(screen.getByPlaceholderText("Your email"), "jamie@example.com");
  await user.type(screen.getByLabelText("Password"), "hunter22");
  await user.type(
    screen.getByPlaceholderText("A short blurb about you.."),
    "I like helping people.",
  );
  await user.click(screen.getByLabelText(/I consent/));
}

async function fillMentorRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Your name"), "Alex Applicant");
  await user.type(screen.getByPlaceholderText("Your email"), "alex@example.com");
  await user.type(screen.getByLabelText("Password"), "hunter22");
  await user.type(
    screen.getByLabelText("Year, Program and School"),
    "3rd Year, CS, Waterloo",
  );
  await user.type(
    screen.getByPlaceholderText(
      "Tell us about your projects, extracurriculars, work experience, etc!",
    ),
    "Built things.",
  );
  await user.type(
    screen.getByLabelText("Why do you want to become a Mentor?"),
    "I want to give back.",
  );
  await user.click(screen.getByLabelText(/I consent/));
}

beforeEach(() => {
  fromCalls = [];
  signUpMock = vi.fn();
  push.mockClear();
  refresh.mockClear();
});

describe("SignupPage", () => {
  it("defaults to the mentee path", () => {
    render(<SignupPage />);
    expect(screen.getByPlaceholderText("A short blurb about you..")).toBeInTheDocument();
    expect(screen.queryByLabelText("Year, Program and School")).not.toBeInTheDocument();
  });

  it("switches field sets when toggling to the mentor path, and back", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.click(screen.getByRole("button", { name: "Apply to be a Mentor" }));
    expect(screen.getByLabelText("Year, Program and School")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("A short blurb about you.."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Join as a Mentee" }));
    expect(screen.getByPlaceholderText("A short blurb about you..")).toBeInTheDocument();
    expect(screen.queryByLabelText("Year, Program and School")).not.toBeInTheDocument();
  });

  it("disables submit until the consent checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    const submit = screen.getByRole("button", { name: "Create Profile" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByLabelText(/I consent/));
    expect(submit).toBeEnabled();
  });

  it("does not submit the mentee path if a required field (Full Name) is left empty", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText("Your email"), "jamie@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter22");
    await user.type(
      screen.getByPlaceholderText("A short blurb about you.."),
      "I like helping people.",
    );
    await user.click(screen.getByLabelText(/I consent/));
    await user.click(screen.getByRole("button", { name: "Create Profile" }));

    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("does not submit the mentor path if a required field (Background Experience) is left empty", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.click(screen.getByRole("button", { name: "Apply to be a Mentor" }));
    await user.type(screen.getByPlaceholderText("Your name"), "Alex Applicant");
    await user.type(screen.getByPlaceholderText("Your email"), "alex@example.com");
    await user.type(screen.getByLabelText("Password"), "hunter22");
    await user.type(
      screen.getByLabelText("Year, Program and School"),
      "3rd Year, CS, Waterloo",
    );
    await user.type(
      screen.getByLabelText("Why do you want to become a Mentor?"),
      "I want to give back.",
    );
    await user.click(screen.getByLabelText(/I consent/));
    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("submits the mentor path with LinkedIn left blank (it's optional)", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue(noSessionSignUp());
    render(<SignupPage />);

    await user.click(screen.getByRole("button", { name: "Apply to be a Mentor" }));
    await fillMentorRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(signUpMock).toHaveBeenCalledTimes(1);
  });

  it("builds the mentee signUp payload with role mentee and null application_details", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue(noSessionSignUp());
    render(<SignupPage />);

    await fillMenteeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Create Profile" }));

    expect(signUpMock).toHaveBeenCalledWith({
      email: "jamie@example.com",
      password: "hunter22",
      options: {
        data: {
          role: "mentee",
          full_name: "Jamie Mentee",
          bio: "I like helping people.",
          application_details: null,
        },
        emailRedirectTo: expect.stringContaining("/auth/callback?next=/feed"),
      },
    });
  });

  it("builds the mentor signUp payload with the renamed application_details keys", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue(noSessionSignUp());
    render(<SignupPage />);

    await user.click(screen.getByRole("button", { name: "Apply to be a Mentor" }));
    await fillMentorRequiredFields(user);
    await user.type(screen.getByLabelText("LinkedIn URL (Optional)"), "linkedin.com/in/alex");
    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            role: "mentor_applicant",
            application_details: {
              year_program_school: "3rd Year, CS, Waterloo",
              background_experience: "Built things.",
              motivation: "I want to give back.",
              linkedin_url: "linkedin.com/in/alex",
            },
          }),
        }),
      }),
    );
  });

  it("stores a null linkedin_url when the optional field is left blank", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue(noSessionSignUp());
    render(<SignupPage />);

    await user.click(screen.getByRole("button", { name: "Apply to be a Mentor" }));
    await fillMentorRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    const call = signUpMock.mock.calls[0][0];
    expect(call.options.data.application_details.linkedin_url).toBeNull();
  });

  it("shows a friendly error and does not attempt any best-effort writes when signUp fails", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    render(<SignupPage />);

    await fillMenteeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Create Profile" }));

    expect(
      await screen.findByText(
        "An account with this email already exists. Try logging in instead.",
      ),
    ).toBeInTheDocument();
    expect(fromCalls).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the check-email screen and skips best-effort writes when signUp returns no session", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue(noSessionSignUp());
    render(<SignupPage />);

    await fillMenteeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Create Profile" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
    // No session yet (email confirmation required) -- the on_auth_user_created
    // trigger is the reliable path here, so the client must not attempt
    // profiles/mentor_applications writes it has no session to authorize.
    expect(fromCalls).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });

  it("performs the best-effort profiles + mentor_applications writes and redirects when signUp returns a session", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue(withSessionSignUp("user-42"));
    render(<SignupPage />);

    await user.click(screen.getByRole("button", { name: "Apply to be a Mentor" }));
    await fillMentorRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/feed"));

    expect(fromCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "profiles", method: "upsert" }),
        expect.objectContaining({ table: "mentor_applications", method: "insert" }),
      ]),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("does not insert a mentor_applications row on the mentee path even with a session", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue(withSessionSignUp());
    render(<SignupPage />);

    await fillMenteeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Create Profile" }));

    await vi.waitFor(() => expect(push).toHaveBeenCalled());

    expect(fromCalls.some((c) => c.table === "mentor_applications")).toBe(false);
    expect(fromCalls.some((c) => c.table === "profiles" && c.method === "upsert")).toBe(
      true,
    );
  });
});
