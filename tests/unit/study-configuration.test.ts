import { afterEach, describe, expect, it, vi } from "vitest";
import { getStudySecretKey, StudyConfigurationError } from "../../src/server/learning/configuration";

vi.mock("server-only", () => ({}));
afterEach(() => vi.unstubAllEnvs());

describe("server-only study configuration", () => {
  it("distinguishes a missing key from invalid or copied placeholder configuration", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(getStudySecretKey).toThrowError(new StudyConfigurationError("server_key_missing"));
    for (const key of ["sb_secret_", "sb_publishable_synthetic", "sb_secret_replace_with_your_server_only_key", "sb_secret_DISPOSABLE_PLACEHOLDER"]) {
      vi.stubEnv("SUPABASE_SECRET_KEY", key);
      expect(getStudySecretKey).toThrowError(new StudyConfigurationError("server_key_invalid"));
    }
  });
  it("returns only a server secret with trimmed whitespace and never embeds it in errors", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "  sb_secret_synthetic_unit_only  ");
    expect(getStudySecretKey()).toBe("sb_secret_synthetic_unit_only");
    vi.stubEnv("SUPABASE_SECRET_KEY", "private-invalid-value");
    expect(getStudySecretKey).toThrowError("server_key_invalid");
    expect(getStudySecretKey).not.toThrowError("private-invalid-value");
  });
});
