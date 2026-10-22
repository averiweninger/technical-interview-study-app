import { careerPaths } from "@/data/mock/curriculum";
import { z } from "zod";

export const pathSelectionShape = {
  careerPathId: z.string().max(100).refine(isCareerPathId, "Choose an available primary path."),
  selectedCareerPathIds: z.array(z.string().max(100).refine(isCareerPathId, "Choose available career paths.")).min(1, "Select at least one career path.").max(careerPaths.length),
};
export function validPathSelection(value: { careerPathId?: string; selectedCareerPathIds?: string[] }) {
  return value.careerPathId !== undefined && value.selectedCareerPathIds !== undefined &&
    new Set(value.selectedCareerPathIds).size === value.selectedCareerPathIds.length && value.selectedCareerPathIds.includes(value.careerPathId);
}
export const pathSelectionSchema = z.object(pathSelectionShape).strict().refine(validPathSelection, "Select distinct paths and choose a primary path from that selection.");
export type PathSelection = z.infer<typeof pathSelectionSchema>;

/** Legacy primary-only accounts need no migration. Invalid metadata is display data, never authority. */
export function readPathSelection(metadata: Record<string, unknown>): PathSelection {
  const parsed = pathSelectionSchema.safeParse({ careerPathId: metadata.career_path_id, selectedCareerPathIds: metadata.selected_career_path_ids });
  if (parsed.success) return parsed.data;
  const careerPathId = getCareerPath(metadata.career_path_id).id;
  return { careerPathId, selectedCareerPathIds: [careerPathId] };
}

export function isCareerPathId(value: unknown): value is string {
  return typeof value === "string" && careerPaths.some((path) => path.id === value);
}

/** User-editable metadata chooses a study focus; it never grants access to data. */
export function getCareerPath(value: unknown) {
  return careerPaths.find((path) => path.id === value) ?? careerPaths[0];
}
