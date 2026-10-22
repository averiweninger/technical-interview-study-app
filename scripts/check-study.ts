import { getSupabaseConfig } from "../src/lib/supabase/client.ts";
import { getStudySecretKey, StudyConfigurationError } from "../src/server/learning/configuration.ts";

// Local configuration validation only: no network, account access, database reads, or writes.
// Node loads the selected environment; this check never prints values or raw exceptions.
let valid = true;
try {
  getSupabaseConfig();
  console.log("PASS: public Supabase configuration has the expected format.");
} catch {
  valid = false;
  console.error("FAIL: configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
}
try {
  getStudySecretKey();
  console.log("PASS: server-only study key has the expected format.");
} catch (error) {
  valid = false;
  const code = error instanceof StudyConfigurationError ? error.code : "configuration_unavailable";
  console.error(`FAIL: ${code}. Set SUPABASE_SECRET_KEY using the same project's server secret key, then restart Next.js.`);
}
console.log("No credentials were displayed. No remote connection was tested; key validity, project matching, grants, and hosted persistence still require verification.");
process.exitCode = valid ? 0 : 1;
