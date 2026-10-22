import "server-only";

export class StudyConfigurationError extends Error {
  readonly code: "server_key_missing" | "server_key_invalid";

  constructor(code: "server_key_missing" | "server_key_invalid") {
    super(code);
    this.code = code;
    this.name = "StudyConfigurationError";
  }
}

/** Shared by the authenticated adapter and local setup check; never logs the value. */
export function getStudySecretKey() {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) throw new StudyConfigurationError("server_key_missing");
  if (!secret.startsWith("sb_secret_") || secret.length <= "sb_secret_".length || /replace_with|placeholder/i.test(secret)) {
    throw new StudyConfigurationError("server_key_invalid");
  }
  return secret;
}
