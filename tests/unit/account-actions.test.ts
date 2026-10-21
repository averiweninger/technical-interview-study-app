import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAccount } from "../../src/features/settings/account-actions";
import { accountProfile } from "../../src/features/auth/profile";
import { emailSchema, signupSchema } from "../../src/features/auth/validation";

const mocks = vi.hoisted(() => ({ headers: vi.fn(), client: vi.fn(), getUser: vi.fn(), updateUser: vi.fn(), allow: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("@/server/auth/rate-limit", () => ({ allowAuthAttempt: mocks.allow }));

function profile() {
  const form = new FormData(); form.set("firstName", " Taylor "); form.set("lastName", "Morgan"); return form;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_URL", "http://localhost:3000");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.allow.mockReturnValue(true);
  mocks.client.mockResolvedValue({ auth: { getUser: mocks.getUser, updateUser: mocks.updateUser } });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "actor", email: "owner@example.test" } }, error: null });
});

describe("account management", () => {
  it("normalizes email and requires names at signup", () => {
    expect(emailSchema.parse(" OWNER@Example.Test ")).toBe("owner@example.test");
    expect(signupSchema.safeParse({ email: "owner@example.test", password: "long-password" }).success).toBe(false);
  });
  it("supports missing or legacy name metadata without using metadata for authorization", () => {
    expect(accountProfile({ id: "actor", email: "owner@example.test" }).displayName).toBe("Learner");
    expect(accountProfile({ id: "actor", user_metadata: { first_name: " Taylor ", last_name: "Morgan", id: "victim" } })).toMatchObject({ id: "actor", displayName: "Taylor Morgan" });
    expect(accountProfile({ id: "actor", user_metadata: { full_name: "Existing Learner" } }).displayName).toBe("Existing Learner");
  });
  it("rejects unauthenticated and foreign-user targeting requests before any mutation", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await updateAccount("profile", { status: "idle" }, profile())).toMatchObject({ status: "error" });
    const request = profile(); request.set("userId", "victim");
    expect(await updateAccount("profile", { status: "idle" }, request)).toMatchObject({ status: "error", message: expect.stringContaining("another user") });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("rejects invalid fields, origins, and rate-limited requests", async () => {
    expect(await updateAccount("profile", { status: "idle" }, new FormData())).toMatchObject({ status: "error" });
    mocks.headers.mockResolvedValueOnce(new Headers({ origin: "https://evil.test" }));
    expect(await updateAccount("profile", { status: "idle" }, profile())).toMatchObject({ status: "error" });
    mocks.allow.mockReturnValue(false);
    expect(await updateAccount("profile", { status: "idle" }, profile())).toMatchObject({ status: "error" });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("updates only the verified actor's name metadata", async () => {
    mocks.updateUser.mockResolvedValue({ data: { user: { id: "actor" } }, error: null });
    expect(await updateAccount("profile", { status: "idle" }, profile())).toMatchObject({ status: "success" });
    expect(mocks.updateUser).toHaveBeenCalledWith({ data: { first_name: "Taylor", last_name: "Morgan" } });
  });
  it("reports email as pending rather than claiming an unconfirmed update succeeded", async () => {
    const form = new FormData(); form.set("email", " NEW@Example.Test ");
    mocks.updateUser.mockResolvedValue({ data: { user: { id: "actor", email: "owner@example.test", new_email: "new@example.test" } }, error: null });
    expect(await updateAccount("email", { status: "idle" }, form)).toMatchObject({ status: "success", message: expect.stringContaining("all confirmation links") });
    expect(mocks.updateUser).toHaveBeenCalledWith({ email: "new@example.test" }, { emailRedirectTo: "http://localhost:3000/auth/callback?next=%2Fsettings&flow=email-change" });
  });
  it("does not claim success on provider, mismatched identity, or transport failures", async () => {
    mocks.updateUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "private" } })
      .mockResolvedValueOnce({ data: { user: { id: "victim" } }, error: null }).mockRejectedValueOnce(new Error("private"));
    for (let i = 0; i < 3; i++) {
      const result = await updateAccount("profile", { status: "idle" }, profile());
      expect(result.status).toBe("error"); expect(JSON.stringify(result)).not.toContain("private");
    }
  });
});
