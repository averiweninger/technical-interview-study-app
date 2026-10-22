import { getCareerPath } from "@/features/curriculum/career-path-selection";
import { readStudyPreferences, type StudyPreferences } from "@/features/settings/study-preferences";

export interface AccountProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  pendingEmail: string;
  careerPathId: string;
  studyPreferences: StudyPreferences;
}

/** Metadata is editable display data, never an authorization source. Older accounts may have no names. */
export function accountProfile(user: { id: string; email?: string; new_email?: string; user_metadata?: Record<string, unknown> }): AccountProfile {
  const metadata = user.user_metadata ?? {};
  const text = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 160) : "";
  const firstName = text(metadata.first_name);
  const lastName = text(metadata.last_name);
  return {
    id: user.id, email: user.email ?? "", firstName, lastName,
    displayName: [firstName, lastName].filter(Boolean).join(" ") || text(metadata.full_name) || text(metadata.name) || "Learner",
    pendingEmail: user.new_email ?? "",
    careerPathId: getCareerPath(metadata.career_path_id).id,
    studyPreferences: readStudyPreferences(metadata),
  };
}
