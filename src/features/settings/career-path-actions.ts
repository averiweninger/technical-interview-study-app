"use server";

import { pathSelectionSchema } from "@/features/curriculum/career-path-selection";
import { saveStudyPreferences } from "./preference-actions";

/** Both path fields always share one validated, owner-verified metadata update. */
export async function saveCareerPath(input: unknown) {
  const parsed = pathSelectionSchema.safeParse(input);
  if (!parsed.success) return { status: "error" as const, message: "Select distinct available paths and a primary path from that selection." };
  const result = await saveStudyPreferences(parsed.data);
  return result.status === "success" ? { status: "success" as const, message: "Career paths saved to your account." } : result;
}
