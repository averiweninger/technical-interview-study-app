import "server-only";
import { createSupabaseClient } from "./client";

/** Creates a fresh anonymous server client; never shares mutable auth state between requests. */
export function createSupabaseServerClient() {
  // Cookie-based user sessions and verified identity belong to the later auth step.
  return createSupabaseClient();
}
