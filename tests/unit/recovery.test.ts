import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { authorizeRecovery, clearRecovery, getRecoveryAccess } from "../../src/server/auth/recovery";
import { GET } from "../../src/app/auth/recovery/route";
import { requestPasswordRecovery, updateRecoveredPassword } from "../../src/features/auth/recovery-actions";

const mocks = vi.hoisted(() => ({ client: vi.fn(), getUser: vi.fn(), getSession: vi.fn(), verifyOtp: vi.fn(), reset: vi.fn(), update: vi.fn(), signOut: vi.fn(), allow: vi.fn(), headers: vi.fn() }));
const jar = new Map<string, string>();
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("next/headers", () => ({ headers: mocks.headers, cookies: async () => ({ get: (name: string) => jar.has(name) ? { value: jar.get(name) } : undefined, set: (name: string, value: string) => jar.set(name, value) }) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("@/server/auth/rate-limit", () => ({ createAuthRateLimiter: () => mocks.allow }));
const actor = "a0000000-0000-4000-8000-000000000001";
const user = { id: actor };
const session = { access_token: "synthetic-session-only" };
const callback = (query = "token_hash=synthetic&type=recovery") => new NextRequest(`http://localhost:3000/auth/recovery?${query}`);
const passwords = (password = "New-synthetic-passphrase-456", confirm = password) => {
  const form = new FormData(); form.set("password", password); form.set("confirmPassword", confirm); return form;
};
beforeEach(() => {
  vi.resetAllMocks(); vi.useRealTimers(); jar.clear();
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_synthetic_unit_only");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.allow.mockReturnValue(true);
  mocks.client.mockResolvedValue({ auth: { getUser: mocks.getUser, getSession: mocks.getSession, verifyOtp: mocks.verifyOtp, resetPasswordForEmail: mocks.reset, updateUser: mocks.update, signOut: mocks.signOut } });
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.verifyOtp.mockResolvedValue({ data: { user, session }, error: null });
  mocks.update.mockResolvedValue({ data: { user }, error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});

describe("recovery authorization", () => {
  it("requires an authenticated, signed, unexpired grant bound to this exact session", async () => {
    expect(await getRecoveryAccess()).toBeNull();
    await authorizeRecovery(actor, session.access_token);
    expect(await getRecoveryAccess()).toMatchObject({ actor });
    const valid = jar.get("ic-recovery")!;
    jar.set("ic-recovery", `${valid.slice(0, -4)}aaaa`);
    expect(await getRecoveryAccess()).toBeNull();
    jar.set("ic-recovery", valid);
    mocks.getSession.mockResolvedValueOnce({ data: { session: { access_token: "different-session" } }, error: null });
    expect(await getRecoveryAccess()).toBeNull();
    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: "other" } }, error: null });
    expect(await getRecoveryAccess()).toBeNull();
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 401 } });
    expect(await getRecoveryAccess()).toBeNull();
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 601_000);
    expect(await getRecoveryAccess()).toBeNull();
    vi.restoreAllMocks();
  });
  it("fails closed when the signing key changes or is missing", async () => {
    await authorizeRecovery(actor, session.access_token);
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_rotated_synthetic_only");
    expect(await getRecoveryAccess()).toBeNull();
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(await getRecoveryAccess()).toBeNull();
    await clearRecovery();
    expect(jar.get("ic-recovery")).toBe("");
  });
  it("verifies only recovery OTPs and ignores arbitrary next destinations", async () => {
    const response = await GET(callback("token_hash=synthetic&type=recovery&next=https://evil.test"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: "synthetic", type: "recovery" });
    expect(await getRecoveryAccess()).toMatchObject({ actor });
  });
  it.each(["", "code=synthetic", "token_hash=synthetic&type=email", "token_hash=one&token_hash=two&type=recovery", "token_hash=synthetic&type=recovery&code=synthetic", "error=expired"]) ("rejects malformed or wrong-flow callbacks: %s", async (query) => {
    expect((await GET(callback(query))).headers.get("location")).toContain("/forgot-password?status=invalid-link");
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(await getRecoveryAccess()).toBeNull();
  });
  it("rejects foreign hosts, expired/reused links, missing sessions and wrong actors", async () => {
    expect((await GET(new NextRequest("http://evil.test/auth/recovery?token_hash=synthetic&type=recovery"))).headers.get("location")).toContain("invalid-link");
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    for (const result of [{ error: { message: "private" } }, { data: { user, session: null }, error: null }]) {
      mocks.verifyOtp.mockResolvedValueOnce(result);
      expect((await GET(callback())).headers.get("location")).toContain("invalid-link");
    }
    mocks.getUser.mockResolvedValue({ data: { user: { id: "other" } }, error: null });
    expect((await GET(callback())).headers.get("location")).toContain("invalid-link");
    expect(jar.get("ic-recovery")).toBe("");
  });
});

describe("recovery actions", () => {
  it("validates email/origin and limits before sending, and constructs a fixed trusted redirect", async () => {
    const form = new FormData(); form.set("email", "bad");
    expect(await requestPasswordRecovery({ status: "idle" }, form)).toMatchObject({ status: "error" });
    form.set("email", " Learner@Example.test ");
    mocks.headers.mockResolvedValueOnce(new Headers({ origin: "https://evil.test" }));
    expect(await requestPasswordRecovery({ status: "idle" }, form)).toMatchObject({ status: "error" });
    mocks.allow.mockReturnValueOnce(false);
    expect(await requestPasswordRecovery({ status: "idle" }, form)).toMatchObject({ status: "error" });
    expect(mocks.reset).not.toHaveBeenCalled();
    expect(await requestPasswordRecovery({ status: "idle" }, form)).toMatchObject({ status: "confirmation" });
    expect(mocks.reset).toHaveBeenCalledWith("learner@example.test", { redirectTo: "http://localhost:3000/auth/recovery" });
  });
  it("uses identical neutral confirmation for account-specific provider errors and success", async () => {
    const form = new FormData(); form.set("email", "learner@example.test");
    const success = await requestPasswordRecovery({ status: "idle" }, form);
    for (const code of ["user_not_found", "over_email_send_rate_limit", "unexpected_failure"]) {
      mocks.reset.mockResolvedValueOnce({ error: { code, message: "private" } });
      expect(await requestPasswordRecovery({ status: "idle" }, form)).toEqual(success);
    }
    mocks.reset.mockRejectedValueOnce(new Error("private"));
    expect(await requestPasswordRecovery({ status: "idle" }, form)).toMatchObject({ status: "error" });
  });
  it("rejects ordinary sessions, short/mismatched passwords, and foreign-origin updates", async () => {
    expect(await updateRecoveredPassword({ status: "idle" }, passwords())).toMatchObject({ status: "error" });
    await authorizeRecovery(actor, session.access_token);
    for (const form of [passwords("short"), passwords("Long-password-123", "different")]) expect(await updateRecoveredPassword({ status: "idle" }, form)).toMatchObject({ status: "error" });
    mocks.headers.mockResolvedValueOnce(new Headers({ origin: "https://evil.test" }));
    expect(await updateRecoveredPassword({ status: "idle" }, passwords())).toMatchObject({ status: "error" });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("confirms the actor before success, keeps failed updates retryable, and removes authorization after success", async () => {
    await authorizeRecovery(actor, session.access_token);
    mocks.update.mockResolvedValueOnce({ error: { message: "private-password-policy" }, data: { user: null } });
    const failed = await updateRecoveredPassword({ status: "idle" }, passwords());
    expect(failed.status).toBe("error");
    expect(JSON.stringify(failed)).not.toContain("private-password-policy");
    expect(await getRecoveryAccess()).not.toBeNull();
    mocks.update.mockResolvedValueOnce({ data: { user: { id: "other" } }, error: null });
    expect(await updateRecoveredPassword({ status: "idle" }, passwords())).toMatchObject({ status: "error" });
    await expect(updateRecoveredPassword({ status: "idle" }, passwords())).rejects.toThrow("redirect:/login?status=password-updated");
    expect(mocks.update).toHaveBeenLastCalledWith({ password: "New-synthetic-passphrase-456" });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(await getRecoveryAccess()).toBeNull();
    expect(await updateRecoveredPassword({ status: "idle" }, passwords())).toMatchObject({ status: "error" });
  });
});
