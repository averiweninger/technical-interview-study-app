import { afterEach, describe, expect, it, vi } from "vitest";
import { createSupabaseClient } from "../../src/lib/supabase/client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureClient() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic_test_only");
}

describe("anonymous Supabase setup", () => {
  it("initializes isolated clients without a session, storage access, or network calls", async () => {
    configureClient();
    const fetch = vi.fn(() => { throw new Error("Unexpected network call"); });
    const storageRead = vi.fn(() => { throw new Error("Unexpected session storage access"); });
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("localStorage", { getItem: storageRead });

    const first = createSupabaseClient();
    const second = createSupabaseClient();
    expect(first).not.toBe(second);
    expect(await first.auth.getSession()).toMatchObject({ data: { session: null }, error: null });
    expect(fetch).not.toHaveBeenCalled();
    expect(storageRead).not.toHaveBeenCalled();
  });

  it("reports missing configuration without including supplied values", () => {
    configureClient();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(createSupabaseClient).toThrow("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.");
  });

  it.each([
    "invalid-sensitive-value",
    "http://example.supabase.co",
    "https://user:private@example.supabase.co",
    "https://example.supabase.co?key=private",
  ])("rejects unsafe URLs with a redacted diagnostic", (url) => {
    configureClient();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    const message = url === "invalid-sensitive-value"
      ? "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL."
      : "Use an HTTPS Supabase URL, or HTTP on localhost, without credentials, query parameters, or fragments.";
    expect(createSupabaseClient).toThrowError(new Error(message));
  });

  it("rejects privileged keys before initializing the SDK", () => {
    configureClient();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_synthetic_test_only");
    expect(createSupabaseClient).toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must contain a Supabase publishable key.");
  });

  it("permits an HTTP loopback URL for future local Supabase development", () => {
    configureClient();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    expect(createSupabaseClient).not.toThrow();
  });
});
