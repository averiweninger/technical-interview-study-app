"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppOrigin, isAllowedOrigin } from "@/server/auth/config";
import { createAuthRateLimiter } from "@/server/auth/rate-limit";
import { clearRecovery, getRecoveryAccess } from "@/server/auth/recovery";
import { emailSchema, signupSchema, type AuthFormState } from "./validation";
import { z } from "zod";
import { getStudySecretKey } from "@/server/learning/configuration";

const allowRequest = createAuthRateLimiter();
const allowUpdate = createAuthRateLimiter();
const passwordSchema = z.object({ password: signupSchema.shape.password, confirmPassword: z.string() })
  .refine((input) => input.password === input.confirmPassword, { message: "Passwords must match.", path: ["password"] });
const neutral: AuthFormState = { status: "confirmation", message: "If an account can receive recovery email at this address, a link will arrive shortly. Check your spam folder. You can request a new link if needed." };
const failure: AuthFormState = { status: "error", message: "Recovery is temporarily unavailable. Please try again shortly." };

async function requestContext() {
  const request = await headers();
  return isAllowedOrigin(request.get("origin"))
    ? { ip: process.env.VERCEL === "1" ? request.get("x-vercel-forwarded-for") ?? "shared" : "shared" } : null;
}

export async function requestPasswordRecovery(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { status: "error", message: "Enter a valid email address.", fields: { email: "Enter a valid email address." } };
  try {
    const context = await requestContext();
    if (!context) return { status: "error", message: "This request could not be verified. Reload and try again." };
    if (!allowRequest(email.data, context.ip)) return { status: "error", message: "Too many requests. Please wait 10 minutes and try again." };
    getStudySecretKey(); // Do not send a link the callback cannot authorize in this environment.
    const client = await createSupabaseServerClient();
    // Provider/account-specific responses must not become an account-existence oracle.
    await client.auth.resetPasswordForEmail(email.data, { redirectTo: `${getAppOrigin()}/auth/recovery` });
    return neutral;
  } catch { return failure; }
}

export async function updateRecoveredPassword(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const parsed = passwordSchema.safeParse({ password: form.get("password"), confirmPassword: form.get("confirmPassword") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message, fields: { password: parsed.error.issues[0].message } };
  try {
    const context = await requestContext();
    if (!context) return { status: "error", message: "This request could not be verified. Reload and try again." };
    const access = await getRecoveryAccess(false);
    if (!access) return { status: "error", message: "This recovery session is invalid or has expired. Request a new recovery link." };
    if (!allowUpdate(access.actor, context.ip)) return { status: "error", message: "Too many attempts. Please wait before trying again." };
    const result = await access.client.auth.updateUser({ password: parsed.data.password });
    if (result.error || result.data.user?.id !== access.actor) return { status: "error", message: "Your password could not be updated. Try a different password meeting the account policy, or request a new link." };
    await clearRecovery();
    // Password success is already committed. A sign-out failure must not invite another password write.
    try { await access.client.auth.signOut({ scope: "global" }); } catch { /* Recovery grant is already removed. */ }
  } catch { return failure; }
  // Redirect outside the catch: clearing cookies rerenders this route without recovery access.
  redirect("/login?status=password-updated");
}
