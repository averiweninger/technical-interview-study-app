import { createClient } from "@supabase/supabase-js";

/** Reads public configuration without logging environment values. Shared by both client factories. */
export function getSupabaseConfig() {
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

  return { url, publishableKey };
}

/** Stateless public client for tooling. User sessions use the server-only SSR factory instead. */
export function createSupabaseClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
