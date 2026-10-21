import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./client";
import { authCookieOptions } from "@/server/auth/config";
import { isProtectedPath, safeNextPath } from "@/features/auth/validation";

/** Refresh before rendering and propagate every cookie to both the request and final response. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let authenticated = false;
  let unavailable = false;
  try {
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createServerClient(url, publishableKey, {
      cookieOptions: authCookieOptions(),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          const previousCookies = response.cookies.getAll();
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          // Rebuild Next's request-header overrides after refresh so the render sees the new token.
          response = NextResponse.next({ request });
          previousCookies.forEach((cookie) => response.cookies.set(cookie));
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    // getUser validates against Supabase and observes account changes, unlike a local cookie decode.
    const { data, error } = await supabase.auth.getUser();
    authenticated = !error && !!data.user;
    unavailable = !!error && (error.status ?? 0) >= 500;
  } catch {
    unavailable = true;
  }

  if (isProtectedPath(request.nextUrl.pathname) && !authenticated) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/login";
    destination.search = "";
    destination.searchParams.set("next", safeNextPath(request.nextUrl.pathname + request.nextUrl.search));
    if (unavailable) destination.searchParams.set("status", "unavailable");
    const redirected = NextResponse.redirect(destination);
    response.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
    response = redirected;
  }
  // Auth and Set-Cookie responses must never enter shared/CDN caches.
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
