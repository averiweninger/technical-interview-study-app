"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { isAllowedOrigin } from "@/server/auth/config";
import { getLessonProgress, saveLessonProgress } from "@/server/learning/lesson-progress";
import type { LessonProgressResult } from "./lesson-progress-types";

export async function updateLessonProgress(input: unknown): Promise<LessonProgressResult> {
  try {
    const request = await headers();
    if (!isAllowedOrigin(request.get("origin"))) return { status: "error", message: "This request could not be verified. Reload the page and try again." };
    const ip = process.env.VERCEL === "1" ? request.get("x-vercel-forwarded-for") ?? "shared" : "shared";
    const result = await saveLessonProgress(input, ip);
    if (result.status === "ready") {
      revalidatePath("/dashboard"); revalidatePath("/progress"); revalidatePath("/learn");
      revalidatePath("/learn/[topicSlug]", "page");
    }
    return result;
  } catch { return { status: "error", message: "Your progress could not be saved. Please try again." }; }
}

export async function reloadLessonProgress(lessonId: string): Promise<LessonProgressResult> {
  try {
    if (!isAllowedOrigin((await headers()).get("origin"))) return { status: "error", message: "This request could not be verified. Reload the page and try again." };
    return await getLessonProgress(lessonId);
  } catch { return { status: "error", message: "Your progress could not be loaded. Please try again." }; }
}
