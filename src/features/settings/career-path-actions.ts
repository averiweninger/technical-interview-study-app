"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedOrigin } from "@/server/auth/config";
import { createAuthRateLimiter } from "@/server/auth/rate-limit";
import { isCareerPathId } from "@/features/curriculum/career-path-selection";

const inputSchema = z.object({ pathId: z.string().max(100).refine(isCareerPathId) }).strict();
const allowPathUpdate = createAuthRateLimiter();
type PathResult = { status: "success" | "error"; message: string };

/** Existing Auth metadata supports a durable preference without changing database schemas. */
export async function saveCareerPath(input: unknown): Promise<PathResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Choose one of the available career paths." };
  try {
    const request = await headers();
    if (!isAllowedOrigin(request.get("origin"))) return { status: "error", message: "This request could not be verified. Reload and try again." };
    const client = await createSupabaseServerClient();
    const identity = await client.auth.getUser();
    if (identity.error || !identity.data.user) return { status: "error", message: "Sign in again before changing your career path." };
    const actor = identity.data.user;
    const ip = process.env.VERCEL === "1" ? request.get("x-vercel-forwarded-for") ?? "shared" : "shared";
    if (!allowPathUpdate(actor.id, ip)) return { status: "error", message: "Too many path changes. Please wait a few minutes and try again." };
    const saved = await client.auth.updateUser({ data: { career_path_id: parsed.data.pathId } });
    if (saved.error || saved.data.user?.id !== actor.id || saved.data.user.user_metadata?.career_path_id !== parsed.data.pathId) {
      return { status: "error", message: "Your career path could not be saved. Please try again." };
    }
    revalidatePath("/", "layout");
    return { status: "success", message: "Career path saved to your account." };
  } catch {
    return { status: "error", message: "Your career path could not be saved. Please try again." };
  }
}
