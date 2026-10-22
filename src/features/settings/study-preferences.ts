import { z } from "zod";
import { pathSelectionShape, validPathSelection } from "@/features/curriculum/career-path-selection";

/** Accept supported IANA names/aliases, never arbitrary numeric UTC offsets. */
export function isTimeZone(value: string) {
  if (value !== "UTC" && !/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+.-]+)+$/.test(value)) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(0); return true; }
  catch { return false; }
}

/** Validate a calendar date without interpreting it as an instant in any timezone. */
export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

export const studyPreferencesSchema = z.object({
  dailyMinutes: z.number().int().min(5, "Choose 5–240 whole minutes.").max(240, "Choose 5–240 whole minutes."),
  explanationLevel: z.enum(["beginner", "intermediate", "advanced"]),
  theme: z.enum(["light", "dark"]),
  timezone: z.string().max(100).refine(isTimeZone, "Choose a valid IANA timezone, such as America/Indiana/Indianapolis."),
  interviewDate: z.string().refine(isCalendarDate, "Choose a real calendar date.").nullable(),
});
export type StudyPreferences = z.infer<typeof studyPreferencesSchema>;
export const defaultStudyPreferences: StudyPreferences = {
  dailyMinutes: 30, explanationLevel: "beginner", theme: "light", timezone: "UTC", interviewDate: null,
};
export const preferenceMetadataKeys = {
  dailyMinutes: "daily_minutes", explanationLevel: "explanation_level", theme: "theme", timezone: "timezone", interviewDate: "interview_date",
} as const;

export const preferencesUpdateSchema = studyPreferencesSchema.extend(pathSelectionShape).partial().strict()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), "Choose preferences to save.")
  .refine((value) => value.careerPathId === undefined && value.selectedCareerPathIds === undefined || validPathSelection(value), "Save distinct selected paths and their primary path together.");

/** Validate each field independently so one legacy/bad value does not erase other preferences. */
export function readStudyPreferences(metadata: Record<string, unknown>): StudyPreferences {
  const read = <K extends keyof StudyPreferences>(key: K): StudyPreferences[K] => {
    const result = studyPreferencesSchema.shape[key].safeParse(metadata[preferenceMetadataKeys[key]]);
    return (result.success ? result.data : defaultStudyPreferences[key]) as StudyPreferences[K];
  };
  return { dailyMinutes: read("dailyMinutes"), explanationLevel: read("explanationLevel"), theme: read("theme"), timezone: read("timezone"), interviewDate: read("interviewDate") };
}

/** Count calendar days in the selected zone, including across DST and the international date line. */
export function interviewDaysRemaining(date: string, timezone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", calendar: "iso8601", numberingSystem: "latn" }).formatToParts(now);
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === name)!.value;
  const today = `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
  // UTC midnights here are only calendar ordinals for subtraction, not interview timestamps.
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export type PreferencesResult = { status: "success" | "error"; message: string };
