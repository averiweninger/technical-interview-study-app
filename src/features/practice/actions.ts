"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { isAllowedOrigin } from "@/server/auth/config";
import { getPracticeSubmission, submitPracticeAnswer } from "@/server/learning/practice-progress";
import type { PracticeResult } from "./types";

export async function practiceAction(mode: "load" | "submit", input: unknown): Promise<PracticeResult> {
  try {
    const request = await headers();
    if (!isAllowedOrigin(request.get("origin")) || (mode !== "load" && mode !== "submit")) return { status: "error", message: "This request could not be verified. Reload and try again." };
    const ip = process.env.VERCEL === "1" ? request.get("x-vercel-forwarded-for") ?? "shared" : "shared";
    const result = mode === "load" ? await getPracticeSubmission(input) : await submitPracticeAnswer(input, ip);
    if (mode === "submit" && result.status === "saved") {
      revalidatePath("/dashboard"); revalidatePath("/progress");
    }
    return result;
  } catch { return { status: "error", message: "Your answer could not be saved. Please retry." }; }
}
