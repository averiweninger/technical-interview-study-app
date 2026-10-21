import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../src/app/auth/callback/route";

const mocks = vi.hoisted(() => ({ client: vi.fn(), exchange: vi.fn(), verify: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_URL", "http://localhost:3000");
  mocks.client.mockResolvedValue({ auth: { exchangeCodeForSession: mocks.exchange, verifyOtp: mocks.verify } });
});

describe("email confirmation", () => {
  it("returns a safe service error when the application origin is not configured", async () => {
    vi.stubEnv("APP_URL", "invalid-private-value");
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=synthetic"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("invalid-private-value");
  });
  it.each(["", "?token_hash=synthetic&type=recovery", "?code=one&token_hash=two&type=email", "?error=access_denied"]) (
    "rejects invalid or unsupported confirmation requests", async (query) => {
      const response = await GET(new NextRequest(`http://localhost:3000/auth/callback${query}`));
      expect(response.headers.get("location")).toBe("http://localhost:3000/login?status=confirmation-error");
      expect(mocks.client).not.toHaveBeenCalled();
    },
  );
  it("exchanges a PKCE code and retains only a safe destination", async () => {
    mocks.exchange.mockResolvedValue({ error: null });
    const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=synthetic&next=https://evil.test"));
    expect(mocks.exchange).toHaveBeenCalledWith("synthetic");
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard?confirmation=signup");
  });
  it("verifies token-hash email links and handles expired links without provider details", async () => {
    mocks.verify.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { message: "private detail" } });
    const request = new NextRequest("http://localhost:3000/auth/callback?token_hash=synthetic&type=email&next=/practice");
    expect((await GET(request)).headers.get("location")).toBe("http://localhost:3000/practice?confirmation=signup");
    expect((await GET(request)).headers.get("location")).toBe("http://localhost:3000/login?status=confirmation-error");
    expect(mocks.verify).toHaveBeenCalledWith({ token_hash: "synthetic", type: "email" });
  });
  it("allows a configured host when Next.js normalizes its internal request origin", async () => {
    vi.stubEnv("APP_URL", "http://127.0.0.1:3100");
    mocks.verify.mockResolvedValue({ error: null });
    const request = new NextRequest("http://localhost:3100/auth/callback?token_hash=synthetic&type=email", { headers: { host: "127.0.0.1:3100" } });
    expect((await GET(request)).headers.get("location")).toBe("http://127.0.0.1:3100/dashboard?confirmation=signup");
  });
  it("handles partial and completed secure email changes without prematurely claiming success", async () => {
    mocks.verify.mockResolvedValueOnce({ error: null, data: { session: null } })
      .mockResolvedValueOnce({ error: null, data: { session: {} } });
    const request = new NextRequest("http://localhost:3000/auth/callback?token_hash=synthetic&type=email_change&next=https://evil.test");
    expect((await GET(request)).headers.get("location")).toBe("http://localhost:3000/login?status=email-change-pending&next=%2Fsettings");
    expect((await GET(request)).headers.get("location")).toBe("http://localhost:3000/settings?confirmation=email");
    expect(mocks.verify).toHaveBeenCalledWith({ token_hash: "synthetic", type: "email_change" });
  });
});
