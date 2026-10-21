import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./client";
import { authCookieOptions } from "@/server/auth/config";

/** Request-scoped SSR client. The proxy persists refreshed cookies before Server Components render. */
export async function createSupabaseServerClient({ readOnly = false }: { readOnly?: boolean } = {}) {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch (error) {
          // Server Components cannot write cookies; proxy refresh covers their read-only context.
          if (!readOnly) throw error;
        }
      },
    },
  });
}
