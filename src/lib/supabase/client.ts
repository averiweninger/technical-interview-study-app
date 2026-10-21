import { createClient } from "@supabase/supabase-js";

/** Creates an anonymous client using only the project's public configuration. */
export function createSupabaseClient() {
  // Keep direct env references so Next.js can inline these public values in browser builds.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    // Never include environment values or the URL parser's original error in diagnostics.
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL.");
  }

  const isLocalHttp = parsedUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(parsedUrl.hostname);
  if ((!isLocalHttp && parsedUrl.protocol !== "https:") ||
      parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    throw new Error("Use an HTTPS Supabase URL, or HTTP on localhost, without credentials, query parameters, or fragments.");
  }

  // This utility must never accept a privileged secret/service-role key.
  if (!publishableKey.startsWith("sb_publishable_") || publishableKey.length <= "sb_publishable_".length) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must contain a Supabase publishable key.");
  }

  // Step 3A has no auth flow: do not read/store sessions, refresh tokens, or consume URL grants.
  // Construct lazily so the existing demo remains usable without Supabase configuration.
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
