import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppOrigin, isAllowedOrigin } from "@/server/auth/config";
import { authorizeRecovery, clearRecovery } from "@/server/auth/recovery";
import { createAuthRateLimiter } from "@/server/auth/rate-limit";

const allowCallback = createAuthRateLimiter();

/** Recovery has a fixed destination and requires an OTP explicitly verified as recovery. */
export async function GET(request: NextRequest) {
  let origin: string;
  try { origin = getAppOrigin(); } catch { return new NextResponse("Recovery is temporarily unavailable.", { status: 503 }); }
  const response = (path: string) => {
    const result = NextResponse.redirect(new URL(path, origin));
    result.headers.set("Cache-Control", "private, no-store");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  };
  try {
    const host = request.headers.get("host") ?? request.nextUrl.host;
    if (!isAllowedOrigin(`${new URL(origin).protocol}//${host}`)) return response("/forgot-password?status=invalid-link");
    await clearRecovery();
    const params = request.nextUrl.searchParams;
    const token = params.get("token_hash");
    if (!token || token.length > 512 || params.getAll("token_hash").length !== 1 || params.get("type") !== "recovery" || params.has("code") || params.has("error")) return response("/forgot-password?status=invalid-link");
    const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "shared" : "shared";
    if (!allowCallback(token, ip)) return response("/forgot-password?status=invalid-link");
    const client = await createSupabaseServerClient();
    const result = await client.auth.verifyOtp({ token_hash: token, type: "recovery" });
    if (result.error || !result.data.session || !result.data.user) return response("/forgot-password?status=invalid-link");
    const verified = await client.auth.getUser();
    if (verified.error || verified.data.user?.id !== result.data.user.id) return response("/forgot-password?status=invalid-link");
    await authorizeRecovery(verified.data.user.id, result.data.session.access_token);
    return response("/reset-password");
  } catch { return response("/forgot-password?status=invalid-link"); }
}
