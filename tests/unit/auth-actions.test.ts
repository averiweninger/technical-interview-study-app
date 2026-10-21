import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitCredentials, logout } from "../../src/features/auth/actions";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(), allow: vi.fn(), client: vi.fn(), signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), requireUser: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("@/server/auth/rate-limit", () => ({ allowAuthAttempt: mocks.allow }));
vi.mock("@/server/auth/session", () => ({ requireUser: mocks.requireUser }));

function credentials(password = "Synthetic-passphrase-123") {
  const form = new FormData();
  form.set("email", "learner@example.test");
  form.set("password", password);
  form.set("firstName", "Taylor");
  form.set("lastName", "Morgan");
  form.set("next", "//evil.test");
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_URL", "http://localhost:3000");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.allow.mockReturnValue(true);
  mocks.client.mockResolvedValue({ auth: { signInWithPassword: mocks.signIn, signUp: mocks.signUp, signOut: mocks.signOut } });
  mocks.requireUser.mockResolvedValue({ id: "synthetic-user" });
});

describe("authentication actions", () => {
  it("rejects invalid server input and cross-origin requests before contacting Supabase", async () => {
    const state = await submitCredentials("signup", { status: "idle" }, credentials("short"));
    expect(state).toMatchObject({ status: "error", fields: { password: expect.any(String) } });
    mocks.headers.mockResolvedValue(new Headers({ origin: "https://evil.test" }));
    expect(await submitCredentials("login", { status: "idle" }, credentials())).toMatchObject({ status: "error" });
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("enforces attempt limits before contacting Supabase", async () => {
    mocks.allow.mockReturnValue(false);
    expect(await submitCredentials("login", { status: "idle" }, credentials())).toMatchObject({ status: "error", message: expect.stringContaining("Too many") });
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("does not disclose whether credentials or confirmation caused rejection", async () => {
    mocks.signIn.mockResolvedValue({ data: {}, error: { status: 400, message: "private provider detail" } });
    const result = await submitCredentials("login", { status: "idle" }, credentials());
    expect(result).toEqual({ status: "error", message: "Email or password is incorrect, or the email address still needs confirmation." });
  });
  it("redirects successful login only to an allowlisted workspace destination", async () => {
    mocks.signIn.mockResolvedValue({ data: { session: {} }, error: null });
    await expect(submitCredentials("login", { status: "idle" }, credentials())).rejects.toThrow("redirect:/dashboard");
  });
  it("sends a trusted confirmation URL and never returns the password", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const result = await submitCredentials("signup", { status: "idle" }, credentials());
    expect(result.status).toBe("confirmation");
    expect(JSON.stringify(result)).not.toContain("Synthetic-passphrase");
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: {
      emailRedirectTo: "http://localhost:3000/auth/callback?next=%2Fdashboard", data: { first_name: "Taylor", last_name: "Morgan" },
    } }));
  });
  it("discloses duplicate registration only for an explicit provider code", async () => {
    mocks.signUp.mockResolvedValueOnce({ data: { session: null }, error: { code: "user_already_exists" } })
      .mockResolvedValueOnce({ data: { user: { identities: [] }, session: null }, error: null });
    expect(await submitCredentials("signup", { status: "idle" }, credentials())).toMatchObject({ status: "error", message: "An account with this email already exists. Please log in instead." });
    expect(await submitCredentials("signup", { status: "idle" }, credentials())).toMatchObject({ status: "confirmation" });
  });
  it("uses verified identity before logout and preserves failure feedback", async () => {
    mocks.signOut.mockResolvedValue({ error: { message: "private" } });
    expect(await logout()).toMatchObject({ status: "error", message: "Sign out could not be completed. Please try again." });
    expect(mocks.requireUser).toHaveBeenCalled();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("redirects only after successful logout", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    await expect(logout()).rejects.toThrow("redirect:/login?status=signed-out");
  });
});
