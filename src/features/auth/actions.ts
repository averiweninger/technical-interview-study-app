"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedOrigin } from "@/server/auth/config";
import { allowAuthAttempt } from "@/server/auth/rate-limit";
import { requireUser } from "@/server/auth/session";
import { loginSchema, signupSchema, safeNextPath, type AuthFormState } from "./validation";

const unavailable: AuthFormState = { status: "error", message: "Authentication is temporarily unavailable. Please try again shortly." };

export async function submitCredentials(mode: "login" | "signup", _previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (mode !== "login" && mode !== "signup") return unavailable;
  const input = (mode === "signup" ? signupSchema : loginSchema).safeParse({
    email: typeof formData.get("email") === "string" ? String(formData.get("email")).trim() : null,
    password: formData.get("password"),
    ...(mode === "signup" ? { firstName: formData.get("firstName"), lastName: formData.get("lastName") } : {}),
  });
  if (!input.success) {
    return { status: "error", message: "Check the highlighted fields.", fields: Object.fromEntries(
      input.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
    ) };
  }

  const next = safeNextPath(formData.get("next"));
  let signedIn = false;
  try {
    const requestHeaders = await headers();
    const origin = requestHeaders.get("origin");
    if (!isAllowedOrigin(origin)) return { status: "error", message: "This request could not be verified. Reload the page and try again." };
    // Only trust IP metadata when Vercel is the ingress. Self-hosted development shares a bucket.
    const ip = process.env.VERCEL === "1" ? requestHeaders.get("x-vercel-forwarded-for") ?? "shared" : "shared";
    if (!allowAuthAttempt(input.data.email, ip)) return { status: "error", message: "Too many attempts. Please wait 10 minutes before trying again." };
    const supabase = await createSupabaseServerClient();
    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword(input.data);
      if (error) {
        if (error.status === 429) return { status: "error", message: "Too many attempts. Please wait before trying again." };
        if (error.status && error.status >= 500) return unavailable;
        return { status: "error", message: "Email or password is incorrect, or the email address still needs confirmation." };
      }
      signedIn = !!data.session;
    } else {
      const names = signupSchema.parse(input.data);
      const { data, error } = await supabase.auth.signUp({
        email: names.email, password: names.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: { first_name: names.firstName, last_name: names.lastName },
        },
      });
      // Only an explicit provider error permits disclosure; never infer it from fake/empty identities.
      if (error?.code === "user_already_exists") return { status: "error", message: "An account with this email already exists. Please log in instead." };
      if (error) {
        if (error.status === 429) return { status: "error", message: "Too many requests. Please wait before trying again." };
        if (error.code === "weak_password") return { status: "error", message: "Choose a stronger password that meets the account password policy." };
        return unavailable;
      }
      signedIn = !!data.session;
      if (!signedIn) return { status: "confirmation", message: "If this address can be registered, a confirmation link will arrive shortly. If you already have an account, sign in." };
    }
  } catch {
    return unavailable;
  }
  // Next.js redirects throw internally; keep them outside provider error handling.
  if (signedIn) {
    revalidatePath("/", "layout");
    redirect(next);
  }
  return unavailable;
}

export async function logout(): Promise<AuthFormState> {
  try {
    if (!isAllowedOrigin((await headers()).get("origin"))) {
      return { status: "error", message: "This request could not be verified. Reload the page and try again." };
    }
  } catch { return unavailable; }
  await requireUser();
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { status: "error", message: "Sign out could not be completed. Please try again." };
  } catch { return unavailable; }
  revalidatePath("/", "layout");
  redirect("/login?status=signed-out");
}
