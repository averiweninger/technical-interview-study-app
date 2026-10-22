import { beforeEach, describe, expect, it, vi } from "vitest";
import { pathSelectionSchema, readPathSelection } from "../../src/features/curriculum/career-path-selection";
import { hasSavedPaths, needsOnboarding, setupDestination } from "../../src/features/settings/onboarding";
import { completeOnboarding, saveStudyPreferences } from "../../src/features/settings/preference-actions";
import { defaultStudyPreferences } from "../../src/features/settings/study-preferences";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), update: vi.fn(), headers: vi.fn(), revalidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser, updateUser: mocks.update } }) }));
vi.mock("@/server/auth/rate-limit", () => ({ createAuthRateLimiter: () => () => true }));
const paths = { careerPathId: "data-science", selectedCareerPathIds: ["software-engineering", "data-science"] };
const savedPaths = { career_path_id: paths.careerPathId, selected_career_path_ids: paths.selectedCareerPathIds };
const metadata = { ...savedPaths, daily_minutes: 30, explanation_level: "beginner", theme: "light", timezone: "UTC" };

beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("APP_URL", "http://localhost:3000");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.getUser.mockResolvedValue({ data: { user: { id: "actor", user_metadata: { first_name: "Taylor", unrelated: "keep" } } }, error: null });
  mocks.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ data: { user: { id: "actor", user_metadata: data } }, error: null }));
});

describe("multiple paths and resumable setup", () => {
  it("reads legacy single-path accounts without requiring setup or migrating them", () => {
    expect(readPathSelection({ career_path_id: "business-analytics" })).toEqual({ careerPathId: "business-analytics", selectedCareerPathIds: ["business-analytics"] });
    expect(needsOnboarding({})).toBe(false);
    expect(needsOnboarding({ career_path_id: "business-analytics" })).toBe(false);
    expect(readPathSelection({ ...savedPaths, selected_career_path_ids: ["unknown"] }).selectedCareerPathIds).toEqual(["data-science"]);
  });
  it.each([
    { ...paths, selectedCareerPathIds: [] },
    { ...paths, selectedCareerPathIds: ["data-science", "data-science"] },
    { ...paths, selectedCareerPathIds: ["unknown", "data-science"] },
    { ...paths, careerPathId: "business-analytics" },
    { ...paths, selectedCareerPathIds: "data-science" },
    { ...paths, user_id: "victim" },
  ])("rejects invalid, conflicting, or owner-injected selections", async (input) => {
    expect(pathSelectionSchema.safeParse(input).success).toBe(false);
    expect(await saveStudyPreferences(input)).toMatchObject({ status: "error" });
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("never permits partial path updates and saves the pair in one metadata patch", async () => {
    expect(await saveStudyPreferences({ careerPathId: paths.careerPathId })).toMatchObject({ status: "error" });
    expect(await saveStudyPreferences({ selectedCareerPathIds: paths.selectedCareerPathIds })).toMatchObject({ status: "error" });
    expect(await saveStudyPreferences(paths)).toMatchObject({ status: "success" });
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ data: savedPaths });
  });
  it("resumes at preferences only after paths are saved; completion requires real validated values", () => {
    expect(hasSavedPaths({ career_path_id: "data-science" })).toBe(false);
    expect(hasSavedPaths(savedPaths)).toBe(true);
    expect(needsOnboarding({ onboarding_version: 1, ...savedPaths })).toBe(true);
    expect(needsOnboarding({ onboarding_version: 1, onboarding_completed_version: 1, ...savedPaths })).toBe(true);
    expect(needsOnboarding({ onboarding_version: 1, onboarding_completed_version: 1, ...metadata })).toBe(false);
    expect(needsOnboarding({ onboarding_version: 1, onboarding_completed_version: 1, ...metadata, timezone: "invalid" })).toBe(true);
  });
  it("validates completion server-side, preserves unrelated metadata via narrow patch, and supports retries", async () => {
    expect(await completeOnboarding(paths)).toMatchObject({ status: "error" });
    expect(mocks.update).not.toHaveBeenCalled();
    mocks.update.mockResolvedValueOnce({ data: { user: null }, error: { message: "private provider detail" } });
    const failed = await completeOnboarding({ ...paths, ...defaultStudyPreferences });
    expect(failed.status).toBe("error"); expect(JSON.stringify(failed)).not.toContain("private");
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(await completeOnboarding({ ...paths, ...defaultStudyPreferences })).toMatchObject({ status: "success" });
    expect(mocks.update).toHaveBeenLastCalledWith({ data: { ...metadata, interview_date: null, onboarding_version: 1, onboarding_completed_version: 1 } });
    expect(mocks.update.mock.calls[1][0].data).not.toHaveProperty("first_name");
    expect(mocks.update.mock.calls[1][0].data).not.toHaveProperty("unrelated");
  });
  it("rejects anonymous completion and unconfirmed selection or completion echoes", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect(await completeOnboarding({ ...paths, ...defaultStudyPreferences })).toMatchObject({ status: "error" });
    expect(mocks.update).not.toHaveBeenCalled();
    mocks.update.mockResolvedValueOnce({ data: { user: { id: "actor", user_metadata: { ...metadata, selected_career_path_ids: ["data-science"] } } }, error: null });
    expect(await completeOnboarding({ ...paths, ...defaultStudyPreferences })).toMatchObject({ status: "error" });
  });
  it("allows only internal destinations and prevents returning to setup in a loop", () => {
    for (const value of ["https://evil.test", "//evil.test", "/onboarding?next=/onboarding", "/login", "/%2f%2fevil.test"]) expect(setupDestination(value)).toBe("/dashboard");
    expect(setupDestination("/practice?topic=sql")).toBe("/practice?topic=sql");
  });
});
