import { pathSelectionSchema } from "@/features/curriculum/career-path-selection";
import { preferenceMetadataKeys, studyPreferencesSchema } from "./study-preferences";
import { safeNextPath } from "@/features/auth/validation";

export const onboardingSchema = studyPreferencesSchema.extend(pathSelectionSchema.shape).strict().refine(
  (value) => new Set(value.selectedCareerPathIds).size === value.selectedCareerPathIds.length && value.selectedCareerPathIds.includes(value.careerPathId),
  "Select distinct paths and choose a primary path from that selection.",
);
export function hasSavedPaths(metadata: Record<string, unknown>) {
  return pathSelectionSchema.safeParse({ careerPathId: metadata.career_path_id, selectedCareerPathIds: metadata.selected_career_path_ids }).success;
}
/** A routing preference for new signups, never a trusted authorization or learning projection. */
export function needsOnboarding(metadata: Record<string, unknown>) {
  if (metadata.onboarding_version !== 1) return false;
  const preferences = Object.fromEntries(Object.entries(preferenceMetadataKeys).map(([key, field]) => [key, metadata[field] ?? (key === "interviewDate" ? null : undefined)]));
  return metadata.onboarding_completed_version !== 1 || !onboardingSchema.safeParse({ ...preferences, careerPathId: metadata.career_path_id, selectedCareerPathIds: metadata.selected_career_path_ids }).success;
}
export function setupDestination(value: unknown) {
  const next = safeNextPath(value);
  return next.split("?")[0].startsWith("/onboarding") ? "/dashboard" : next;
}
