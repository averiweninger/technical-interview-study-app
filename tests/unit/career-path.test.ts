import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveCareerPath } from "../../src/features/settings/career-path-actions";
import { accountProfile } from "../../src/features/auth/profile";
import { summarizeProgress } from "../../src/features/progress/summarize-progress";

const mocks = vi.hoisted(() => ({ headers: vi.fn(), client: vi.fn(), getUser: vi.fn(), updateUser: vi.fn(), allow: vi.fn(), revalidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("@/server/auth/rate-limit", () => ({ createAuthRateLimiter: () => mocks.allow }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_URL", "http://localhost:3000");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.allow.mockReturnValue(true);
  mocks.client.mockResolvedValue({ auth: { getUser: mocks.getUser, updateUser: mocks.updateUser } });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "actor" } }, error: null });
  mocks.updateUser.mockResolvedValue({ data: { user: { id: "actor", user_metadata: { career_path_id: "business-analytics" } } }, error: null });
});

describe("saved career path", () => {
  it("reads a known saved path and falls back safely for missing or invalid metadata", () => {
    expect(accountProfile({ id: "actor", user_metadata: { career_path_id: "business-analytics", id: "other" } })).toMatchObject({ id: "actor", careerPathId: "business-analytics" });
    for (const value of [undefined, "unknown", { id: "business-analytics" }]) {
      expect(accountProfile({ id: "actor", user_metadata: { career_path_id: value } }).careerPathId).toBe("software-engineering");
    }
  });
  it("saves only the authenticated actor's path and invalidates the workspace", async () => {
    expect(await saveCareerPath({ pathId: "business-analytics" })).toMatchObject({ status: "success" });
    expect(mocks.updateUser).toHaveBeenCalledWith({ data: { career_path_id: "business-analytics" } });
    expect(mocks.getUser.mock.invocationCallOrder[0]).toBeLessThan(mocks.updateUser.mock.invocationCallOrder[0]);
    expect(mocks.revalidate).toHaveBeenCalledWith("/", "layout");
  });
  it("rejects invalid paths, owner injection, foreign origins, and anonymous mutations", async () => {
    for (const input of [{ pathId: "unknown" }, { pathId: "business-analytics", user_id: "other" }, null]) {
      expect(await saveCareerPath(input)).toMatchObject({ status: "error" });
    }
    expect(mocks.client).not.toHaveBeenCalled();
    mocks.headers.mockResolvedValueOnce(new Headers({ origin: "https://other.example.test" }));
    expect(await saveCareerPath({ pathId: "business-analytics" })).toMatchObject({ status: "error" });
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await saveCareerPath({ pathId: "business-analytics" })).toMatchObject({ status: "error" });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("does not report success on rate limits, wrong-actor responses, or unconfirmed metadata", async () => {
    mocks.allow.mockReturnValueOnce(false);
    expect(await saveCareerPath({ pathId: "business-analytics" })).toMatchObject({ status: "error" });
    expect(mocks.updateUser).not.toHaveBeenCalled();
    for (const user of [{ id: "other", user_metadata: { career_path_id: "business-analytics" } }, { id: "actor", user_metadata: {} }]) {
      mocks.updateUser.mockResolvedValue({ data: { user }, error: null });
      expect(await saveCareerPath({ pathId: "business-analytics" })).toMatchObject({ status: "error" });
    }
    mocks.updateUser.mockRejectedValue(new Error("private provider detail"));
    const failed = await saveCareerPath({ pathId: "business-analytics" });
    expect(failed.status).toBe("error");
    expect(JSON.stringify(failed)).not.toContain("private provider detail");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("recommends lessons in the selected path without erasing shared completion", () => {
    const records = [{ slug: "python-variables", status: "started" as const, resumeSection: 1, updatedAt: "2026-10-22T10:00:00.000Z" }];
    expect(summarizeProgress(records, [], new Date(), "business-analytics").continueLesson?.id).toBe("sql-select");
    expect(summarizeProgress(records, [], new Date(), "software-engineering").continueLesson).toMatchObject({ id: "python-variables", section: 1 });
    const finished = [{ ...records[0], status: "completed" as const }];
    expect(summarizeProgress(finished, [], new Date(), "business-analytics").completedLessons).toBe(1);
  });
});
