import { careerPaths } from "@/data/mock/curriculum";

export function isCareerPathId(value: unknown): value is string {
  return typeof value === "string" && careerPaths.some((path) => path.id === value);
}

/** User-editable metadata chooses a study focus; it never grants access to data. */
export function getCareerPath(value: unknown) {
  return careerPaths.find((path) => path.id === value) ?? careerPaths[0];
}
