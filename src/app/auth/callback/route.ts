import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppOrigin, isAllowedOrigin } from "@/server/auth/config";
import { safeNextPath } from "@/features/auth/validation";

/** Supports PKCE email links and a token-hash email template; neither accepts external next URLs. */
export async function GET(request: NextRequest) {
  let origin: string;
  try { origin = getAppOrigin(); } catch {
    return new NextResponse("Authentication is temporarily unavailable. Please try again shortly.", { status: 503 });
  }
  const failure = () => NextResponse.redirect(new URL("/login?status=confirmation-error", origin));
  // Next.js may normalize the internal URL to localhost. Validate the incoming host against
  // configured origins, while always constructing the redirect from the trusted APP_URL.
  const host = request.headers.get("host") ?? request.nextUrl.host;
  if (!isAllowedOrigin(`${new URL(origin).protocol}//${host}`)) return failure();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const emailChange = type === "email_change" || request.nextUrl.searchParams.get("flow") === "email-change";
  if ((!code && !tokenHash) || (code && tokenHash) || (code && code.length > 2048) ||
      (tokenHash && (tokenHash.length > 512 || (type !== "email" && type !== "email_change")))) return failure();
  try {
    const supabase = await createSupabaseServerClient();
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type === "email_change" ? "email_change" : "email" });
    if (result.error) return failure();
    // Secure email changes can require two links. Do not claim completion or create a session early.
    if (emailChange && !result.data?.session) {
      return NextResponse.redirect(new URL("/login?status=email-change-pending&next=%2Fsettings", origin));
    }
  } catch { return failure(); }
  const destination = new URL(emailChange ? "/settings" : safeNextPath(request.nextUrl.searchParams.get("next")), origin);
  destination.searchParams.set("confirmation", emailChange ? "email" : "signup");
  return NextResponse.redirect(destination);
}
