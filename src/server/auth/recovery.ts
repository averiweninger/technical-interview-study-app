import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authCookieOptions, getAppOrigin } from "./config";
import { getStudySecretKey } from "@/server/learning/configuration";

export const recoveryCookie = "ic-recovery";
const lifetime = 10 * 60;
const grantSchema = z.object({ actor: z.uuid(), token: z.string().length(64), expires: z.number().int() }).strict();
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const signature = (payload: string) => createHmac("sha256", getStudySecretKey()).update(`password-recovery-v1:${getAppOrigin()}:${payload}`).digest();

/** Only the successful recovery OTP callback issues this session-bound authorization. */
export async function authorizeRecovery(actor: string, token: string) {
  const payload = Buffer.from(JSON.stringify({ actor, token: digest(token), expires: Math.floor(Date.now() / 1000) + lifetime })).toString("base64url");
  (await cookies()).set(recoveryCookie, `${payload}.${signature(payload).toString("base64url")}`, { ...authCookieOptions(), maxAge: lifetime });
}

export async function clearRecovery() {
  (await cookies()).set(recoveryCookie, "", { ...authCookieOptions(), maxAge: 0 });
}

/** getSession is used solely to bind a signed grant; fresh getUser remains the identity check. */
export async function getRecoveryAccess(readOnly = true) {
  try {
    const value = (await cookies()).get(recoveryCookie)?.value;
    if (!value || value.length > 1024) return null;
    const parts = value.split(".");
    if (parts.length !== 2) return null;
    const expected = signature(parts[0]);
    const supplied = Buffer.from(parts[1], "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    const grant = grantSchema.parse(JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")));
    if (grant.expires <= Math.floor(Date.now() / 1000)) return null;
    const client = await createSupabaseServerClient({ readOnly });
    const identity = await client.auth.getUser();
    if (identity.error || identity.data.user?.id !== grant.actor) return null;
    const session = await client.auth.getSession();
    if (session.error || !session.data.session || digest(session.data.session.access_token) !== grant.token) return null;
    return { client, actor: grant.actor };
  } catch { return null; }
}
