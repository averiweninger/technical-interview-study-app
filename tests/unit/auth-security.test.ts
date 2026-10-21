import { afterEach, describe, expect, it, vi } from "vitest";
import { loginSchema, signupSchema, safeNextPath } from "../../src/features/auth/validation";
import { authCookieOptions, getAppOrigin, isAllowedOrigin } from "../../src/server/auth/config";
import { createAuthRateLimiter } from "../../src/server/auth/rate-limit";

vi.mock("server-only", () => ({}));
afterEach(() => vi.unstubAllEnvs());

describe("authentication boundaries", () => {
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/%2f%2fevil.example", "/auth/callback", "/login", "/learn/../auth/callback", null, ["/dashboard"]])(
    "rejects an unsafe post-auth destination", (value) => expect(safeNextPath(value)).toBe("/dashboard"),
  );
  it("keeps a valid workspace deep link and filters", () => {
    expect(safeNextPath("/practice?topic=sql")).toBe("/practice?topic=sql");
    expect(safeNextPath("/lessons/sql-joins")).toBe("/lessons/sql-joins");
  });
  it("validates credentials without trimming or transforming passwords", () => {
    expect(signupSchema.safeParse({ email: "bad", password: "short" }).success).toBe(false);
    expect(loginSchema.parse({ email: "learner@example.test", password: " padded " }).password).toBe(" padded ");
    expect(signupSchema.safeParse({ email: "learner@example.test", password: "a".repeat(129) }).success).toBe(false);
  });
  it("requires an explicit HTTPS production origin and prevents origin spoofing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://study.example.test");
    expect(isAllowedOrigin("https://study.example.test")).toBe(true);
    expect(isAllowedOrigin("https://study.example.test.evil.test")).toBe(false);
    expect(isAllowedOrigin(null)).toBe(false);
    expect(authCookieOptions()).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    vi.stubEnv("APP_URL", "http://study.example.test");
    expect(getAppOrigin).toThrow();
    vi.stubEnv("APP_URL", "");
    expect(getAppOrigin).toThrow();
  });
  it("permits local development without relaxing production cookies", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_URL", undefined);
    expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(authCookieOptions().secure).toBe(false);
  });
  it("limits normalized account attempts, shares an IP limit, and resets expired buckets", () => {
    const allow = createAuthRateLimiter();
    for (let i = 0; i < 10; i++) expect(allow("LEARNER@example.test", "ip-a", 0)).toBe(true);
    expect(allow("learner@example.test", "ip-b", 1)).toBe(false);
    expect(allow("learner@example.test", "ip-b", 600_001)).toBe(true);
    const ipLimit = createAuthRateLimiter();
    for (let i = 0; i < 60; i++) expect(ipLimit(`person${i}@example.test`, "same-ip", 0)).toBe(true);
    expect(ipLimit("other@example.test", "same-ip", 1)).toBe(false);
  });
});
