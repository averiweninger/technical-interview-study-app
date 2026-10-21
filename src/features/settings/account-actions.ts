"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedOrigin } from "@/server/auth/config";
import { allowAuthAttempt } from "@/server/auth/rate-limit";
import { emailSchema, profileSchema } from "@/features/auth/validation";

export type AccountFormState = { status: "idle" } | { status: "success" | "error"; message: string };

/** Each mutation verifies its actor afresh. Never accept account IDs or trust metadata for access. */
export async function updateAccount(mode: "profile" | "email", _previous: AccountFormState, formData: FormData): Promise<AccountFormState> {
  if (mode !== "profile" && mode !== "email") return { status: "error", message: "Invalid account operation." };
  if (formData.has("userId") || formData.has("user_id") || formData.has("id")) {
    return { status: "error", message: "Account updates cannot target another user." };
  }
  const profile = profileSchema.safeParse({ firstName: formData.get("firstName"), lastName: formData.get("lastName") });
  const email = emailSchema.safeParse(formData.get("email"));
  if (mode === "profile" ? !profile.success : !email.success) {
    return { status: "error", message: mode === "profile" ? "Enter a first and last name of at most 80 characters each." : "Enter a valid email address." };
  }
  try {
    const requestHeaders = await headers();
    const origin = requestHeaders.get("origin");
    if (!isAllowedOrigin(origin)) return { status: "error", message: "This request could not be verified. Reload the page and try again." };
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { status: "error", message: "Your session has ended. Sign in again before updating your account." };
    const ip = process.env.VERCEL === "1" ? requestHeaders.get("x-vercel-forwarded-for") ?? "shared" : "shared";
    // Account mutations have their own IP bucket so they do not consume the public sign-in budget.
    if (!allowAuthAttempt(`account:${data.user.id}`, `account:${ip}`)) return { status: "error", message: "Too many account updates. Please wait 10 minutes before trying again." };
    if (mode === "profile" && profile.success) {
      const result = await supabase.auth.updateUser({ data: { first_name: profile.data.firstName, last_name: profile.data.lastName } });
      if (result.error || !result.data.user || result.data.user.id !== data.user.id) {
        return { status: "error", message: "Your name could not be saved. Please try again." };
      }
      revalidatePath("/", "layout");
      return { status: "success", message: "Your name has been updated." };
    }
    if (email.success) {
      if (email.data === data.user.email?.toLowerCase()) return { status: "error", message: "Enter a different email address." };
      const result = await supabase.auth.updateUser({ email: email.data }, {
        emailRedirectTo: `${origin}/auth/callback?next=%2Fsettings&flow=email-change`,
      });
      if (result.error || !result.data.user || result.data.user.id !== data.user.id) {
        return { status: "error", message: "The email change could not be requested. Check the address or try again later." };
      }
      revalidatePath("/", "layout");
      return { status: "success", message: result.data.user.email === email.data && !result.data.user.new_email
        ? "Your email address has been updated."
        : "Email change requested. Check your current and new inboxes and complete all confirmation links. Your current email stays active until confirmation is complete." };
    }
  } catch {
    return { status: "error", message: "Your account could not be updated right now. Please try again." };
  }
  return { status: "error", message: "Invalid account update." };
}
