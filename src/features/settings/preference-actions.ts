"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedOrigin } from "@/server/auth/config";
import { createAuthRateLimiter } from "@/server/auth/rate-limit";
import { preferenceMetadataKeys, preferencesUpdateSchema, type PreferencesResult } from "./study-preferences";
import { onboardingSchema } from "./onboarding";

const allowUpdate = createAuthRateLimiter();
const failed: PreferencesResult = { status: "error", message: "Your preferences could not be confirmed as saved. Please retry or reload to check your saved settings." };

/** Patch only known preference keys on the verified session owner; metadata never authorizes access. */
export async function saveStudyPreferences(input: unknown): Promise<PreferencesResult> {
  return savePreferences(input, false);
}

export async function completeOnboarding(input: unknown): Promise<PreferencesResult> {
  return savePreferences(input, true);
}

async function savePreferences(input: unknown, completing: boolean): Promise<PreferencesResult> {
  const parsed = (completing ? onboardingSchema : preferencesUpdateSchema).safeParse(input);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  try {
    const request = await headers();
    if (!isAllowedOrigin(request.get("origin"))) return { status: "error", message: "This request could not be verified. Reload and try again." };
    const client = await createSupabaseServerClient();
    const identity = await client.auth.getUser();
    if (identity.error || !identity.data.user) return { status: "error", message: "Sign in again before saving preferences." };
    const actor = identity.data.user;
    const ip = process.env.VERCEL === "1" ? request.get("x-vercel-forwarded-for") ?? "shared" : "shared";
    if (!allowUpdate(actor.id, ip)) return { status: "error", message: "Too many preference changes. Please wait a few minutes and try again." };
    const data: Record<string, string | number | string[] | null> = {};
    for (const key of Object.keys(preferenceMetadataKeys) as (keyof typeof preferenceMetadataKeys)[]) {
      const value = parsed.data[key];
      if (value !== undefined) data[preferenceMetadataKeys[key]] = value;
    }
    if (parsed.data.careerPathId !== undefined) {
      data.career_path_id = parsed.data.careerPathId;
      data.selected_career_path_ids = parsed.data.selectedCareerPathIds!;
    }
    if (completing) {
      data.onboarding_version = 1;
      data.onboarding_completed_version = 1;
    }
    // Supabase merges top-level metadata keys. Never send a stale copy of unrelated metadata.
    const result = await client.auth.updateUser({ data });
    const saved = result.data.user?.user_metadata;
    if (result.error || result.data.user?.id !== actor.id || !saved || typeof saved !== "object" || Array.isArray(saved) ||
      // Supabase deletes metadata keys set to null; both absent and explicit null mean cleared.
      Object.entries(data).some(([key, value]) => value === null ? saved[key] !== null && saved[key] !== undefined : JSON.stringify(saved[key]) !== JSON.stringify(value))) return failed;
    revalidatePath("/", "layout");
    return { status: "success", message: completing ? "Setup complete." : "Preferences saved to your account." };
  } catch { return failed; }
}
