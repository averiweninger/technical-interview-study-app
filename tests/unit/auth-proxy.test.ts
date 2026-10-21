import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { CookieMethodsServer } from "@supabase/ssr";
import { updateSession } from "../../src/lib/supabase/proxy";

const mocks = vi.hoisted(() => ({ user: vi.fn(), cookieMethods: null as CookieMethodsServer | null }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: CookieMethodsServer }) => {
    mocks.cookieMethods = options.cookies;
    return { auth: { getUser: mocks.user } };
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic");
});

describe("session proxy", () => {
  it("rejects a forged user cookie unless Supabase verifies the identity", async () => {
    mocks.user.mockResolvedValue({ data: { user: null }, error: { message: "invalid token" } });
    const request = new NextRequest("http://localhost:3000/practice?topic=sql", { headers: { cookie: "user=forged" } });
    const response = await updateSession(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fpractice%3Ftopic%3Dsql");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("copies refreshed cookies to the incoming request and the final response", async () => {
    mocks.user.mockImplementation(async () => {
      await mocks.cookieMethods?.setAll?.([{ name: "session", value: "rotated", options: { httpOnly: true, sameSite: "lax" } }], {});
      return { data: { user: { id: "verified" } }, error: null };
    });
    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = await updateSession(request);
    expect(request.cookies.get("session")?.value).toBe("rotated");
    expect(response.cookies.get("session")?.value).toBe("rotated");
    expect(response.headers.get("x-middleware-request-cookie")).toContain("session=rotated");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.status).toBe(200);
  });
  it("preserves cleared cookies on redirects and fails closed during provider outages", async () => {
    mocks.user.mockImplementation(async () => {
      await mocks.cookieMethods?.setAll?.([{ name: "session", value: "", options: { maxAge: 0 } }], {});
      throw new Error("private provider failure");
    });
    const response = await updateSession(new NextRequest("http://localhost:3000/settings"));
    expect(response.headers.get("location")).toContain("status=unavailable");
    expect(response.cookies.get("session")?.value).toBe("");
    expect(response.headers.get("location")).not.toContain("private");
  });
});
